import { Request, Response } from 'express';
import { generateToken, verifyPassword, hashPassword } from '../../../core/security/crypto';
import { userService } from '../../user/services/user.service';
import { deriveDisplayName, authResponse } from '../utils/auth.utils';

export async function login(req: Request, res: Response) {
  try {
    const { email, password = '' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const existingUser = await userService.getUserByEmail(email);

    if (existingUser && existingUser.auth_provider === 'google') {
      return res.status(400).json({
        success: false,
        error: "You previously signed up with Google! Please tap 'Continue with Google' to log in.",
        useGoogle: true,
      });
    }

    if (existingUser && existingUser.password_hash && password) {
      const isValid = verifyPassword(password, existingUser.password_hash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }
    }

    let user = existingUser;
    if (!user) {
      const passwordHash = password ? hashPassword(password) : undefined;
      const derivedName = deriveDisplayName(undefined, email);
      user = await userService.createUser({
        name: derivedName,
        email: email || 'user@fitai.pro',
        provider: 'email',
        passwordHash,
      });
    }
    const token = generateToken({ userId: user.id, email: user.email });
    res.json(authResponse(user, token));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
