import { pool, isPostgresConnected, memoryDb } from '../../core/database';
import { userService } from '../user/userService';
import { getLocalDateString } from '../../core/config';

export class RecoveryService {
  async saveRecoveryLog(userId: number = 1, logData: any): Promise<any> {
    await userService.ensureUserExists(userId);
    const readinessPercentage = logData.readinessPercentage || 85;
    const statusLabel = logData.statusLabel || 'Optimal Bio-Recovery';
    const description = logData.description || '';
    const hrv_ms = logData.hrv_ms || 65;
    const sleep_hours = logData.sleep_hours || 7.5;
    const sleep_efficiency = logData.sleep_efficiency || 90;
    const muscle_soreness = logData.muscle_soreness || 'Low';
    const hydration_l = logData.hydration_l || 2.5;
    const todayStr = logData.logDate || getLocalDateString();

    if (isPostgresConnected()) {
      const res = await pool.query(
        `
        INSERT INTO recovery_logs (user_id, readiness_percentage, status_label, description, hrv_ms, sleep_hours, sleep_efficiency, muscle_soreness, hydration_l, log_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
        [userId, readinessPercentage, statusLabel, description, hrv_ms, sleep_hours, sleep_efficiency, muscle_soreness, hydration_l, todayStr]
      );
      return res.rows[0];
    }

    const log = {
      id: memoryDb.recovery_logs.length + 1,
      user_id: userId,
      readiness_percentage: readinessPercentage,
      status_label: statusLabel,
      description,
      hrv_ms,
      sleep_hours,
      sleep_efficiency,
      muscle_soreness,
      hydration_l,
      log_date: todayStr,
      created_at: new Date(),
    };
    memoryDb.recovery_logs.unshift(log);
    return log;
  }

  async getLatestRecovery(userId: number = 1): Promise<any> {
    if (isPostgresConnected()) {
      const res = await pool.query('SELECT * FROM recovery_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
      return res.rows[0] || null;
    }
    const userLogs = memoryDb.recovery_logs.filter(r => r.user_id === userId);
    return userLogs.length > 0 ? userLogs[0] : null;
  }

  async getRecoveryHistory(userId: number = 1, limit: number = 30): Promise<any[]> {
    if (isPostgresConnected()) {
      const res = await pool.query('SELECT * FROM recovery_logs WHERE user_id = $1 ORDER BY id DESC LIMIT $2', [userId, limit]);
      return res.rows;
    }
    return (memoryDb.recovery_logs || []).filter(r => r.user_id === userId).slice(0, limit);
  }
}

export const recoveryService = new RecoveryService();
