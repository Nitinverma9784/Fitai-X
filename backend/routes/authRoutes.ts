import { Router, Request, Response } from 'express';
import { generateToken, hashPassword, verifyPassword } from '../core/security';
import { db } from '../core/database';
import { authenticateWithGoogle } from '../services/authentication/google';

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

  const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  const domain = isIp ? `${hostname}.nip.io` : hostname;

  return `${protocol}://${domain}:${port}/api/auth/google/callback`;
}

function authResponse(user: any, token: string) {
  return {
    success: true,
    token,
    user,
    isOnboarded: user.onboarding_completed === true || user.onboarding_completed === 't',
  };
}

function deriveDisplayName(name?: string, email?: string): string {
  if (name && name.trim() && !name.toLowerCase().includes('athlete')) {
    return name.trim();
  }
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    const cleaned = handle.replace(/[._\-+]/g, ' ').trim();
    if (cleaned.length > 0) {
      return cleaned
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }
  return 'FitAI Member';
}

function buildFrontendRedirectUrl(baseFrontendUrl: string, targetPath: string, params: Record<string, string>): string {
  const isWeb = baseFrontendUrl.startsWith('http://localhost') || baseFrontendUrl.startsWith('http://127.0.0.1');
  
  if (isWeb) {
    const url = new URL(targetPath, baseFrontendUrl.endsWith('/') ? baseFrontendUrl : baseFrontendUrl + '/');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  const query = new URLSearchParams(params).toString();
  return `${baseFrontendUrl}?${query}`;
}

/**
 * GET /api/auth/google/url
 */
router.get('/google/url', (req: Request, res: Response) => {
  const redirectUri = getRedirectUri(req);
  const clientReturnUrl = (req.query.returnUrl as string) || `${FRONTEND_URL}/auth/success`;

  const state = JSON.stringify({ returnUrl: clientReturnUrl });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${encodeURIComponent(state)}`;

  res.json({ url: authUrl, redirectUri });
});

/**
 * GET /api/auth/google/callback
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  let clientFrontendUrl = `${FRONTEND_URL}/auth/success`;
  try {
    const stateStr = req.query.state as string;
    if (stateStr) {
      const parsedState = JSON.parse(stateStr);
      if (parsedState.returnUrl) clientFrontendUrl = parsedState.returnUrl;
    }
  } catch (e) {
    // Keep default
  }

  const code = req.query.code;
  if (!code) {
    const errUrl = buildFrontendRedirectUrl(
      clientFrontendUrl.replace(/\/auth\/success$/, '/auth'),
      '/auth',
      { error: 'no_code_provided' }
    );
    return res.redirect(errUrl);
  }

  try {
    const redirectUri = getRedirectUri(req);

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

    const email: string = userInfo.email || 'user@fitai.pro';
    const rawName: string = userInfo.name || userInfo.given_name || '';
    const name: string = deriveDisplayName(rawName, email);
    const avatar: string = userInfo.picture || name.slice(0, 2).toUpperCase();

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
    const { name: reqName, email, password = '' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    const name = deriveDisplayName(reqName, email);

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
      const derivedName = deriveDisplayName(undefined, email);
      user = await db.createUser({
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
});

/**
 * POST /api/auth/google/verify
 */
router.post('/google/verify', async (req: Request, res: Response) => {
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
});

export default router;
