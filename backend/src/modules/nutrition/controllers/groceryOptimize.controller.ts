import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../../user/services/user.service';
import { generateGroceryPlan } from '../services/groceryOptimizer.service';

export async function groceryOptimize(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const user = await userService.getUser(userId);

    const weeklyBudgetUsd = typeof req.body.budgetUsd === 'number' ? req.body.budgetUsd : 60;
    const dietPref = req.body.dietPref || user?.diet_pref || 'Indian High Protein';

    const plan = generateGroceryPlan(weeklyBudgetUsd, dietPref);
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
