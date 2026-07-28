import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { analyticsService } from '../services/analytics.service';

export async function logExercise(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId !== undefined ? req.user.userId : 1;
    const { exerciseName, weightKg, barWeightKg, plateWeightKg, repsAchieved, isBodyweight, rpe, logDate } = req.body;
    if (!exerciseName || repsAchieved === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: exerciseName and repsAchieved.' });
    }
    const result = await analyticsService.saveExerciseLog(userId, {
      exerciseName,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      barWeightKg: barWeightKg ? parseFloat(barWeightKg) : undefined,
      plateWeightKg: plateWeightKg ? parseFloat(plateWeightKg) : undefined,
      repsAchieved: parseInt(repsAchieved, 10),
      isBodyweight: !!isBodyweight,
      rpe: rpe ? parseInt(String(rpe), 10) : 8,
      logDate: logDate || undefined,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
