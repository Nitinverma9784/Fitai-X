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
  let user = await db.getUserByEmail(email);
  if (user) {
    if (user.auth_provider === 'email') {
      return {
        success: false,
        error: "This email is registered with password login. Please log in using your password.",
        email,
      };
    }
    user = await db.updateUser(user.id, { name, avatar });
  } else {
    user = await db.createUser({ name, email, provider: 'google', avatar });
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
