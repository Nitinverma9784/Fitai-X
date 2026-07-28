import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { workoutService } from '../services/workout.service';
import { userService } from '../../user/services/user.service';

export async function completeWorkout(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const workoutId = parseInt(String(rawId), 10);
    const { energy = 3, soreness = 3, mood = 3, notes = '' } = req.body;
    
    const result = await workoutService.markWorkoutComplete(workoutId, { energy, soreness, mood, notes });
    const xpResult = await userService.awardXp(userId, 5);
    
    res.json({ success: true, data: { ...result, xpEarned: 5, levelData: xpResult.levelData } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
