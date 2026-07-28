export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  tier: string;
  goal: string;
  weight_kg: number;
  height_cm: number;
  body_fat_pct: number;
  created_at?: Date;
}

export interface Workout {
  id: number;
  user_id: number;
  title: string;
  duration_minutes: number;
  estimated_calories: number;
  target_muscles: string[];
  why_recommendation: string;
  created_at?: Date;
  exercises?: Exercise[];
}

export interface Exercise {
  id: number;
  workout_id: number;
  name: string;
  sets: number;
  reps: string;
  rest_sec: number;
  icon: string;
  tip: string;
  completed_sets: number;
}

export interface RecoveryLog {
  id: number;
  user_id: number;
  readiness_percentage: number;
  status_label: string;
  description: string;
  hrv_ms: number;
  sleep_hours: number;
  sleep_efficiency: number;
  muscle_soreness: string;
  hydration_l: number;
  created_at?: Date;
}

export interface ChatMessage {
  id: number;
  user_id: number;
  sender: 'user' | 'ai';
  text: string;
  created_at?: Date;
}

export interface GenerateWorkoutSchema {
  targetGroup: string;
  durationMinutes: number;
  fitnessLevel: string;
  equipment: string;
}

export interface CalculateRecoverySchema {
  sleepHours: number;
  hrvMs: number;
  sorenessLevel: string;
  hydrationL: number;
}

export interface ChatMessageSchema {
  message: string;
  model?: string;
}

export interface UpdateUserProfileSchema {
  weight_kg?: number;
  height_cm?: number;
  body_fat_pct?: number;
  goal?: string;
}
