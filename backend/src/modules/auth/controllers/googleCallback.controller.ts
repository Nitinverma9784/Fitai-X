import { Request, Response } from 'express';
import { googleConfig } from '../../../config/google';
import { getRedirectUri, deriveDisplayName, buildFrontendRedirectUrl } from '../utils/auth.utils';
import { userService } from '../../user/services/user.service';
import { generateToken } from '../../../core/security/crypto';

export async function googleCallback(req: Request, res: Response) {
  let clientFrontendUrl = `${googleConfig.frontendUrl}/auth/success`;
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
        client_id: googleConfig.clientId,
        client_secret: googleConfig.clientSecret,
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

    let user = await userService.getUserByEmail(email);
    if (user) {
      if (user.auth_provider === 'email') {
        const existUrl = buildFrontendRedirectUrl(
          clientFrontendUrl.replace(/\/auth\/success$/, '/auth'),
          '/auth',
          { error: 'email_account_exists', email }
        );
        return res.redirect(existUrl);
      }
      user = await userService.updateUser(user.id, { name, avatar });
    } else {
      user = await userService.createUser({ name, email, provider: 'google', avatar });
    }
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
}
