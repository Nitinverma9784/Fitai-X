import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { workoutService } from '../services/workout.service';

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const history = await workoutService.getWorkoutHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
