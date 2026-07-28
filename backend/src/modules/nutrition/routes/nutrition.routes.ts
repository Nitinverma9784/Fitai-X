import { Router } from 'express';
import { getPlan } from '../controllers/getPlan.controller';
import { regeneratePlan } from '../controllers/regeneratePlan.controller';
import { calculateMacros } from '../controllers/calculateMacros.controller';
import { logMeal } from '../controllers/logMeal.controller';
import { groceryOptimize } from '../controllers/groceryOptimize.controller';
import { authenticateToken } from '../../../core/middleware/auth.middleware';

const router = Router();

router.get('/plan', authenticateToken, getPlan);
router.post('/plan/regenerate', authenticateToken, regeneratePlan);
router.post('/calculate-macros', authenticateToken, calculateMacros);
router.post('/log-meal', authenticateToken, logMeal);
router.post('/grocery-optimize', authenticateToken, groceryOptimize);

export default router;
