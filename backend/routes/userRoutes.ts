import { Router, Response } from 'express';
import { userService } from '../services/user/userService';
import { db } from '../core/database';
import { authenticateToken, AuthenticatedRequest } from '../core/authMiddleware';

const router = Router();

router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const user = await userService.getUser(userId);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/onboarding', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const user = await userService.saveUserOnboarding(userId, req.body);
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const updated = await userService.updateUser(userId, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const statsData = await db.getUserStatsAndAchievements(userId);
    res.json({ success: true, data: statsData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/calendar', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const calendarSummary = await userService.getCalendarSummary(userId);
    res.json({ success: true, data: calendarSummary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/award-xp', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const { amount = 20 } = req.body;
    const result = await userService.addXp(userId, parseInt(String(amount), 10) || 20);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
