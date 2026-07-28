import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { getNextGroqClient } from '../../../config/groq';
import { envConfig } from '../../../config/env';

export async function calculateMacros(req: AuthenticatedRequest, res: Response) {
  try {
    const { foodItem = '100g raw daal', mealType = 'Breakfast' } = req.body;

    let proteinG = 24;
    let carbsG = 60;
    let fatsG = 2;
    let calories = 340;

    const { client } = getNextGroqClient();
    if (client) {
      try {
        const sysPrompt = `You are FitAI Indian & Global Macro Estimation Engine. Calculate exact protein (g), carbs (g), fats (g), and total calories for any Indian or global food item (e.g. "100g raw daal", "200g paneer", "3 rotis + 1 bowl chana", "2 eggs"). Respond strictly in JSON:
{
  "proteinG": number,
  "carbsG": number,
  "fatsG": number,
  "calories": number
}`;
        const userPrompt = `Calculate macros for: "${foodItem}" (logged as ${mealType})`;

        const groqRes = await client.chat.completions.create({
          messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
          model: envConfig.defaultModel,
          temperature: 0.2,
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(groqRes.choices[0]?.message?.content || '{}');
        if (typeof parsed.proteinG === 'number') {
          proteinG = Math.round(parsed.proteinG * 10) / 10;
          carbsG = Math.round((parsed.carbsG || 0) * 10) / 10;
          fatsG = Math.round((parsed.fatsG || 0) * 10) / 10;
          calories = Math.round(parsed.calories || (proteinG * 4 + carbsG * 4 + fatsG * 9));
        }
      } catch {
        // Fallback defaults
      }
    }

    res.json({
      success: true,
      data: { proteinG, carbsG, fatsG, calories, foodItem, mealType },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
