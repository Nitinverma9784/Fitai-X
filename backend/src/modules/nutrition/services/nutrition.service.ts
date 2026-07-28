import { nutritionRepository } from '../repositories/nutrition.repository';

export class NutritionService {
  async getDietPlan(userId: number = 1): Promise<any> {
    return nutritionRepository.getDietPlan(userId);
  }

  async saveDietPlan(userId: number = 1, planData: any): Promise<any> {
    return nutritionRepository.saveDietPlan(userId, planData);
  }

  async logMeal(userId: number = 1, meal: any): Promise<any> {
    return nutritionRepository.logMeal(userId, meal);
  }

  async getMealLogs(userId: number = 1, dateStr?: string): Promise<any[]> {
    return nutritionRepository.getMealLogs(userId, dateStr);
  }
}

export const nutritionService = new NutritionService();
