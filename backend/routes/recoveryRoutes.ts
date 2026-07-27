import { Router, Response } from 'express';
import { recoveryService } from '../services/recovery/recoveryService';
import { userService } from '../services/user/userService';
import { calculateRecoveryScore } from '../services/ai_recovery_score/score';
import { authenticateToken, AuthenticatedRequest } from '../core/authMiddleware';
import { getLocalDateString } from '../core/config';

const router = Router();

router.get('/latest', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const log = await recoveryService.getLatestRecovery(userId);
    res.json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const limit = parseInt(String(req.query.limit || '30'), 10) || 30;
    const history = await recoveryService.getRecoveryHistory(userId, limit);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/insights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      sleepHours = 7.5,
      hrv = 65,
      soreness = 'Low',
      hydrationL = 2.5,
      sleepEfficiency = 90,
      logDate,
      forPreviousDay = true,
    } = req.body;
    const userId = req.user?.userId || 1;

    // Determine target log date for sleep/recovery:
    // If user logs morning recovery checkin, default to yesterday's date unless logDate is specified or forPreviousDay is false.
    let targetLogDate = logDate;
    if (!targetLogDate) {
      if (forPreviousDay) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        targetLogDate = getLocalDateString(yesterday);
      } else {
        targetLogDate = getLocalDateString();
      }
    }

    const score = await calculateRecoveryScore({
      sleepHours,
      hrvMs: hrv,
      sorenessLevel: soreness,
      hydrationL,
    });
    const savedLog = await recoveryService.saveRecoveryLog(userId, {
      readinessPercentage: score.readinessPercentage,
      statusLabel: score.statusLabel,
      description: score.description,
      hrv_ms: hrv,
      sleep_hours: sleepHours,
      sleep_efficiency: sleepEfficiency,
      muscle_soreness: soreness,
      hydration_l: hydrationL,
      logDate: targetLogDate,
    });

    const xpResult = await userService.awardXp(userId, 5);

    res.json({ success: true, data: { ...score, log: savedLog, xpEarned: 5, levelData: xpResult.levelData } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
