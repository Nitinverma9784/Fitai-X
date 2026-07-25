import { Router, Response } from 'express';
import { db } from '../core/database';
import { getNextGroqClient, config } from '../core/config';
import { authenticateToken, AuthenticatedRequest } from '../core/authMiddleware';

const router = Router();

router.get('/plan', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const user = await db.getUser(userId);

    const weight = user?.weight_kg || 75;
    const goal = user?.goal || 'Muscle Gain';
    const dietPref = user?.diet_pref || 'High Protein Non-Veg';

    // Calculate baseline targets
    const proteinTarget = Math.round(weight * 2.2);
    const caloriesTarget = Math.round(weight * 32);
    const carbsTarget = Math.round((caloriesTarget * 0.45) / 4);
    const fatsTarget = Math.round((caloriesTarget * 0.25) / 9);

    const { client } = getNextGroqClient();

    let meals = [
      {
        tag: 'BREAKFAST • 8:00 AM',
        name: 'Oatmeal Bowl with Whey & Berries',
        cals: '540 kcal',
        desc: '70g Oats, 1 Scoop Whey Protein, 10g Chia Seeds, Blueberries',
      },
      {
        tag: 'LUNCH • 1:00 PM',
        name: 'Grilled Chicken & Sweet Potato Bowl',
        cals: '680 kcal',
        desc: '200g Chicken Breast, 250g Sweet Potato, Roasted Broccoli',
      },
      {
        tag: 'POST-WORKOUT • 5:30 PM',
        name: 'Anabolic Greek Yogurt & Honey',
        cals: '350 kcal',
        desc: '250g 0% Greek Yogurt, 15g Honey, 20g Almonds',
      },
      {
        tag: 'DINNER • 8:30 PM',
        name: 'Lean Egg White Stir-Fry & Rice',
        cals: '580 kcal',
        desc: '6 Whole Egg Whites + 2 Eggs, 150g Jasmine Rice, Vegetables',
      },
    ];

    if (client) {
      try {
        const sysPrompt = `You are FitAI Pro Nutrition Engine. Generate a daily meal schedule for a user. Respond strictly in JSON:
{
  "meals": [
    { "tag": string, "name": string, "cals": string, "desc": string }
  ]
}`;
        const userPrompt = `Create 4 high-protein meal options for an athlete weighing ${weight}kg with goal "${goal}" and diet preference "${dietPref}". Target calories: ~${caloriesTarget} kcal.`;

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
      } catch (e) {
        // Fall back to baseline calculated meals
      }
    }

    res.json({
      success: true,
      data: {
        targets: {
          proteinG: proteinTarget,
          carbsG: carbsTarget,
          fatsG: fatsTarget,
          calories: caloriesTarget,
          proteinConsumedG: Math.round(proteinTarget * 0.9),
          carbsConsumedG: Math.round(carbsTarget * 0.88),
          fatsConsumedG: Math.round(fatsTarget * 0.84),
        },
        dietPref,
        meals,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/grocery', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const user = await db.getUser(userId);

    const dietPref = user?.diet_pref || 'High Protein';
    const { client } = getNextGroqClient();

    let items = [
      { name: 'Boneless Chicken Breast / Tofu', qty: '1.5 kg', estCost: '$14.00' },
      { name: 'Liquid Egg Whites & Eggs', qty: '2 Dozen', estCost: '$6.80' },
      { name: 'Rolled Oats & Chia Seeds', qty: '1 Bag', estCost: '$4.20' },
      { name: 'Greek Yogurt (0% Fat)', qty: '2 Tubs', estCost: '$8.00' },
      { name: 'Jasmine Rice & Sweet Potatoes', qty: '2 kg', estCost: '$6.00' },
      { name: 'Spinach, Broccoli & Avocados', qty: 'Fresh Pack', estCost: '$8.00' },
    ];
    let totalEstCost = '$47.00';

    if (client) {
      try {
        const sysPrompt = `You are FitAI Pro Grocery Optimizer. Generate a weekly grocery list optimized for cost and ingredient reuse. Respond strictly in JSON:
{
  "totalEstCost": string,
  "items": [
    { "name": string, "qty": string, "estCost": string }
  ]
}`;
        const userPrompt = `Create a weekly grocery shopping list for a user with diet preference "${dietPref}".`;

        const groqRes = await client.chat.completions.create({
          messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
          model: config.defaultModel,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(groqRes.choices[0]?.message?.content || '{}');
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          items = parsed.items;
          if (parsed.totalEstCost) totalEstCost = parsed.totalEstCost;
        }
      } catch (e) {
        // Fall back to baseline list
      }
    }

    res.json({
      success: true,
      data: {
        totalEstCost,
        items,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
