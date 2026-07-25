import { Router, Request, Response } from 'express';
import { generateToken } from '../core/security';
import { db } from '../core/database';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8082';
const REDIRECT_URI = `${BACKEND_URL}/api/auth/google/callback`;

// Helper: build response with isOnboarded flag
function authResponse(user: any, token: string) {
  return {
    success: true,
    token,
    user,
    isOnboarded: user.onboarding_completed === true || user.onboarding_completed === 't',
  };
}

/**
 * GET /api/auth/google/url
 * Returns the Google OAuth authorization URL for the frontend to redirect to
 */
router.get('/google/url', (req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent select_account',
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url });
});

/**
 * GET /api/auth/google/callback
 * Google redirects here after user authenticates.
 * Exchange code → get user info → create/login user → redirect frontend with token.
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/auth?error=google_cancelled`);
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) {
      return res.redirect(`${FRONTEND_URL}/auth?error=token_exchange_failed`);
    }

    // Fetch user profile from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoRes.json() as any;

    const email: string = userInfo.email || 'google.athlete@fitai.pro';
    const name: string = userInfo.name || userInfo.given_name || 'Google Athlete';
    const avatar: string = (name.slice(0, 2) || 'GA').toUpperCase();

    // Check if user exists with email auth — warn them
    const existingUser = await db.getUserByEmail(email);
    if (existingUser && existingUser.auth_provider === 'email') {
      return res.redirect(`${FRONTEND_URL}/auth?error=email_account_exists&email=${encodeURIComponent(email)}`);
    }

    // Create or find the user
    const user = await db.createUser({ name, email, provider: 'google', avatar });
    const token = generateToken({ userId: user.id, email: user.email });
    const isOnboarded = user.onboarding_completed === true || user.onboarding_completed === 't';

    // Redirect back to frontend with the session token + onboarding status + userId
    res.redirect(
      `${FRONTEND_URL}/auth/success?token=${token}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&isOnboarded=${isOnboarded}&userId=${user.id}`
    );
  } catch (err: any) {
    console.error('Google OAuth callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/auth?error=oauth_failed`);
  }
});

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name = 'Athlete', email, password } = req.body;
    const existingUser = await db.getUserByEmail(email);

    if (existingUser && existingUser.auth_provider === 'google') {
      return res.status(400).json({
        success: false,
        error: "This email is registered with Google Sign-In. Please tap 'Continue with Google' to sign in.",
        useGoogle: true,
      });
    }

    const user = await db.createUser({ name, email, provider: 'email', avatar: name.slice(0, 2).toUpperCase() });
    const token = generateToken({ userId: user.id, email: user.email });
    res.json(authResponse(user, token));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const existingUser = await db.getUserByEmail(email);

    if (existingUser && existingUser.auth_provider === 'google') {
      return res.status(400).json({
        success: false,
        error: "You previously signed up with Google! Please tap 'Continue with Google' to log in.",
        useGoogle: true,
      });
    }

    let user = existingUser;
    if (!user) {
      user = await db.createUser({ name: 'Athlete', email: email || 'athlete@fitai.pro', provider: 'email' });
    }
    const token = generateToken({ userId: user.id, email: user.email });
    res.json(authResponse(user, token));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
