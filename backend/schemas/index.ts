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
