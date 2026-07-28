import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../../user/services/user.service';
import { nutritionService } from '../services/nutrition.service';
import { getNextGroqClient } from '../../../config/groq';
import { envConfig } from '../../../config/env';

export async function regeneratePlan(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const user = await userService.getUser(userId);

    const weight = user?.weight_kg || 75;
    const goal = user?.goal || 'Muscle Gain';
    const dietPref = req.body.dietPref || user?.diet_pref || 'Indian High Protein';

    const caloriesTarget = Math.round(weight * 32);

    let meals = [
      { tag: 'BREAKFAST • 8:00 AM', name: 'Egg Bhurji / Paneer Roll & Oats', cals: '540 kcal', desc: '3 Whole Eggs + 2 Whites / 120g Paneer, 60g Oats porridge with nuts' },
      { tag: 'LUNCH • 1:00 PM', name: 'Rajma / Chicken Curry & Brown Rice', cals: '700 kcal', desc: '1.5 Bowls Rajma or 200g Chicken Curry, 150g Brown Rice, Cucumber Raita' },
      { tag: 'SNACK / POST-WORKOUT • 5:30 PM', name: 'Roasted Chana & Whey Shake', cals: '370 kcal', desc: '50g Roasted Chana, 1 Scoop Whey Protein with water' },
      { tag: 'DINNER • 8:30 PM', name: 'Soya Chunk / Fish Curry & Missi Roti', cals: '610 kcal', desc: '150g Soya Chunks or Fish Curry, 2 Missi Rotis, Green Salad' },
    ];

    const { client } = getNextGroqClient();
    if (client) {
      try {
        const sysPrompt = `You are FitAI Pro Nutrition Engine. Generate a fresh custom 4-meal plan emphasizing Indian diet, local ingredients, and Indian cuisine. Respond strictly in JSON:
{
  "meals": [
    { "tag": string, "name": string, "cals": string, "desc": string }
  ]
}`;
        const userPrompt = `Generate a fresh new 4-meal Indian high-protein diet plan for an athlete weighing ${weight}kg with goal "${goal}". Target: ~${caloriesTarget} kcal.`;

        const groqRes = await client.chat.completions.create({
          messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
          model: envConfig.defaultModel,
          temperature: 0.8,
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(groqRes.choices[0]?.message?.content || '{}');
        if (Array.isArray(parsed.meals) && parsed.meals.length > 0) {
          meals = parsed.meals;
        }
      } catch {
        // Defaults
      }
    }

    const planData = { meals, dietPref };
    await nutritionService.saveDietPlan(userId, planData);

    res.json({ success: true, data: { meals, dietPref } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
