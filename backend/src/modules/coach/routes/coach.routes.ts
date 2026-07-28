import { Router } from 'express';
import { getHistory } from '../controllers/getHistory.controller';
import { postChat } from '../controllers/postChat.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = Router();

router.get('/history', authenticateToken, getHistory);
router.post('/chat', authenticateToken, postChat);

export default router;
