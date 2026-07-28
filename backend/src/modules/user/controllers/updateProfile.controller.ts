import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../services/user.service';

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const updated = await userService.updateUser(userId, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
