import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../services/user.service';
import { workoutService } from '../../workout/services/workout.service';

export async function getStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const history = await workoutService.getWorkoutHistory(userId, 500);
    const streakDays = await workoutService.getWorkoutStreak(userId, 30);
    const statsData = await userService.getUserStatsAndAchievements(userId, history, streakDays);
    res.json({ success: true, data: statsData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
