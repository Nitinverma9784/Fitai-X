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
      // Initialize clean empty history array (no hardcoded seed templates)
      this.history.set(userId, []);
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
    const minor = list.length + 1;
    const patch = 0;
    const versionId = `v${major}.${minor}.${patch}`;

    // Compute diffs against parent
    let addedCount = 0;
    let removedCount = 0;
    let swappedCount = (plan as any).conflictsDetected ? (plan as any).conflictsDetected.length : 0;

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
      aiReasoning: (plan as any).aiReasoning || plan.aiExplanation || 'Dynamic AI workout commit initialized.',
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
      parentVersionId: list.length > 0 ? list[list.length - 1].versionId : null,
      timestamp: new Date().toISOString(),
      author: 'User Customization',
      commitMessage: `Rollback to ${targetVersionId}`,
      aiReasoning: `User explicitly restored state from immutable commit ${targetVersionId}.`,
      exercises: target.exercises,
      diffSummary: { addedCount: 0, removedCount: 0, swappedCount: 0 },
    };

    list.push(rolledBackCommit);
    this.history.set(userId, list);
    return rolledBackCommit;
  }
}

export const versionControlService = new WorkoutVersionControlStore();
