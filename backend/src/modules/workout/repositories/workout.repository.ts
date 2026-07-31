import { pool, isPostgresConnected } from '../../../core/database/connection';
import { memoryDb } from '../../../shared/database/memoryDb';
import { getLocalDateString } from '../../../shared/utils/date';
import { userRepository } from '../../user/repositories/user.repository';

export class WorkoutRepository {
  async saveWorkout(userId: number = 1, workoutData: any): Promise<any> {
    await userRepository.ensureUserExists(userId);
    const {
      title, durationMinutes, estimatedCalories, targetMuscles,
      whyRecommendation, aiReasoning, readinessScore, adaptations, analysisSteps, exercises, sessionDate,
    } = workoutData;

    const today = sessionDate || getLocalDateString();

    if (isPostgresConnected()) {
      // Check if an uncompleted (pending) workout row exists for today
      const existingRes = await pool.query(
        `SELECT * FROM workouts WHERE user_id = $1 AND session_date = $2 AND status = 'pending' ORDER BY id DESC LIMIT 1`,
        [userId, today]
      );

      let workout: any;
      if (existingRes.rows.length > 0) {
        const existingId = existingRes.rows[0].id;
        await pool.query('DELETE FROM exercises WHERE workout_id = $1', [existingId]);

        const updateRes = await pool.query(
          `
          UPDATE workouts
          SET title = $2, duration_minutes = $3, estimated_calories = $4, target_muscles = $5, why_recommendation = $6, ai_reasoning = $7, readiness_score = $8
          WHERE id = $1
          RETURNING *
        `,
          [existingId, title, durationMinutes, estimatedCalories, targetMuscles, whyRecommendation, aiReasoning || '', readinessScore || 75]
        );
        workout = updateRes.rows[0];
      } else {
        const wRes = await pool.query(
          `
          INSERT INTO workouts (user_id, title, duration_minutes, estimated_calories, target_muscles, why_recommendation, ai_reasoning, readiness_score, session_date, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
          RETURNING *
        `,
          [userId, title, durationMinutes, estimatedCalories, targetMuscles, whyRecommendation, aiReasoning || '', readinessScore || 75, today]
        );
        workout = wRes.rows[0];
      }

      const savedExercises = [];
      for (const ex of exercises || []) {
        const eRes = await pool.query(
          `
          INSERT INTO exercises (workout_id, name, sets, reps, rest_sec, icon, tip, target_muscle, video_url, steps, completed_sets)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `,
          [
            workout.id,
            ex.name,
            ex.sets,
            ex.reps,
            ex.restSec || ex.rest_sec || 60,
            ex.icon || 'dumbbell',
            ex.tip || '',
            ex.targetMuscle || ex.target_muscle || '',
            ex.videoUrl || ex.video_url || '',
            ex.steps || [],
            0
          ]
        );
        savedExercises.push(eRes.rows[0]);
      }

      return {
        ...workout,
        adaptations: adaptations || [],
        analysis_steps: analysisSteps || [],
        exercises: savedExercises,
      };
    }

    // In-memory DB fallback
    const existingIndex = memoryDb.workouts.findIndex(w => w.user_id === userId && w.session_date === today && w.status === 'pending');
    let newId: number;
    let workout: any;

    if (existingIndex !== -1) {
      newId = memoryDb.workouts[existingIndex].id;
      memoryDb.exercises = memoryDb.exercises.filter(e => e.workout_id !== newId);
      workout = {
        ...memoryDb.workouts[existingIndex],
        title,
        duration_minutes: durationMinutes,
        estimated_calories: estimatedCalories,
        target_muscles: targetMuscles,
        why_recommendation: whyRecommendation,
        ai_reasoning: aiReasoning || '',
        readiness_score: readinessScore || 75,
        adaptations: adaptations || [],
        analysis_steps: analysisSteps || [],
      };
      memoryDb.workouts[existingIndex] = workout;
    } else {
      newId = memoryDb.workouts.length + 1;
      workout = {
        id: newId,
        user_id: userId,
        title,
        duration_minutes: durationMinutes,
        estimated_calories: estimatedCalories,
        target_muscles: targetMuscles,
        why_recommendation: whyRecommendation,
        ai_reasoning: aiReasoning || '',
        readiness_score: readinessScore || 75,
        adaptations: adaptations || [],
        analysis_steps: analysisSteps || [],
        session_date: today,
        status: 'pending',
        created_at: new Date(),
      };
      memoryDb.workouts.unshift(workout);
    }

    const savedExercises = (exercises || []).map((ex: any, idx: number) => ({
      id: memoryDb.exercises.length + idx + 1,
      workout_id: newId,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest_sec: ex.restSec || ex.rest_sec || 60,
      icon: ex.icon || 'dumbbell',
      tip: ex.tip || '',
      target_muscle: ex.targetMuscle || ex.target_muscle || '',
      video_url: ex.videoUrl || ex.video_url || '',
      steps: ex.steps || [],
      bodymap_male: ex.bodymapMaleUrl || ex.bodymap_male || '',
      bodymap_female: ex.bodymapFemaleUrl || ex.bodymap_female || '',
      bodymap_url: ex.bodymap_url || ex.bodymapUrl || ex.bodymapMaleUrl || ex.bodymap_male || '',
      completed_sets: 0,
    }));

    memoryDb.exercises.push(...savedExercises);
    return { ...workout, exercises: savedExercises };
  }

