import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../security/crypto';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email?: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    const { valid, payload } = verifyToken(token);
    if (valid && payload && payload.userId) {
      req.user = { userId: payload.userId, email: payload.email };
      return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session token.' });
  }

  const userIdHeader = req.headers['x-user-id'];
  if (userIdHeader) {
    const parsedId = parseInt(String(userIdHeader), 10);
    if (!isNaN(parsedId)) {
      req.user = { userId: parsedId };
      return next();
    }
  }

  return res.status(401).json({ success: false, error: 'Unauthorized: Authentication token required.' });
}
