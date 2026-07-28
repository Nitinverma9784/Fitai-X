import { pool, isPostgresConnected } from '../../../core/database/connection';
import { memoryDb } from '../../../shared/database/memoryDb';
import { getLocalDateString } from '../../../shared/utils/date';
import { userRepository } from '../../user/repositories/user.repository';

export class NutritionRepository {
  async getDietPlan(userId: number = 1): Promise<any> {
    if (isPostgresConnected()) {
      const res = await pool.query(`SELECT * FROM diet_plans WHERE user_id = $1 ORDER BY id DESC LIMIT 1`, [userId]);
      return res.rows[0]?.plan_data || null;
    }
    const record = memoryDb.diet_plans.find(d => d.user_id === userId);
    return record?.plan_data || null;
  }

  async saveDietPlan(userId: number = 1, planData: any): Promise<any> {
    await userRepository.ensureUserExists(userId);
    if (isPostgresConnected()) {
      const res = await pool.query(
        `INSERT INTO diet_plans (user_id, plan_data, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET plan_data = EXCLUDED.plan_data, updated_at = NOW() RETURNING *`,
        [userId, JSON.stringify(planData)]
      );
      return res.rows[0]?.plan_data;
    }
    const existing = memoryDb.diet_plans.find(d => d.user_id === userId);
    if (existing) {
      existing.plan_data = planData;
      existing.updated_at = new Date();
    } else {
      memoryDb.diet_plans.push({ id: memoryDb.diet_plans.length + 1, user_id: userId, plan_data: planData, updated_at: new Date() });
    }
    return planData;
  }

  async logMeal(userId: number = 1, meal: { mealType: string; foodItem: string; proteinG: number; carbsG: number; fatsG: number; calories: number; logDate?: string }): Promise<any> {
    await userRepository.ensureUserExists(userId);
    const today = meal.logDate || getLocalDateString();
    if (isPostgresConnected()) {
      const res = await pool.query(
        `INSERT INTO meal_logs (user_id, meal_type, food_item, protein_g, carbs_g, fats_g, calories, log_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [userId, meal.mealType, meal.foodItem, meal.proteinG, meal.carbsG, meal.fatsG, meal.calories, today]
      );
      return res.rows[0];
    }
    const newLog = {
      id: memoryDb.meal_logs.length + 1,
      user_id: userId,
      meal_type: meal.mealType,
      food_item: meal.foodItem,
      protein_g: meal.proteinG,
      carbs_g: meal.carbsG,
      fats_g: meal.fatsG,
      calories: meal.calories,
      log_date: today,
      created_at: new Date(),
    };
    memoryDb.meal_logs.unshift(newLog);
    return newLog;
  }

  async getMealLogs(userId: number = 1, dateStr?: string): Promise<any[]> {
    const targetDate = dateStr || getLocalDateString();
    if (isPostgresConnected()) {
      const res = await pool.query(`SELECT * FROM meal_logs WHERE user_id = $1 AND log_date = $2 ORDER BY id DESC`, [userId, targetDate]);
      return res.rows;
    }
    return memoryDb.meal_logs.filter(m => m.user_id === userId && m.log_date === targetDate);
  }
}

export const nutritionRepository = new NutritionRepository();
