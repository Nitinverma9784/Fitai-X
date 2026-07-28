import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { workoutService } from '../services/workout.service';

export async function toggleExercise(req: AuthenticatedRequest, res: Response) {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const exerciseId = parseInt(String(rawId), 10);
    const { isCompleted } = req.body;
    const result = await workoutService.toggleExerciseCompletion(exerciseId, !!isCompleted);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
