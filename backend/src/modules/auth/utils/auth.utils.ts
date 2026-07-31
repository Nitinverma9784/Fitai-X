import { Request } from 'express';
import { googleConfig } from '../../../config/google';

export function getRedirectUri(req: Request): string {
  const hostHeader = req.get('host') || 'localhost:5000';
  const hostname = hostHeader.split(':')[0];

  if (hostname.includes('onrender.com') || process.env.NODE_ENV === 'production') {
    return 'https://fitai-x.onrender.com/api/auth/google/callback';
  }

  const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
  if (isIp || hostname.includes('nip.io')) {
    return 'http://192.168.1.37.nip.io:5000/api/auth/google/callback';
  }

  return 'http://localhost:5000/api/auth/google/callback';
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
