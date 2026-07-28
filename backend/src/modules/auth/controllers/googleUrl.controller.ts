import { Request, Response } from 'express';
import { googleConfig } from '../../../config/google';
import { getRedirectUri } from '../utils/auth.utils';

export async function getGoogleUrl(req: Request, res: Response) {
  const redirectUri = getRedirectUri(req);
  const clientReturnUrl = (req.query.returnUrl as string) || `${googleConfig.frontendUrl}/auth/success`;

  const state = JSON.stringify({ returnUrl: clientReturnUrl });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(googleConfig.clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${encodeURIComponent(state)}`;

  res.json({ url: authUrl, redirectUri });
}
