/**
 * FitAI Pro — Session Service
 * Persists user session data (userId, token, name, email, isOnboarded)
 * Works on web (localStorage) and native (AsyncStorage).
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FitAISession {
  userId: number;
  token: string;
  name: string;
  email: string;
  avatar: string;
  isOnboarded: boolean;
}

const SESSION_KEY = 'fitai_session';

// ─── Web localStorage helpers ─────────────────────────────────────────────────
function webSave(session: FitAISession): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

function webGet(): FitAISession | null {
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as FitAISession;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function webClear(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

// ─── In-memory sync cache (populated after init()) ───────────────────────────
let _memSession: FitAISession | null = null;

// ─── Public API ───────────────────────────────────────────────────────────────
export const sessionService = {
  /**
   * Call once at app startup (in splash/index screen).
   * Loads the persisted session from AsyncStorage into the in-memory cache
   * so all synchronous callers (get, isLoggedIn, getUserId) work immediately.
   */
  async init(): Promise<void> {
    if (Platform.OS === 'web') {
      _memSession = webGet();
    } else {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) {
          _memSession = JSON.parse(raw) as FitAISession;
        } else {
          _memSession = null;
        }
      } catch {
        _memSession = null;
      }
    }
  },

  save(session: FitAISession): void {
    _memSession = session;
    if (Platform.OS === 'web') {
      webSave(session);
    }
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)).catch(() => {});
  },

  get(): FitAISession | null {
    if (Platform.OS === 'web') {
      const s = webGet();
      if (s) _memSession = s;
      return s;
    }
    return _memSession;
  },

  clear(): void {
    _memSession = null;
    if (Platform.OS === 'web') {
      webClear();
    }
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  },

  isLoggedIn(): boolean {
    const s = sessionService.get();
    return Boolean(s && s.token && s.token.trim() !== '');
  },

  getUserId(): number {
    return sessionService.get()?.userId ?? 0;
  },

  getToken(): string {
    return sessionService.get()?.token ?? '';
  },

  markOnboarded(): void {
    const s = sessionService.get();
    if (s) {
      sessionService.save({ ...s, isOnboarded: true });
    }
  },
};
