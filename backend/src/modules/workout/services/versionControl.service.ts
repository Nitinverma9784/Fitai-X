import { ExerciseItem, GeneratedWorkoutPlan } from './adaptivePlanning.service';
import { pool, isPostgresConnected } from '../../../core/database/connection';

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

  public async getHistory(userId: number): Promise<WorkoutCommit[]> {
    if (isPostgresConnected()) {
      try {
        const res = await pool.query(
          `SELECT version_id as "versionId", parent_version_id as "parentVersionId", created_at as "timestamp", author, commit_message as "commitMessage", ai_reasoning as "aiReasoning", exercises, diff_summary as "diffSummary" FROM workout_commits WHERE user_id = $1 ORDER BY id ASC`,
          [userId]
        );
        return res.rows.map(r => ({
          ...r,
          timestamp: new Date(r.timestamp).toISOString(),
          diffSummary: typeof r.diffSummary === 'string' ? JSON.parse(r.diffSummary) : (r.diffSummary || { addedCount: 0, removedCount: 0, swappedCount: 0 }),
          exercises: typeof r.exercises === 'string' ? JSON.parse(r.exercises) : (r.exercises || []),
        }));
      } catch (err) {
        console.error('Error fetching workout commits from DB:', err);
      }
    }
    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }
    return this.history.get(userId)!;
  }

  public async commitNewVersion(
    userId: number,
    plan: GeneratedWorkoutPlan,
    author: 'FitAI Engine' | 'User Customization' | 'Recovery Auto-Deload',
    message: string
  ): Promise<WorkoutCommit> {
    const list = await this.getHistory(userId);
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

    if (isPostgresConnected()) {
      try {
        await pool.query(
          `INSERT INTO workout_commits (user_id, version_id, parent_version_id, author, commit_message, ai_reasoning, exercises, diff_summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, commit.versionId, commit.parentVersionId, commit.author, commit.commitMessage, commit.aiReasoning, JSON.stringify(commit.exercises), JSON.stringify(commit.diffSummary)]
        );
      } catch (err) {
        console.error('Error saving workout commit to DB:', err);
      }
    }

    list.push(commit);
    this.history.set(userId, list);
    return commit;
  }

  public async rollbackToVersion(userId: number, targetVersionId: string): Promise<WorkoutCommit | null> {
    const list = await this.getHistory(userId);
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

    if (isPostgresConnected()) {
      try {
        await pool.query(
          `INSERT INTO workout_commits (user_id, version_id, parent_version_id, author, commit_message, ai_reasoning, exercises, diff_summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userId, rolledBackCommit.versionId, rolledBackCommit.parentVersionId, rolledBackCommit.author, rolledBackCommit.commitMessage, rolledBackCommit.aiReasoning, JSON.stringify(rolledBackCommit.exercises), JSON.stringify(rolledBackCommit.diffSummary)]
        );
      } catch (err) {
        console.error('Error saving rollback commit to DB:', err);
      }
    }

    list.push(rolledBackCommit);
    this.history.set(userId, list);
    return rolledBackCommit;
  }
}

export const versionControlService = new WorkoutVersionControlStore();