  async getLatestWorkout(userId: number = 1): Promise<any> {
    if (isPostgresConnected()) {
      const wRes = await pool.query('SELECT * FROM workouts WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
      if (wRes.rows.length === 0) return null;
      const workout = wRes.rows[0];
      const eRes = await pool.query('SELECT * FROM exercises WHERE workout_id = $1 ORDER BY id ASC', [workout.id]);
      return { ...workout, exercises: eRes.rows };
    }
    const workout = memoryDb.workouts[0];
    if (!workout) return null;
    const exercises = memoryDb.exercises.filter(e => e.workout_id === workout.id);
    return { ...workout, exercises };
  }

  async getWorkoutHistory(userId: number = 1, limit: number = 20): Promise<any[]> {
    if (isPostgresConnected()) {
      const wRes = await pool.query(
        `SELECT w.*, COALESCE(array_agg(row_to_json(e) ORDER BY e.id ASC) FILTER (WHERE e.id IS NOT NULL), '[]'::json) as exercises
         FROM workouts w
         LEFT JOIN exercises e ON e.workout_id = w.id
         WHERE w.user_id = $1
         GROUP BY w.id
         ORDER BY w.id DESC
         LIMIT $2`,
        [userId, limit]
      );
      return wRes.rows.map(w => ({
        ...w,
        exercises: typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []),
      }));
    }
    return memoryDb.workouts
      .filter(w => w.user_id === userId)
      .slice(0, limit)
      .map(w => ({ ...w, exercises: memoryDb.exercises.filter(e => e.workout_id === w.id) }));
  }

  async updateExerciseSets(exerciseId: number | string, completedSets: number): Promise<any> {
    const numericId = typeof exerciseId === 'number' ? exerciseId : parseInt(String(exerciseId), 10);
    if (isNaN(numericId) || numericId <= 0) return null;
    if (isPostgresConnected()) {
      const res = await pool.query(
        `UPDATE exercises SET completed_sets = $1 WHERE id = $2 RETURNING *`,
        [completedSets, numericId]
      );
      return res.rows[0] || null;
    }
    const ex = memoryDb.exercises.find(e => e.id === numericId);
    if (ex) ex.completed_sets = completedSets;
    return ex || null;
  }

  async toggleExerciseCompletion(exerciseId: number | string, isCompleted: boolean): Promise<any> {
    const numericId = typeof exerciseId === 'number' ? exerciseId : parseInt(String(exerciseId), 10);
    if (isNaN(numericId) || numericId <= 0) return null;
    if (isPostgresConnected()) {
      const res = await pool.query(
        `UPDATE exercises SET is_completed = $1, completed_sets = CASE WHEN $1 THEN sets ELSE 0 END WHERE id = $2 RETURNING *`,
        [isCompleted, numericId]
      );
      return res.rows[0] || null;
    }
    const ex = memoryDb.exercises.find(e => e.id === numericId);
    if (ex) { ex.is_completed = isCompleted; ex.completed_sets = isCompleted ? ex.sets : 0; }
    return ex || null;
  }

