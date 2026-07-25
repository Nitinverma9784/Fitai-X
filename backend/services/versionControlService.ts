import { ExerciseItem, GeneratedWorkoutPlan } from './adaptiveAiEngine';

export interface WorkoutCommit {
  versionId: string;
  parentVersionId: string | null;
  timestamp: string;
  author: 'FitAI Engine' | 'User Customization' | 'Recovery Auto-Deload';
  commitMessage: string;
  aiReasoning: string;
  exercises: ExerciseItem[];
  adaptations?: string[];
  diffSummary: {
    addedCount: number;
    removedCount: number;
    swappedCount: number;
  };
}

class WorkoutVersionControlStore {
  private history: Map<number, WorkoutCommit[]> = new Map();

  public getHistory(userId: number): WorkoutCommit[] {
    if (!this.history.has(userId)) {
      // Seed default initial commits
      const initial: WorkoutCommit[] = [
        {
          versionId: 'v1.0.0',
          parentVersionId: null,
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          author: 'FitAI Engine',
          commitMessage: 'Initial Base Hypertrophy Template Generated',
          aiReasoning: 'Baseline hypertrophy program initialized from onboarding survey.',
          exercises: [
            { id: '1', name: 'Barbell Bench Press', targetMuscle: 'Chest', sets: 4, reps: '8-10', restSeconds: 90, rpeTarget: 8 },
            { id: '2', name: 'Barbell Back Squat', targetMuscle: 'Legs', sets: 4, reps: '8-10', restSeconds: 120, rpeTarget: 8 },
            { id: '3', name: 'Lat Pulldown', targetMuscle: 'Back', sets: 4, reps: '10-12', restSeconds: 60, rpeTarget: 7 },
          ],
          diffSummary: { addedCount: 3, removedCount: 0, swappedCount: 0 },
        },
        {
          versionId: 'v1.1.0',
          parentVersionId: 'v1.0.0',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          author: 'Recovery Auto-Deload',
          commitMessage: 'Swapped Squat $\\rightarrow$ Leg Press (Knee Pain Reported)',
          aiReasoning: 'User logged knee soreness level 7/10 and 48% Recovery Score. AI replaced high axial load Squats with Leg Press.',
          exercises: [
            { id: '1', name: 'Barbell Bench Press', targetMuscle: 'Chest', sets: 4, reps: '8-10', restSeconds: 90, rpeTarget: 8 },
            { id: '4', name: 'Leg Press (Quad Focus)', targetMuscle: 'Legs', sets: 3, reps: '10-12', restSeconds: 90, rpeTarget: 6, substituteFor: 'Barbell Back Squat', reasonForSwap: 'Knee soreness protective swap' },
            { id: '3', name: 'Lat Pulldown', targetMuscle: 'Back', sets: 4, reps: '10-12', restSeconds: 60, rpeTarget: 7 },
          ],
          diffSummary: { addedCount: 1, removedCount: 1, swappedCount: 1 },
        },
      ];
      this.history.set(userId, initial);
    }
    return this.history.get(userId)!;
  }

  public commitNewVersion(
    userId: number,
    plan: GeneratedWorkoutPlan,
    author: 'FitAI Engine' | 'User Customization' | 'Recovery Auto-Deload',
    message: string
  ): WorkoutCommit {
    const list = this.getHistory(userId);
    const parent = list.length > 0 ? list[list.length - 1] : null;

    const major = 1;
    const minor = list.length;
    const patch = 0;
    const versionId = `v${major}.${minor}.${patch}`;

    // Compute diffs against parent
    let addedCount = 0;
    let removedCount = 0;
    let swappedCount = plan.conflictsDetected.length;

    if (parent) {
      const parentNames = parent.exercises.map(e => e.name);
      const newNames = plan.exercises.map(e => e.name);
      addedCount = newNames.filter(n => !parentNames.includes(n)).length;
      removedCount = parentNames.filter(n => !newNames.includes(n)).length;
    } else {
      addedCount = plan.exercises.length;
    }

    const commit: WorkoutCommit = {
      versionId,
      parentVersionId: parent ? parent.versionId : null,
      timestamp: new Date().toISOString(),
      author,
      commitMessage: (plan as any).commitMessage || message || plan.title,
      aiReasoning: plan.aiExplanation,
      exercises: plan.exercises,
      adaptations: (plan as any).adaptations || [],
      diffSummary: { addedCount, removedCount, swappedCount },
    };

    list.push(commit);
    this.history.set(userId, list);
    return commit;
  }

  public rollbackToVersion(userId: number, targetVersionId: string): WorkoutCommit | null {
    const list = this.getHistory(userId);
    const target = list.find(c => c.versionId === targetVersionId);
    if (!target) return null;

    const rolledBackCommit: WorkoutCommit = {
      versionId: `v${list.length + 1}.0.0-rollback`,
      parentVersionId: list[list.length - 1].versionId,
      timestamp: new Date().toISOString(),
      author: 'User Customization',
      commitMessage: `Rollback to ${targetVersionId}`,
      aiReasoning: `User explicitly restored state from immutable commit ${targetVersionId}.`,
      exercises: target.exercises,
      diffSummary: { addedCount: 0, removedCount: 0, swappedCount: 0 },
    };

    list.push(rolledBackCommit);
    return rolledBackCommit;
  }
}

export const versionControlService = new WorkoutVersionControlStore();
