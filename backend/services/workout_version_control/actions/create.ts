export interface WorkoutVersion {
  versionId: string;
  workoutId: number;
  timestamp: Date;
  changes: string[];
}

export function createWorkoutVersion(workoutId: number, changes: string[]): WorkoutVersion {
  return {
    versionId: `v_${Date.now()}`,
    workoutId,
    timestamp: new Date(),
    changes,
  };
}
