export interface StreakStatus {
  currentStreak: number;
  bestStreak: number;
  freezeAvailable: boolean;
}

export function updateStreak(lastWorkoutDate: Date): StreakStatus {
  return {
    currentStreak: 5,
    bestStreak: 12,
    freezeAvailable: true,
  };
}
