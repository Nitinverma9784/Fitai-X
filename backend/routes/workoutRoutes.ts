import { Router, Response } from 'express';
import { db } from '../core/database';
import { generateAdaptiveWorkout } from '../services/adaptive_planning_engine/generator';
import { calculateProgressiveOverload } from '../services/progressive_overload_engine/reps';
import { authenticateToken, AuthenticatedRequest } from '../core/authMiddleware';

const router = Router();

router.get('/latest', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const workout = await db.getLatestWorkout(userId);
    res.json({ success: true, data: workout });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const history = await db.getWorkoutHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const userProfile = await db.getUser(userId);

    const {
      targetGroup = userProfile?.goal || 'Chest & Triceps',
      duration = parseInt(userProfile?.time_commitment, 10) || 45,
      fitnessLevel = 'Intermediate',
      equipment = userProfile?.equipment || 'Gym Equipment',
    } = req.body;

    const plan = await generateAdaptiveWorkout({
      targetGroup,
      durationMinutes: typeof duration === 'number' ? duration : 45,
      fitnessLevel,
      equipment,
    });
    const saved = await db.saveWorkout(userId, plan);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/set-complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exerciseId, completedSets } = req.body;
    const updated = await db.updateExerciseSets(exerciseId, completedSets);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/overload', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = calculateProgressiveOverload(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
