import { Router, Request, Response } from 'express';
import { db } from '../core/database';
import { processCoachChat } from '../services/ai_coach/chat';
import { config } from '../core/config';

const router = Router();

router.get('/history', async (req: Request, res: Response) => {
  try {
    const history = await db.getChatHistory(1);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, model = config.defaultModel } = req.body;
    if (message) {
      await db.saveChatMessage(1, 'user', message);
    }
    const responseText = await processCoachChat(message, model);
    await db.saveChatMessage(1, 'ai', responseText);
    res.json({ success: true, response: responseText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
