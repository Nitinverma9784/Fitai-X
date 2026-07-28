import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { recoveryService } from '../services/recovery.service';

export async function getLatest(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId !== undefined ? req.user.userId : 1;
    const log = await recoveryService.getLatestRecovery(userId);
    res.json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
