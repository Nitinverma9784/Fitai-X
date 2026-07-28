import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { coachService } from '../services/coach.service';
import { processCoachChat } from '../services/coachAi.service';
import { envConfig } from '../../../config/env';

export async function postChat(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const { message, model = envConfig.defaultModel } = req.body;
    if (message) {
      await coachService.saveChatMessage(userId, 'user', message).catch(err => console.warn('Save chat message error:', err.message));
    }
    const responseText = await processCoachChat(message, model);
    await coachService.saveChatMessage(userId, 'ai', responseText).catch(err => console.warn('Save AI message error:', err.message));
    res.json({ success: true, response: responseText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
