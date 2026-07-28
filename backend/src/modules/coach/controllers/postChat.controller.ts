import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { coachService } from '../services/coach.service';
import { processCoachChat } from '../services/coachAi.service';
import { envConfig } from '../../../config/env';
import { userRepository } from '../../user/repositories/user.repository';
import { recoveryRepository } from '../../recovery/repositories/recovery.repository';

export async function postChat(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const { message, model = envConfig.defaultModel, userProfile: bodyProfile } = req.body;

    // Fetch user onboarding profile and recent recovery activity
    const dbProfile = await userRepository.getUser(userId).catch(() => null);
    const latestRecovery = await recoveryRepository.getLatestRecovery(userId).catch(() => null);

    const userProfile = {
      ...dbProfile,
      ...bodyProfile,
      recentRecovery: latestRecovery
        ? `${latestRecovery.status_label || 'Good Recovery'} (Readiness: ${latestRecovery.readiness_percentage || 85}%, Sleep: ${latestRecovery.sleep_hours || 7.5}h, Soreness: ${latestRecovery.muscle_soreness || 'Low'})`
        : undefined,
    };

    if (message) {
      await coachService.saveChatMessage(userId, 'user', message).catch(err => console.warn('Save chat message error:', err.message));
    }
    const responseText = await processCoachChat(message, userProfile, model);
    await coachService.saveChatMessage(userId, 'ai', responseText).catch(err => console.warn('Save AI message error:', err.message));
    res.json({ success: true, response: responseText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
