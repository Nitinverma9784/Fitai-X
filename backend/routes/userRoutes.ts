import { Router, Request, Response } from 'express';
import { db } from '../core/database';

const router = Router();

// Helper: extract userId from header, fallback to 1
function getUserId(req: Request): number {
  const id = parseInt(req.headers['x-user-id'] as string, 10);
  return isNaN(id) ? 1 : id;
}

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const user = await db.getUser(userId);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/onboarding', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const user = await db.saveUserOnboarding(userId, req.body);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const updated = await db.updateUser(userId, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
