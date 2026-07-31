import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { versionControlService } from '../services/versionControl.service';

export async function rollbackVersionControl(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const { targetVersionId } = req.body;
    const result = await versionControlService.rollbackToVersion(userId, targetVersionId);
    if (!result) return res.status(404).json({ success: false, error: 'Target commit version not found.' });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function legacyRollback(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const { targetVersionId } = req.body;
    const rollbackCommit = await versionControlService.rollbackToVersion(userId, targetVersionId || 'v1.0');
    if (!rollbackCommit) {
      return res.status(400).json({ success: false, error: 'Unable to rollback to specified version.' });
    }
    res.json({ success: true, data: rollbackCommit });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
