import { recoveryRepository } from '../repositories/recovery.repository';

export class RecoveryService {
  async saveRecoveryLog(userId: number = 1, logData: any): Promise<any> {
    return recoveryRepository.saveRecoveryLog(userId, logData);
  }

  async getLatestRecovery(userId: number = 1): Promise<any> {
    return recoveryRepository.getLatestRecovery(userId);
  }

  async getRecoveryHistory(userId: number = 1, limit: number = 30): Promise<any[]> {
    return recoveryRepository.getRecoveryHistory(userId, limit);
  }
}

export const recoveryService = new RecoveryService();
