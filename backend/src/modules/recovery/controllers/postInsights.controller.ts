import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { recoveryService } from '../services/recovery.service';
import { recoveryScoreService } from '../services/recoveryScore.service';
import { userService } from '../../user/services/user.service';
import { getLocalDateString } from '../../../shared/utils/date';

export async function postInsights(req: AuthenticatedRequest, res: Response) {
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
    const userId = req.user?.userId !== undefined ? req.user.userId : 1;

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

    const score = await recoveryScoreService.calculateRecoveryScore({
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
}
