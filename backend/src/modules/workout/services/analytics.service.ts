import { exerciseLogRepository } from '../repositories/exerciseLog.repository';

export class AnalyticsService {
  async saveExerciseLog(userId: number = 1, data: any): Promise<any> {
    return exerciseLogRepository.saveExerciseLog(userId, data);
  }

  async getUserExerciseLogs(userId: number = 1, limit: number = 50): Promise<any[]> {
    return exerciseLogRepository.getUserExerciseLogs(userId, limit);
  }
}

export const analyticsService = new AnalyticsService();
