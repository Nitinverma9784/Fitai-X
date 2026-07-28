import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { generateWorkout } from './generateWorkout.controller';

export async function createCustomWorkout(req: AuthenticatedRequest, res: Response) {
  // Delegate custom exercise creation through unified generateWorkout engine pipeline
  return generateWorkout(req, res);
}
