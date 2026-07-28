/**
 * Core User & Gamification Type Definitions for FitAI Pro
 */

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
  tier: string;
  gender?: string;
  goal?: string;
  weight_kg?: number;
  height_cm?: number;
  body_fat_pct?: number;
  age?: number;
  equipment?: string;
  injuries?: string[];
  diet_pref?: string;
  diet_preference?: string;
  time_commitment?: string;
  onboarding_completed?: boolean;
  auth_provider?: string;
  xp?: number;
  level?: number;
  levelTitle?: string;
  progressPct?: number;
  xpNeeded?: number;
  xpToNextLevel?: number;
  xpInCurrentLevel?: number;
}

export interface UserAchievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  current: number;
  target: number;
  progressPct: number;
}

export interface UserStatsResponse {
  user: UserProfile;
  stats: {
    totalWorkouts: number;
    completedWorkouts: number;
    currentStreak: number;
    xp: number;
    level: number;
    levelTitle: string;
  };
  levelData: {
    xp: number;
    level: number;
    levelTitle: string;
    xpCurrentLevelStart: number;
    xpNextLevelStart: number;
    xpInCurrentLevel: number;
    xpNeeded: number;
    progressPct: number;
    xpToNextLevel: number;
  };
  achievements: UserAchievement[];
}

export interface WorkoutExerciseItem {
  id: string | number;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  icon?: string;
  tip?: string;
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
  is_completed?: boolean;
  completed_sets?: number;
}

export interface WorkoutPlan {
  id?: number;
  title: string;
  durationMinutes: number;
  estimatedCalories: number;
  targetMuscles: string[];
  whyRecommendation: string;
  aiReasoning?: string;
  readinessScore?: number;
  created_at?: string;
  exercises: WorkoutExerciseItem[];
}
