import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../../user/services/user.service';
import { nutritionService } from '../services/nutrition.service';
import { getNextGroqClient } from '../../../config/groq';
import { envConfig } from '../../../config/env';

export async function getPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const user = await userService.getUser(userId);

    const weight = user?.weight_kg || 75;
    const goal = user?.goal || 'Muscle Gain';
    const dietPref = user?.diet_pref || 'Indian High Protein';

    const proteinTarget = Math.round(weight * 2.2);
    const caloriesTarget = Math.round(weight * 32);
    const carbsTarget = Math.round((caloriesTarget * 0.45) / 4);
    const fatsTarget = Math.round((caloriesTarget * 0.25) / 9);

    let planData = await nutritionService.getDietPlan(userId);
    let meals = planData?.meals || [];

    if (!meals || meals.length === 0) {
      meals = [
        {
          tag: 'BREAKFAST • 8:00 AM',
          name: 'Paneer Bhurji & Moong Dal Chilla / Eggs',
          cals: '520 kcal',
          desc: '150g Paneer Bhurji, 2 Moong Dal Chillas or 4 Egg Whites, 100g Curd',
        },
        {
          tag: 'LUNCH • 1:00 PM',
          name: 'High Protein Chicken / Soya Chunk Curry & Rice',
          cals: '680 kcal',
          desc: '200g Chicken Breast or Soya Chunks, 1 Bowl Yellow Dal, 150g Rice, Salad',
        },
        {
          tag: 'SNACK / POST-WORKOUT • 5:30 PM',
          name: 'Moong Sprouts Chaat & Whey Protein Shake',
          cals: '360 kcal',
          desc: '1 Scoop Whey Protein, 100g Boiled Sprouts with Lemon, 15g Almonds',
        },
        {
          tag: 'DINNER • 8:30 PM',
          name: 'Grilled Chicken Tikka / Tawa Paneer & Chapatis',
          cals: '590 kcal',
          desc: '180g Chicken Tikka or Low-Fat Paneer, 2 Whole Wheat Chapatis, Cucumber Raita',
        },
      ];

      const { client } = getNextGroqClient();
      if (client) {
        try {
          const sysPrompt = `You are FitAI Pro Nutrition Engine. Generate a daily meal schedule for a user utilizing Indian diet options, local ingredients, and high-protein Indian cuisine (Daal, Paneer, Chana, Rajma, Soya Chunks, Rotis, Chicken Tikka, Curd, Sprouts, Oats). Respond strictly in JSON:
{
  "meals": [
    { "tag": string, "name": string, "cals": string, "desc": string }
  ]
}`;
          const userPrompt = `Create 4 high-protein Indian meal options for an athlete weighing ${weight}kg with goal "${goal}" and diet preference "${dietPref}". Target calories: ~${caloriesTarget} kcal.`;

          const groqRes = await client.chat.completions.create({
            messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
            model: envConfig.defaultModel,
            temperature: 0.7,
            response_format: { type: 'json_object' },
          });

          const parsed = JSON.parse(groqRes.choices[0]?.message?.content || '{}');
          if (Array.isArray(parsed.meals) && parsed.meals.length > 0) {
            meals = parsed.meals;
          }
        } catch {
          // Fallback to defaults
        }
      }

      planData = { meals, dietPref };
      await nutritionService.saveDietPlan(userId, planData);
    }

    const todayLogs = await nutritionService.getMealLogs(userId);
    let loggedProtein = 0;
    let loggedCarbs = 0;
    let loggedFats = 0;
    let loggedCalories = 0;

    todayLogs.forEach((m: any) => {
      loggedProtein += parseFloat(m.protein_g) || 0;
      loggedCarbs += parseFloat(m.carbs_g) || 0;
      loggedFats += parseFloat(m.fats_g) || 0;
      loggedCalories += parseFloat(m.calories) || 0;
    });

    res.json({
      success: true,
      data: {
        targets: {
          proteinG: proteinTarget,
          carbsG: carbsTarget,
          fatsG: fatsTarget,
          calories: caloriesTarget,
          proteinConsumedG: Math.round(loggedProtein),
          carbsConsumedG: Math.round(loggedCarbs),
          fatsConsumedG: Math.round(loggedFats),
          caloriesConsumed: Math.round(loggedCalories),
        },
        dietPref,
        meals,
        todayLogs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
