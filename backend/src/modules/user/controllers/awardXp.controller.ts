import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../services/user.service';

export async function awardXp(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const { amount = 20 } = req.body;
    const result = await userService.addXp(userId, parseInt(String(amount), 10) || 20);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
