import { Router, Request, Response } from 'express';
import { db } from '../core/database';
import { generateAdaptiveWorkout } from '../services/adaptive_planning_engine/generator';
import { calculateProgressiveOverload } from '../services/progressive_overload_engine/reps';

const router = Router();

function getUserId(req: Request): number {
  const id = parseInt(req.headers['x-user-id'] as string, 10);
  return isNaN(id) ? 1 : id;
}

router.get('/latest', async (req: Request, res: Response) => {
  try {
    const workout = await db.getLatestWorkout(getUserId(req));
    res.json({ success: true, data: workout });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const history = await db.getWorkoutHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { targetGroup = 'Chest & Triceps', duration = 45, fitnessLevel = 'Intermediate', equipment = 'Gym Equipment' } = req.body;
    const plan = await generateAdaptiveWorkout({
      targetGroup,
      durationMinutes: duration,
      fitnessLevel,
      equipment,
    });
    const saved = await db.saveWorkout(getUserId(req), plan);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/set-complete', async (req: Request, res: Response) => {
  try {
    const { exerciseId, completedSets } = req.body;
    const updated = await db.updateExerciseSets(exerciseId, completedSets);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/overload', (req: Request, res: Response) => {
  try {
    const result = calculateProgressiveOverload(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
