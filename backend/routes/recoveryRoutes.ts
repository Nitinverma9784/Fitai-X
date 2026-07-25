import { Router, Response } from 'express';
import { db } from '../core/database';
import { calculateRecoveryScore } from '../services/ai_recovery_score/score';
import { authenticateToken, AuthenticatedRequest } from '../core/authMiddleware';

const router = Router();

router.get('/latest', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const log = await db.getLatestRecovery(userId);
    res.json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/insights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sleepHours = 8.2, hrv = 68, soreness = 'Low' } = req.body;
    const userId = req.user?.userId || 1;
    const score = await calculateRecoveryScore({
      sleepHours,
      hrvMs: hrv,
      sorenessLevel: soreness,
    });
    await db.saveRecoveryLog(userId, {
      readinessPercentage: score.readinessPercentage,
      statusLabel: score.statusLabel,
      description: score.description,
      hrv_ms: hrv,
      sleep_hours: sleepHours,
      sleep_efficiency: 94,
      muscle_soreness: soreness,
      hydration_l: 2.4,
    });
    res.json({ success: true, data: score });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
