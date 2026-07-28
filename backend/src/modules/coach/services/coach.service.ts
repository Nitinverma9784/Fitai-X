import { coachRepository } from '../repositories/coach.repository';

export class CoachService {
  async saveChatMessage(userId: number = 1, sender: string, text: string): Promise<any> {
    return coachRepository.saveChatMessage(userId, sender, text);
  }

  async getChatHistory(userId: number = 1): Promise<any[]> {
    return coachRepository.getChatHistory(userId);
  }
}

export const coachService = new CoachService();
