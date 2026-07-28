import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../services/user.service';

export async function saveOnboarding(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const user = await userService.saveUserOnboarding(userId, req.body);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
