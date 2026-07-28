import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../services/user.service';

export async function getCalendar(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;
    const calendarSummary = await userService.getCalendarSummary(userId);
    res.json({ success: true, data: calendarSummary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
