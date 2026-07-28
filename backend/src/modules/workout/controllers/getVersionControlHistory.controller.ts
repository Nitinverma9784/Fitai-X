import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { versionControlService } from '../services/versionControl.service';

export async function getVersionControlHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const history = versionControlService.getHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
