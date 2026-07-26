import { Router, Response } from 'express';
import { db } from '../core/database';
import { getNextGroqClient, config } from '../core/config';
import { authenticateToken, AuthenticatedRequest } from '../core/authMiddleware';
import { generateGroceryPlan } from '../services/groceryOptimizer';

const router = Router();

router.get('/plan', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const user = await db.getUser(userId);

    const weight = user?.weight_kg || 75;
    const goal = user?.goal || 'Muscle Gain';
    const dietPref = user?.diet_pref || 'Indian High Protein';

    const proteinTarget = Math.round(weight * 2.2);
    const caloriesTarget = Math.round(weight * 32);
    const carbsTarget = Math.round((caloriesTarget * 0.45) / 4);
    const fatsTarget = Math.round((caloriesTarget * 0.25) / 9);

    // 1. Check if diet plan already exists in DB
    let planData = await db.getDietPlan(userId);
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
            model: config.defaultModel,
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
      await db.saveDietPlan(userId, planData);
    }

    // Retrieve today's logged meals to compute actual consumed macros
    const todayLogs = await db.getMealLogs(userId);
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
});

// Explicit Diet Plan Regeneration
router.post('/plan/regenerate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const user = await db.getUser(userId);

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
          model: config.defaultModel,
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
    await db.saveDietPlan(userId, planData);

    res.json({ success: true, data: { meals, dietPref } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Log Individual Meal (Breakfast, Lunch, Dinner, Snack) with AI Macro Calculation & +3 XP
router.post('/log-meal', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const { mealType = 'Breakfast', foodItem = '100g raw daal' } = req.body;

    let proteinG = 24;
    let carbsG = 60;
    let fatsG = 2;
    let calories = 340;

    const { client } = getNextGroqClient();
    if (client) {
      try {
        const sysPrompt = `You are FitAI Indian & Global Macro Estimation Engine. Calculate exact protein (g), carbs (g), fats (g), and total calories for any Indian or global food item (e.g. "100g raw daal", "200g paneer", "3 rotis + 1 bowl chana"). Respond strictly in JSON:
{
  "proteinG": number,
  "carbsG": number,
  "fatsG": number,
  "calories": number
}`;
        const userPrompt = `Calculate macros for food entry: "${foodItem}" logged under ${mealType}`;

        const groqRes = await client.chat.completions.create({
          messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
          model: config.defaultModel,
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
        // Fallback calculation
      }
    }

    // Save logged meal to DB
    const savedMeal = await db.logMeal(userId, {
      mealType,
      foodItem,
      proteinG,
      carbsG,
      fatsG,
      calories,
    });

    // Award +3 XP for meal logging
    const xpResult = await db.awardXp(userId, 3);

    res.json({
      success: true,
      data: {
        meal: savedMeal,
        proteinG,
        carbsG,
        fatsG,
        calories,
        xpEarned: 3,
        levelData: xpResult.levelData,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Features 14 & 15: Budget Meal Planner & AI Grocery Generator
router.post('/grocery-optimize', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const user = await db.getUser(userId);

    const weeklyBudgetUsd = typeof req.body.budgetUsd === 'number' ? req.body.budgetUsd : 60;
    const dietPref = req.body.dietPref || user?.diet_pref || 'Indian High Protein';

    const plan = generateGroceryPlan(weeklyBudgetUsd, dietPref);
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
