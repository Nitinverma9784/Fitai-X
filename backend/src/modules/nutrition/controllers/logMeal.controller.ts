import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { nutritionService } from '../services/nutrition.service';
import { userService } from '../../user/services/user.service';
import { getNextGroqClient } from '../../../config/groq';
import { envConfig } from '../../../config/env';

export async function logMeal(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const { mealType = 'Breakfast', foodItem = '100g raw daal', proteinG: preProtein, carbsG: preCarbs, fatsG: preFats, calories: preCals } = req.body;

    let proteinG = preProtein !== undefined && preProtein !== null ? parseFloat(preProtein) : NaN;
    let carbsG = preCarbs !== undefined && preCarbs !== null ? parseFloat(preCarbs) : NaN;
    let fatsG = preFats !== undefined && preFats !== null ? parseFloat(preFats) : NaN;
    let calories = preCals !== undefined && preCals !== null ? parseFloat(preCals) : NaN;

    // If pre-calculated macros were not provided or invalid, run AI calculation dynamically
    if (isNaN(proteinG)) {
      proteinG = 24;
      carbsG = 60;
      fatsG = 2;
      calories = 340;

      const { client } = getNextGroqClient();
      if (client) {
        try {
          const sysPrompt = `You are FitAI Indian & Global Macro Estimation Engine. Calculate exact protein (g), carbs (g), fats (g), and total calories for any Indian or global food item. Respond strictly in JSON: { "proteinG": number, "carbsG": number, "fatsG": number, "calories": number }`;
          const groqRes = await client.chat.completions.create({
            messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: `Calculate macros for: "${foodItem}" logged under ${mealType}` }],
            model: envConfig.defaultModel,
            temperature: 0.2,
            response_format: { type: 'json_object' },
          });
          const parsed = JSON.parse(groqRes.choices[0]?.message?.content || '{}');
          if (typeof parsed.proteinG === 'number') {
            proteinG = parsed.proteinG;
            carbsG = parsed.carbsG || 0;
            fatsG = parsed.fatsG || 0;
            calories = parsed.calories || Math.round(proteinG * 4 + carbsG * 4 + fatsG * 9);
          }
        } catch {
          // Fallback defaults
        }
      }
    }

    if (isNaN(carbsG)) carbsG = 0;
    if (isNaN(fatsG)) fatsG = 0;
    if (isNaN(calories)) calories = Math.round(proteinG * 4 + carbsG * 4 + fatsG * 9);

    // Save logged meal to DB
    const savedMeal = await nutritionService.logMeal(userId, { mealType, foodItem, proteinG, carbsG, fatsG, calories });

    // Award +3 XP for meal logging
    const xpResult = await userService.awardXp(userId, 3);

    res.json({
      success: true,
      data: { meal: savedMeal, proteinG, carbsG, fatsG, calories, xpEarned: 3, levelData: xpResult.levelData },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
