export interface WorkoutContext {
  userId: number;
  userName: string;
  sleepHours: number;
  sorenessLevel: number; // 1 to 10
  stressLevel: number; // 1 to 10
  caloriesIn: number;
  targetCalories: number;
  availableEquipment: 'Gym' | 'Home' | 'Hotel/Bodyweight';
  durationMinutes: number; // 20, 30, 45, 60
  reportedPain: string[]; // e.g. ['knee', 'shoulder']
  goal: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  targetMuscle: string;
  sets: number;
  reps: string;
  restSeconds: number;
  rpeTarget: number;
  substituteFor?: string;
  reasonForSwap?: string;
}

export interface GeneratedWorkoutPlan {
  versionId: string;
  title: string;
  estimatedMinutes: number;
  readinessScore: number; // 0 - 100
  aiExplanation: string;
  exercises: ExerciseItem[];
  conflictsDetected: string[];
  fatigueWarning?: string;
}

export const EXERCISE_DATABASE: Record<string, Array<{ name: string; muscle: string; category: 'gym' | 'home' | 'hotel'; intensity: 'high' | 'med' | 'low'; stressJoints: string[] }>> = {
  Chest: [
    { name: 'Barbell Bench Press', muscle: 'Chest', category: 'gym', intensity: 'high', stressJoints: ['shoulder', 'wrist'] },
    { name: 'Incline Dumbbell Press', muscle: 'Chest', category: 'gym', intensity: 'high', stressJoints: ['shoulder'] },
    { name: 'Push-Ups (Tempo 3-0-1)', muscle: 'Chest', category: 'home', intensity: 'med', stressJoints: ['wrist'] },
    { name: 'Decline Bodyweight Push-Ups', muscle: 'Chest', category: 'hotel', intensity: 'med', stressJoints: ['wrist'] },
    { name: 'Cable Chest Flyes', muscle: 'Chest', category: 'gym', intensity: 'low', stressJoints: [] },
  ],
  Legs: [
    { name: 'Barbell Back Squat', muscle: 'Legs', category: 'gym', intensity: 'high', stressJoints: ['knee', 'lower_back'] },
    { name: 'Leg Press (Quad Focus)', muscle: 'Legs', category: 'gym', intensity: 'med', stressJoints: [] },
    { name: 'Bulgarian Split Squats', muscle: 'Legs', category: 'home', intensity: 'high', stressJoints: ['knee'] },
    { name: 'Goblet Squats', muscle: 'Legs', category: 'home', intensity: 'med', stressJoints: [] },
    { name: 'Bodyweight Walking Lunges', muscle: 'Legs', category: 'hotel', intensity: 'low', stressJoints: [] },
  ],
  Back: [
    { name: 'Deadlift', muscle: 'Back', category: 'gym', intensity: 'high', stressJoints: ['lower_back', 'grip'] },
    { name: 'Lat Pulldown', muscle: 'Back', category: 'gym', intensity: 'med', stressJoints: ['shoulder'] },
    { name: 'Bodyweight Pull-Ups', muscle: 'Back', category: 'home', intensity: 'high', stressJoints: ['shoulder'] },
    { name: 'Resistance Band Rows', muscle: 'Back', category: 'hotel', intensity: 'low', stressJoints: [] },
  ],
  Shoulders: [
    { name: 'Overhead Barbell Press', muscle: 'Shoulders', category: 'gym', intensity: 'high', stressJoints: ['shoulder', 'lower_back'] },
    { name: 'Dumbbell Lateral Raises', muscle: 'Shoulders', category: 'home', intensity: 'low', stressJoints: [] },
    { name: 'Pike Push-Ups', muscle: 'Shoulders', category: 'hotel', intensity: 'med', stressJoints: ['shoulder', 'wrist'] },
  ],
};

export function generateAdaptiveWorkout(ctx: WorkoutContext): GeneratedWorkoutPlan {
  // 1. Calculate Bio-Readiness Score (0 - 100)
  const sleepFactor = Math.min(ctx.sleepHours / 8, 1) * 35;
  const sorenessFactor = (10 - Math.min(ctx.sorenessLevel, 10)) * 3.5;
  const stressFactor = (10 - Math.min(ctx.stressLevel, 10)) * 1.5;
  const calorieFactor = Math.min((ctx.caloriesIn || 2000) / (ctx.targetCalories || 2200), 1) * 15;
  const readinessScore = Math.round(sleepFactor + sorenessFactor + stressFactor + calorieFactor);

  const conflictsDetected: string[] = [];
  let fatigueWarning: string | undefined;

  if (readinessScore < 50) {
    fatigueWarning = `Low Bio-Readiness (${readinessScore}%). Volume reduced by 30% with extended rest periods to prevent injury.`;
  }

  // 2. Filter exercises based on reported pain & equipment
  const selectedExercises: ExerciseItem[] = [];
  const muscleGroups = ['Chest', 'Legs', 'Back', 'Shoulders'];

  let count = ctx.durationMinutes <= 20 ? 3 : ctx.durationMinutes <= 30 ? 4 : 5;

  muscleGroups.forEach((group, idx) => {
    if (selectedExercises.length >= count) return;

    const list = EXERCISE_DATABASE[group] || [];
    let chosen = list.find(e => {
      if (ctx.availableEquipment === 'Hotel/Bodyweight' && e.category !== 'hotel' && e.category !== 'home') return false;
      if (ctx.availableEquipment === 'Home' && e.category === 'gym') return false;
      
      // Check joint pain conflicts
      const hasConflict = e.stressJoints.some(j => ctx.reportedPain.map(p => p.toLowerCase()).includes(j.toLowerCase()));
      if (hasConflict) {
        conflictsDetected.push(`Substituted ${e.name} due to reported ${e.stressJoints.join('/')} sensitivity.`);
        return false;
      }
      return true;
    });

    // Fallback to low intensity safe exercise if conflict existed
    if (!chosen) {
      chosen = list.find(e => e.intensity === 'low') || list[0];
    }

    if (chosen) {
      const sets = readinessScore < 50 ? 3 : 4;
      const rest = readinessScore < 50 ? 90 : 60;

      selectedExercises.push({
        id: `ex_${idx}_${Date.now()}`,
        name: chosen.name,
        targetMuscle: chosen.muscle,
        sets,
        reps: readinessScore < 50 ? '10-12 (RPE 6)' : '8-10 (RPE 8)',
        restSeconds: rest,
        rpeTarget: readinessScore < 50 ? 6 : 8,
      });
    }
  });

  const versionHash = `v${Math.floor(Date.now() / 1000).toString(16)}`;

  const explanation = readinessScore > 75
    ? `Optimal Recovery (${readinessScore}%). FitAI X increased total workload and target intensity for maximum hypertrophy.`
    : readinessScore > 50
    ? `Moderate Recovery (${readinessScore}%). Balanced volume targeting clean progressive overload.`
    : `Deload & Protection Protocol (${readinessScore}%). Exercises adjusted for low joint stress and recovery optimization.`;

  return {
    versionId: versionHash,
    title: `${ctx.durationMinutes}m ${ctx.availableEquipment} Adaptive Session`,
    estimatedMinutes: ctx.durationMinutes,
    readinessScore,
    aiExplanation: explanation,
    exercises: selectedExercises,
    conflictsDetected,
    fatigueWarning,
  };
}
