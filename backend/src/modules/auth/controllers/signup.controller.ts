import { Request, Response } from 'express';
import { generateToken, hashPassword } from '../../../core/security/crypto';
import { userService } from '../../user/services/user.service';
import { deriveDisplayName, authResponse } from '../utils/auth.utils';

export async function signup(req: Request, res: Response) {
  try {
    const { name: reqName, email, password = '' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    const name = deriveDisplayName(reqName, email);

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      if (existingUser.auth_provider === 'google') {
        return res.status(400).json({
          success: false,
          error: "This email is registered with Google Sign-In. Please tap 'Continue with Google'.",
          useGoogle: true,
        });
      }
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists. Please log in.',
      });
    }

    const passwordHash = password ? hashPassword(password) : undefined;
    const user = await userService.createUser({
      name,
      email,
      provider: 'email',
      avatar: name.slice(0, 2).toUpperCase(),
      passwordHash,
    });
    const token = generateToken({ userId: user.id, email: user.email });
    res.json(authResponse(user, token));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
