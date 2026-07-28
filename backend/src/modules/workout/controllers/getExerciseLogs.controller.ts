import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { analyticsService } from '../services/analytics.service';

export async function getExerciseLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const logs = await analyticsService.getUserExerciseLogs(userId, 30);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
