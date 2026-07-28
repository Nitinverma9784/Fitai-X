import { Request, Response } from 'express';
import { VERIFIED_EXERCISE_CATALOG } from '../../../shared/constants/exerciseCatalog';

export async function getCatalog(req: Request, res: Response) {
  try {
    res.json({
      success: true,
      data: VERIFIED_EXERCISE_CATALOG,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
