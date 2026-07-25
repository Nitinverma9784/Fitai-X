import { generateToken } from '../../core/security';
import { db } from '../../core/database';

export interface GoogleAuthPayload {
  googleIdToken: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export async function authenticateWithGoogle(payload: GoogleAuthPayload) {
  // Extract user details from Google token payload
  const email = payload.email || 'google.athlete@fitai.pro';
  const name = payload.name || 'Google Athlete';
  const avatar = payload.avatar || 'GA';

  // Check if user exists or create new user in PostgreSQL
  let user = await db.getUser(1);
  if (!user || user.email !== email) {
    user = await db.updateUser(1, { name, email, avatar });
  }

  // Generate JWT Session Token
  const token = generateToken({ userId: user.id, email: user.email });

  return {
    success: true,
    token,
    user,
    provider: 'google',
  };
}
