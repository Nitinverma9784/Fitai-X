import { Request } from 'express';
import { googleConfig } from '../../../config/google';

export function getRedirectUri(req: Request): string {
  const hostHeader = req.get('host') || 'localhost:5000';
  const hostname = hostHeader.split(':')[0];
  const port = hostHeader.split(':')[1] || '5000';
  const protocol = req.protocol || 'http';

  const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  const domain = isIp ? `${hostname}.nip.io` : hostname;

  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `${protocol}://${domain}:${port}/api/auth/google/callback`;
  }

  if (googleConfig.redirectUri && !googleConfig.redirectUri.includes('192.168.')) {
    return googleConfig.redirectUri;
  }

  return `${protocol}://${domain}:${port}/api/auth/google/callback`;
}

export function authResponse(user: any, token: string) {
  return {
    success: true,
    token,
    user,
    isOnboarded: user.onboarding_completed === true || user.onboarding_completed === 't',
  };
}

export function deriveDisplayName(name?: string, email?: string): string {
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

export function buildFrontendRedirectUrl(baseFrontendUrl: string, targetPath: string, params: Record<string, string>): string {
  const isWeb = baseFrontendUrl.startsWith('http://') || baseFrontendUrl.startsWith('https://');

  if (isWeb) {
    let url: URL;
    try {
      url = new URL(baseFrontendUrl);
    } catch {
      url = new URL('http://localhost:8081/auth/success');
    }
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  const query = new URLSearchParams(params).toString();
  const joinChar = baseFrontendUrl.includes('?') ? '&' : '?';
  return `${baseFrontendUrl}${joinChar}${query}`;
}
