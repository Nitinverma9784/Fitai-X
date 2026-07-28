import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { recoveryService } from '../services/recovery.service';

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId !== undefined ? req.user.userId : 1;
    const limit = parseInt(String(req.query.limit || '30'), 10) || 30;
    const history = await recoveryService.getRecoveryHistory(userId, limit);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
