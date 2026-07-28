import { Request, Response } from 'express';
import { authenticateWithGoogle } from '../services/googleAuth.service';

export async function googleVerify(req: Request, res: Response) {
  try {
    const { googleIdToken, email, name, avatar } = req.body;
    if (!googleIdToken) {
      return res.status(400).json({ success: false, error: 'googleIdToken is required.' });
    }
    const authResult = await authenticateWithGoogle({ googleIdToken, email, name, avatar });
    res.json(authResult);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