  async getTodayWorkout(userId: number = 1): Promise<any> {
    const today = getLocalDateString();
    if (isPostgresConnected()) {
      const wRes = await pool.query(
        `SELECT * FROM workouts WHERE user_id = $1 AND session_date = $2 ORDER BY id DESC LIMIT 1`,
        [userId, today]
      );
      if (wRes.rows.length === 0) return null;
      const workout = wRes.rows[0];
      const eRes = await pool.query('SELECT * FROM exercises WHERE workout_id = $1 ORDER BY id ASC', [workout.id]);
      return { ...workout, exercises: eRes.rows };
    }
    const workout = memoryDb.workouts.find(w => w.user_id === userId && w.session_date === today);
    if (!workout) return null;
    const exercises = memoryDb.exercises.filter(e => e.workout_id === workout.id);
    return { ...workout, exercises };
  }

  async markMissedWorkoutsBeforeToday(userId: number = 1): Promise<void> {
    const today = getLocalDateString();
    if (isPostgresConnected()) {
      await pool.query(
        `UPDATE workouts SET status = 'missed' WHERE user_id = $1 AND session_date < $2 AND status = 'pending'`,
        [userId, today]
      );
    } else {
      memoryDb.workouts.forEach(w => {
        if (w.user_id === userId && w.session_date < today && w.status === 'pending') w.status = 'missed';
      });
    }
  }

  async markWorkoutComplete(workoutId: number, feedback: { energy: number; soreness: number; mood: number; notes?: string }): Promise<any> {
    let completedWorkout: any = null;
    if (isPostgresConnected()) {
      const res = await pool.query(
        `UPDATE workouts
         SET status = 'completed', completed_at = NOW(),
             feedback_energy = $2, feedback_soreness = $3, feedback_mood = $4, feedback_notes = $5
         WHERE id = $1 RETURNING *`,
        [workoutId, feedback.energy, feedback.soreness, feedback.mood, feedback.notes || '']
      );
      if (res.rows.length > 0) {
        const w = res.rows[0];
        const eRes = await pool.query('SELECT * FROM exercises WHERE workout_id = $1 ORDER BY id ASC', [w.id]);
        completedWorkout = { ...w, exercises: eRes.rows };
      }
    } else {
      const w = memoryDb.workouts.find(w => w.id === workoutId);
      if (w) {
        Object.assign(w, { status: 'completed', completed_at: new Date(), ...feedback });
        const exercises = memoryDb.exercises.filter(e => e.workout_id === w.id);
        completedWorkout = { ...w, exercises };
      }
    }
    return completedWorkout;
  }

  async markWorkoutMissed(workoutId: number): Promise<any> {
    if (isPostgresConnected()) {
      const res = await pool.query(
        `UPDATE workouts SET status = 'missed' WHERE id = $1 RETURNING *`,
        [workoutId]
      );
      return res.rows[0] || null;
    }
    const w = memoryDb.workouts.find(w => w.id === workoutId);
    if (w) w.status = 'missed';
    return w || null;
  }

  async getWorkoutStreak(userId: number = 1, days: number = 7): Promise<any[]> {
    const result: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      result.push({ date: dateStr, status: 'none' });
    }
    if (isPostgresConnected()) {
      const startDate = result[0].date;
      const rows = await pool.query(
        `SELECT session_date::text as date, status FROM workouts WHERE user_id = $1 AND session_date >= $2 ORDER BY session_date ASC`,
        [userId, startDate]
      );
      rows.rows.forEach((row: any) => {
        const slot = result.find(r => r.date === row.date);
        if (slot) slot.status = row.status || 'pending';
      });
    } else {
      memoryDb.workouts.filter(w => w.user_id === userId).forEach(w => {
        const slot = result.find(r => r.date === w.session_date);
        if (slot) slot.status = w.status || 'pending';
      });
    }
    return result;
  }
}

export const workoutRepository = new WorkoutRepository();
