import { Router, Request, Response } from 'express';
import { generateToken, hashPassword, verifyPassword } from '../core/security';
import { db } from '../core/database';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

function getRedirectUri(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const hostHeader = req.get('host') || 'localhost:5000';
  const hostname = hostHeader.split(':')[0];
  const port = hostHeader.split(':')[1] || '5000';
  const protocol = req.protocol || 'http';

  // If host is a raw IPv4 (e.g. 192.168.1.37), append .nip.io so Google accepts it as a valid domain and mobile DNS resolves to PC
  const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  const domain = isIp ? `${hostname}.nip.io` : hostname;

  return `${protocol}://${domain}:${port}/api/auth/google/callback`;
}

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
 * Returns the Google OAuth authorization URL for frontend to redirect to
 */
router.get('/google/url', (req: Request, res: Response) => {
  const returnUrl = (req.query.returnUrl as string) || '';
  const redirectUri = getRedirectUri(req);
  console.log('🔑 Initiating Google OAuth with redirect_uri:', redirectUri);
  const state = returnUrl ? Buffer.from(returnUrl).toString('base64') : '';

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent select_account',
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url });
});

function buildFrontendRedirectUrl(baseUrl: string, defaultPath: string, params: Record<string, string>): string {
  let target = baseUrl;
  if (!target.includes('/auth/success') && !target.includes('/auth')) {
    target = target.replace(/\/+$/, '') + defaultPath;
  }
  const search = new URLSearchParams(params).toString();
  const sep = target.includes('?') ? '&' : '?';
  return `${target}${sep}${search}`;
}

/**
 * GET /api/auth/google/callback
 * Google redirects here after user authenticates.
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, error, state } = req.query;
  const redirectUri = getRedirectUri(req);

  let clientFrontendUrl = FRONTEND_URL;
  if (state) {
    try {
      const decoded = Buffer.from(state as string, 'base64').toString('utf-8');
      if (decoded.includes('://')) {
        clientFrontendUrl = decoded;
      }
    } catch {}
  }

  if (error || !code) {
    const cancelUrl = buildFrontendRedirectUrl(
      clientFrontendUrl.replace(/\/auth\/success$/, '/auth'),
      '/auth',
      { error: 'google_cancelled' }
    );
    return res.redirect(cancelUrl);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      const failUrl = buildFrontendRedirectUrl(
        clientFrontendUrl.replace(/\/auth\/success$/, '/auth'),
        '/auth',
        { error: 'token_exchange_failed' }
      );
      return res.redirect(failUrl);
    }

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = (await userInfoRes.json()) as any;

    const email: string = userInfo.email || 'google.athlete@fitai.pro';
    const name: string = userInfo.name || userInfo.given_name || 'Google Athlete';
    const avatar: string = userInfo.picture || (name.slice(0, 2) || 'GA').toUpperCase();

    const existingUser = await db.getUserByEmail(email);
    if (existingUser && existingUser.auth_provider === 'email') {
      const existUrl = buildFrontendRedirectUrl(
        clientFrontendUrl.replace(/\/auth\/success$/, '/auth'),
        '/auth',
        { error: 'email_account_exists', email }
      );
      return res.redirect(existUrl);
    }

    const user = await db.createUser({ name, email, provider: 'google', avatar });
    const token = generateToken({ userId: user.id, email: user.email });
    const isOnboarded = user.onboarding_completed === true || user.onboarding_completed === 't';

    const successUrl = buildFrontendRedirectUrl(clientFrontendUrl, '/auth/success', {
      token,
      name,
      email,
      isOnboarded: String(isOnboarded),
      userId: String(user.id),
    });
    res.redirect(successUrl);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err.message);
    const errUrl = buildFrontendRedirectUrl(
      clientFrontendUrl.replace(/\/auth\/success$/, '/auth'),
      '/auth',
      { error: 'oauth_failed' }
    );
    res.redirect(errUrl);
  }
});

/**
 * POST /api/auth/signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name = 'Athlete', email, password = '' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const existingUser = await db.getUserByEmail(email);
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
    const user = await db.createUser({
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
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password = '' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const existingUser = await db.getUserByEmail(email);

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
      user = await db.createUser({
        name: 'Athlete',
        email: email || 'athlete@fitai.pro',
        provider: 'email',
        passwordHash,
      });
    }
    const token = generateToken({ userId: user.id, email: user.email });
    res.json(authResponse(user, token));
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
