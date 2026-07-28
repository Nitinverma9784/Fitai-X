import { Router } from 'express';
import { getProfile } from '../controllers/getProfile.controller';
import { updateProfile } from '../controllers/updateProfile.controller';
import { saveOnboarding } from '../controllers/onboarding.controller';
import { getStats } from '../controllers/stats.controller';
import { getCalendar } from '../controllers/calendar.controller';
import { awardXp } from '../controllers/awardXp.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/onboarding', authenticateToken, saveOnboarding);
router.get('/stats', authenticateToken, getStats);
router.get('/calendar', authenticateToken, getCalendar);
router.post('/award-xp', authenticateToken, awardXp);

export default router;
