import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { coachService } from '../services/coach.service';

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const history = await coachService.getChatHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
