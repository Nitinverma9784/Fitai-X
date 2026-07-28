import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { workoutService } from '../services/workout.service';

export async function getStreak(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const days = parseInt(String(req.query.days || '7'), 10);
    const streak = await workoutService.getWorkoutStreak(userId, days);
    res.json({ success: true, data: streak });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
