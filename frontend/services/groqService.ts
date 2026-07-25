/**
 * Frontend API Service for FitAI Pro
 * Pure REST Client — talks strictly to Node.js TypeScript Backend API
 * All requests include x-user-id header for per-user data isolation
 */

import { sessionService } from './sessionService';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically resolves the Backend API URL:
 * - On physical mobile devices (Expo Go), resolves host dev machine IP (e.g. http://192.168.x.x:5000/api)
 * - On Web / iOS Simulator, resolves http://localhost:5000/api
 * - On Android Emulator, falls back to http://10.0.2.2:5000/api
 */
function resolveBackendUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:5000/api';

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const devMachineIp = hostUri.split(':')[0];
    return `http://${devMachineIp}:5000/api`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
}

const API_BASE_URL = resolveBackendUrl();

// Build headers with Authorization Bearer token and x-user-id fallback
function headers(extra?: Record<string, string>): Record<string, string> {
  const userId = sessionService.getUserId();
  const token = sessionService.getToken();
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': String(userId),
    ...extra,
  };
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`;
  }
  return baseHeaders;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
  tier: string;
  goal?: string;
  weight_kg?: number;
  height_cm?: number;
  body_fat_pct?: number;
  age?: number;
  equipment?: string;
  injuries?: string[];
  diet_pref?: string;
  time_commitment?: string;
  onboarding_completed?: boolean;
  auth_provider?: string;
}

export interface WorkoutPlan {
  id?: number;
  title: string;
  durationMinutes: number;
  estimatedCalories: number;
  targetMuscles: string[];
  whyRecommendation: string;
  created_at?: string;
  exercises: {
    id: string | number;
    name: string;
    sets: number;
    reps: string;
    restSec: number;
    rest_sec?: number;
    icon: string;
    tip: string;
    completed_sets?: number;
  }[];
}

export interface RecoveryInsights {
  readinessPercentage: number;
  statusLabel: string;
  description: string;
  recommendations: {
    category: string;
    title: string;
    duration?: string;
    advice: string;
    icon: string;
  }[];
  breathingExercise: {
    name: string;
    cycles: number;
    targetHrvBoost: string;
  };
}

export interface NutritionPlan {
  targets: {
    proteinG: number;
    carbsG: number;
    fatsG: number;
    calories: number;
    proteinConsumedG: number;
    carbsConsumedG: number;
    fatsConsumedG: number;
  };
  dietPref: string;
  meals: {
    tag: string;
    name: string;
    cals: string;
    desc: string;
  }[];
}

export interface GroceryList {
  totalEstCost: string;
  items: {
    name: string;
    qty: string;
    estCost: string;
  }[];
}

// ── Normalise a raw workout row from the DB ───────────────────────────────────
function normaliseWorkout(d: any): WorkoutPlan {
  return {
    id: d.id,
    title: d.title,
    durationMinutes: d.duration_minutes ?? d.durationMinutes ?? 45,
    estimatedCalories: d.estimated_calories ?? d.estimatedCalories ?? 420,
    targetMuscles: d.target_muscles ?? d.targetMuscles ?? ['Full Body'],
    whyRecommendation: d.why_recommendation ?? d.whyRecommendation ?? '',
    created_at: d.created_at,
    exercises: (d.exercises ?? []).map((e: any) => ({
      id: e.id,
      name: e.name,
      sets: e.sets,
      reps: e.reps,
      restSec: e.rest_sec ?? e.restSec ?? 60,
      rest_sec: e.rest_sec ?? e.restSec ?? 60,
      icon: e.icon ?? 'dumbbell',
      tip: e.tip ?? '',
      completed_sets: e.completed_sets ?? 0,
    })),
  };
}

export const groqService = {
  // ── Status ──────────────────────────────────────────────────────────────────
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      return await res.json();
    } catch {
      return { status: 'offline', activeKeysCount: 0 };
    }
  },

  // ── User Profile ────────────────────────────────────────────────────────────
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, { headers: headers() });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },

  // ── Onboarding ──────────────────────────────────────────────────────────────
  async submitOnboarding(data: any): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/user/onboarding`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },

  // ── Workout ─────────────────────────────────────────────────────────────────
  async getLatestWorkout(): Promise<WorkoutPlan | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/workout/latest`, { headers: headers() });
      const json = await res.json();
      return json.success && json.data ? normaliseWorkout(json.data) : null;
    } catch {
      return null;
    }
  },

  async getWorkoutHistory(): Promise<WorkoutPlan[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/workout/history`, { headers: headers() });
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data.map(normaliseWorkout) : [];
    } catch {
      return [];
    }
  },

  async generateWorkout(params: {
    targetGroup?: string;
    duration?: number;
    fitnessLevel?: string;
    equipment?: string;
  }): Promise<WorkoutPlan | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/workout/generate`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(params),
      });
      const json = await res.json();
      return json.success && json.data ? normaliseWorkout(json.data) : null;
    } catch {
      return null;
    }
  },

  async markSetComplete(exerciseId: number | string, completedSets: number): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/workout/set-complete`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ exerciseId, completedSets }),
      });
    } catch {
      // silent
    }
  },

  // ── Recovery ────────────────────────────────────────────────────────────────
  async getRecoveryInsights(params: {
    sleepHours?: number;
    hrv?: number;
    soreness?: string;
  }): Promise<RecoveryInsights | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/recovery/insights`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(params),
      });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },

  async getLatestRecovery(): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/recovery/latest`, { headers: headers() });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },

  // ── Nutrition ───────────────────────────────────────────────────────────────
  async getNutritionPlan(): Promise<NutritionPlan | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/nutrition/plan`, { headers: headers() });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },

  async getGroceryList(): Promise<GroceryList | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/nutrition/grocery`, { headers: headers() });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  },

  // ── AI Chat Coach ───────────────────────────────────────────────────────────
  async chatWithCoach(message: string, model: string = 'llama-3.3-70b-versatile'): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/coach/chat`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ message, model }),
      });
      const json = await res.json();
      return json.success ? json.response : 'FitGuru is temporarily unavailable.';
    } catch {
      return 'Sorry, I ran into a network hiccup. Please check your connection!';
    }
  },
};
