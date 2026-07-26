/**
 * Workout Service — Typed API client for all workout endpoints
 */
import { sessionService } from './sessionService';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveBackendUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:5000/api';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:5000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
}

const BASE = resolveBackendUrl();

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', 'x-user-id': String(sessionService.getUserId()) };
  const token = sessionService.getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export interface WorkoutExercise {
  id: number;
  name: string;
  sets: number;
  reps: string;
  rest_sec: number;
  icon: string;
  tip: string;
  completed_sets: number;
  is_completed: boolean;
  targetMuscle?: string;
  target_muscle?: string;
  video_url?: string;
  videoUrl?: string;
  image_url?: string;
  imageUrl?: string;
  steps?: string[];
  bodymap_male?: string;
  bodymap_female?: string;
  bodymap_url?: string;
  bodymapUrl?: string;
}

export interface WorkoutRecord {
  id: number;
  title: string;
  duration_minutes: number;
  estimated_calories: number;
  target_muscles: string[];
  why_recommendation: string;
  ai_reasoning?: string;
  readiness_score?: number;
  status: 'pending' | 'completed' | 'missed';
  session_date: string;
  completed_at?: string;
  feedback_energy?: number;
  feedback_soreness?: number;
  feedback_mood?: number;
  feedback_notes?: string;
  adaptations?: string[];
  analysis_steps?: string[];
  exercises: WorkoutExercise[];
  created_at: string;
}

export interface StreakDay {
  date: string;
  status: 'none' | 'pending' | 'completed' | 'missed';
}

export interface TodayState {
  scenario: 'FIRST_DAY' | 'HAS_WORKOUT_TODAY' | 'COMPLETED_TODAY' | 'READY_TO_GENERATE';
  workout: WorkoutRecord | null;
  lastWorkout?: WorkoutRecord;
  streak: StreakDay[];
  totalWorkouts: number;
  missedCount: number;
}

export interface WorkoutCommit {
  versionId: string;
  parentVersionId: string | null;
  timestamp: string;
  author: string;
  commitMessage: string;
  aiReasoning: string;
  adaptations?: string[];
  exercises: { id: string; name: string; targetMuscle: string; sets: number; reps: string; restSeconds: number; rpeTarget: number; substituteFor?: string }[];
  diffSummary: { addedCount: number; removedCount: number; swappedCount: number };
}

export const workoutService = {
  getApiBase(): string {
    return BASE;
  },

  async getToday(): Promise<TodayState | null> {
    try {
      const res = await fetch(`${BASE}/workout/today`, { headers: headers() });
      const json = await res.json();
      return json.success ? json : null;
    } catch { return null; }
  },

  async generate(): Promise<{ success: boolean; data?: WorkoutRecord; error?: string }> {
    try {
      const res = await fetch(`${BASE}/workout/generate`, { method: 'POST', headers: headers() });
      const json = await res.json();
      if (json.success) return { success: true, data: json.data };
      return { success: false, error: json.error || 'Unable to generate workout session.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network request failed.' };
    }
  },

  async completeWorkout(id: number, feedback: { energy: number; soreness: number; mood: number; notes?: string }): Promise<WorkoutRecord | null> {
    try {
      const res = await fetch(`${BASE}/workout/${id}/complete`, { method: 'POST', headers: headers(), body: JSON.stringify(feedback) });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch { return null; }
  },

  async missWorkout(id: number): Promise<void> {
    try {
      await fetch(`${BASE}/workout/${id}/miss`, { method: 'POST', headers: headers() });
    } catch { /* silent */ }
  },

  async toggleExercise(id: number, isCompleted: boolean): Promise<WorkoutExercise | null> {
    try {
      const res = await fetch(`${BASE}/workout/exercise/${id}/toggle`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ isCompleted }),
      });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch { return null; }
  },

  async getStreak(days = 7): Promise<StreakDay[]> {
    try {
      const res = await fetch(`${BASE}/workout/streak?days=${days}`, { headers: headers() });
      const json = await res.json();
      return json.success ? json.data : [];
    } catch { return []; }
  },

  async getHistory(): Promise<WorkoutRecord[]> {
    try {
      const res = await fetch(`${BASE}/workout/history`, { headers: headers() });
      const json = await res.json();
      return json.success ? json.data : [];
    } catch { return []; }
  },

  async getVersionHistory(): Promise<WorkoutCommit[]> {
    try {
      const res = await fetch(`${BASE}/workout/version-control/history`, { headers: headers() });
      const json = await res.json();
      return json.success ? json.data : [];
    } catch { return []; }
  },

  async rollbackToVersion(targetVersionId: string): Promise<WorkoutCommit | null> {
    try {
      const res = await fetch(`${BASE}/workout/version-control/rollback`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ targetVersionId }),
      });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch { return null; }
  },

  async saveExerciseLog(data: { exerciseName: string; weightKg?: number; barWeightKg?: number; plateWeightKg?: number; repsAchieved: number; isBodyweight?: boolean }): Promise<any> {
    try {
      const res = await fetch(`${BASE}/workout/exercise-log`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json.success ? json.data : null;
    } catch { return null; }
  },
};
