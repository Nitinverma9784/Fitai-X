import { Router, Response } from 'express';
import { db } from '../core/database';
import { processCoachChat } from '../services/ai_coach/chat';
import { config } from '../core/config';
import { authenticateToken, AuthenticatedRequest } from '../core/authMiddleware';

const router = Router();

router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const history = await db.getChatHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const { message, model = config.defaultModel } = req.body;
    if (message) {
      await db.saveChatMessage(userId, 'user', message);
    }
    const responseText = await processCoachChat(message, model);
    await db.saveChatMessage(userId, 'ai', responseText);
    res.json({ success: true, response: responseText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
