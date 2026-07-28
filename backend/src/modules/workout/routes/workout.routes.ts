import { Router } from 'express';
import { getTodayState } from '../controllers/todayState.controller';
import { generateWorkout } from '../controllers/generateWorkout.controller';
import { completeWorkout } from '../controllers/completeWorkout.controller';
import { missWorkout } from '../controllers/missWorkout.controller';
import { toggleExercise } from '../controllers/toggleExercise.controller';
import { getStreak } from '../controllers/getStreak.controller';
import { getHistory } from '../controllers/getHistory.controller';
import { getLatest } from '../controllers/getLatest.controller';
import { getVersionControlHistory } from '../controllers/getVersionControlHistory.controller';
import { rollbackVersionControl, legacyRollback } from '../controllers/rollbackVersionControl.controller';
import { legacySetComplete } from '../controllers/legacySetComplete.controller';
import { logExercise } from '../controllers/logExercise.controller';
import { getExerciseLogs } from '../controllers/getExerciseLogs.controller';
import { mediaProxy } from '../controllers/mediaProxy.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = Router();

router.get('/today', authenticateToken, getTodayState);
router.post('/generate', authenticateToken, generateWorkout);
router.post('/:id/complete', authenticateToken, completeWorkout);
router.post('/:id/miss', authenticateToken, missWorkout);
router.put('/exercise/:id/toggle', authenticateToken, toggleExercise);
router.get('/streak', authenticateToken, getStreak);
router.get('/history', authenticateToken, getHistory);
router.get('/latest', authenticateToken, getLatest);
router.get('/version-control/history', authenticateToken, getVersionControlHistory);
router.post('/version-control/rollback', authenticateToken, rollbackVersionControl);
router.post('/set-complete', authenticateToken, legacySetComplete);
router.post('/exercise-log', authenticateToken, logExercise);
router.get('/exercise-logs', authenticateToken, getExerciseLogs);
router.post('/rollback', authenticateToken, legacyRollback);
router.get(['/video-proxy', '/media-proxy'], mediaProxy);

export default router;
