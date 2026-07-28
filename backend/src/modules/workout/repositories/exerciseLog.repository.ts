import { pool, isPostgresConnected } from '../../../core/database/connection';
import { memoryDb } from '../../../shared/database/memoryDb';
import { getLocalDateString } from '../../../shared/utils/date';

export class ExerciseLogRepository {
  async saveExerciseLog(userId: number = 1, data: { exerciseName: string; weightKg?: number; barWeightKg?: number; plateWeightKg?: number; repsAchieved: number; isBodyweight?: boolean; rpe?: number; logDate?: string }): Promise<any> {
    const bar = data.barWeightKg || 0;
    const plate = data.plateWeightKg || 0;
    const totalWeight = data.weightKg || (bar + plate * 2);
    const isBw = !!data.isBodyweight;
    const rpe = data.rpe || 8;
    const todayStr = data.logDate || getLocalDateString();

    if (isPostgresConnected()) {
      const res = await pool.query(
        `INSERT INTO exercise_logs (user_id, exercise_name, weight_kg, bar_weight_kg, plate_weight_kg, reps_achieved, is_bodyweight, rpe, log_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [userId, data.exerciseName, totalWeight, bar, plate, data.repsAchieved, isBw, rpe, todayStr]
      );
      return res.rows[0];
    }
    const log = {
      id: (memoryDb as any).exercise_logs ? (memoryDb as any).exercise_logs.length + 1 : 1,
      user_id: userId,
      exercise_name: data.exerciseName,
      weight_kg: totalWeight,
      bar_weight_kg: bar,
      plate_weight_kg: plate,
      reps_achieved: data.repsAchieved,
      is_bodyweight: isBw,
      rpe,
      log_date: todayStr,
      logged_at: new Date(),
    };
    if (!(memoryDb as any).exercise_logs) (memoryDb as any).exercise_logs = [];
    (memoryDb as any).exercise_logs.unshift(log);
    return log;
  }

  async getUserExerciseLogs(userId: number = 1, limit: number = 50): Promise<any[]> {
    if (isPostgresConnected()) {
      try {
        const res = await pool.query(
          `SELECT DISTINCT ON (exercise_name) * FROM exercise_logs WHERE user_id = $1 ORDER BY exercise_name, logged_at DESC LIMIT $2`,
          [userId, limit]
        );
        return res.rows;
      } catch {
        return [];
      }
    }
    const logs = (memoryDb as any).exercise_logs || [];
    const map = new Map<string, any>();
    for (const log of logs) {
      if (log.user_id === userId && !map.has(log.exercise_name.toLowerCase())) {
        map.set(log.exercise_name.toLowerCase(), log);
      }
    }
    return Array.from(map.values()).slice(0, limit);
  }
}

export const exerciseLogRepository = new ExerciseLogRepository();
