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

router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const limit = parseInt(String(req.query.limit || '30'), 10) || 30;
    const history = await db.getRecoveryHistory(userId, limit);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/insights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sleepHours = 7.5, hrv = 65, soreness = 'Low', hydrationL = 2.5, sleepEfficiency = 90 } = req.body;
    const userId = req.user?.userId || 1;
    const score = await calculateRecoveryScore({
      sleepHours,
      hrvMs: hrv,
      sorenessLevel: soreness,
      hydrationL,
    });
    const savedLog = await db.saveRecoveryLog(userId, {
      readinessPercentage: score.readinessPercentage,
      statusLabel: score.statusLabel,
      description: score.description,
      hrv_ms: hrv,
      sleep_hours: sleepHours,
      sleep_efficiency: sleepEfficiency,
      muscle_soreness: soreness,
      hydration_l: hydrationL,
    });

    const xpResult = await db.awardXp(userId, 5);

    res.json({ success: true, data: { ...score, log: savedLog, xpEarned: 5, levelData: xpResult.levelData } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
