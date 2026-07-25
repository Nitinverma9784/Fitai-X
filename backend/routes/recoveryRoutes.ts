import { Router, Request, Response } from 'express';
import { db } from '../core/database';
import { calculateRecoveryScore } from '../services/ai_recovery_score/score';

const router = Router();

function getUserId(req: Request): number {
  const id = parseInt(req.headers['x-user-id'] as string, 10);
  return isNaN(id) ? 1 : id;
}

router.get('/latest', async (req: Request, res: Response) => {
  try {
    const log = await db.getLatestRecovery(getUserId(req));
    res.json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/insights', async (req: Request, res: Response) => {
  try {
    const { sleepHours = 8.2, hrv = 68, soreness = 'Low' } = req.body;
    const userId = getUserId(req);
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
