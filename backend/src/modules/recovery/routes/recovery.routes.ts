import { Router } from 'express';
import { getLatest } from '../controllers/getLatest.controller';
import { getHistory } from '../controllers/getHistory.controller';
import { postInsights } from '../controllers/postInsights.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = Router();

router.get('/latest', authenticateToken, getLatest);
router.get('/history', authenticateToken, getHistory);
router.post('/insights', authenticateToken, postInsights);

export default router;
