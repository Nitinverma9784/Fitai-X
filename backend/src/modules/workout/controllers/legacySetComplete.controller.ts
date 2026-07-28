import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { workoutService } from '../services/workout.service';

export async function legacySetComplete(req: AuthenticatedRequest, res: Response) {
  try {
    const { exerciseId, completedSets } = req.body;
    const result = await workoutService.updateExerciseSets(exerciseId, completedSets);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
