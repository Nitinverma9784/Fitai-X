import { userRepository } from '../repositories/user.repository';
import { pool, isPostgresConnected } from '../../../core/database/connection';
import { memoryDb } from '../../../shared/database/memoryDb';
import { parseDbDateString } from '../utils/level.utils';

export class UserService {
  async ensureUserExists(userId: number = 1): Promise<void> {
    return userRepository.ensureUserExists(userId);
  }

  async getUser(userId: number = 1): Promise<any> {
    return userRepository.getUser(userId);
  }

  async getUserByEmail(email: string): Promise<any> {
    return userRepository.getUserByEmail(email);
  }

  async createUser(data: { name: string; email: string; provider?: string; avatar?: string; passwordHash?: string }): Promise<any> {
    return userRepository.createUser(data);
  }

  async addXp(userId: number = 1, amount: number): Promise<any> {
    return userRepository.addXp(userId, amount);
  }

  async awardXp(userId: number = 1, amount: number): Promise<any> {
    return userRepository.addXp(userId, amount);
  }

  async updateUser(userId: number = 1, updates: Record<string, any>): Promise<any> {
    return userRepository.updateUser(userId, updates);
  }

  async saveUserOnboarding(userId: number = 1, onboardingData: any): Promise<any> {
    await this.ensureUserExists(userId);
    const updates = {
      goal: onboardingData.goal,
      weight_kg: onboardingData.weightKg ? parseFloat(onboardingData.weightKg) : undefined,
      height_cm: onboardingData.heightCm ? parseFloat(onboardingData.heightCm) : undefined,
      body_fat_pct: onboardingData.bodyFatPct ? parseFloat(onboardingData.bodyFatPct) : undefined,
      gender: onboardingData.gender,
      equipment: onboardingData.equipment,
      time_commitment: onboardingData.timeCommitment,
      experience_level: onboardingData.experienceLevel,
      injuries: onboardingData.injuries,
      onboarding_completed: true,
    };
    return this.updateUser(userId, updates);
  }

  async getUserStatsAndAchievements(userId: number = 1, history: any[] = [], streakDays: any[] = []): Promise<any> {
    const user = await this.getUser(userId);
    const completedCount = history.filter((w: any) => w.status === 'completed').length;
    
    // Calculate active consecutive streak count ending today
    let currentStreak = 0;
    if (Array.isArray(streakDays) && streakDays.length > 0) {
      const sorted = [...streakDays].sort((a, b) => b.date.localeCompare(a.date));
      for (const day of sorted) {
        if (day.status === 'completed') {
          currentStreak++;
        } else if (day.status === 'missed') {
          break;
        }
      }
    }

    return {
      userId,
      level: user.level,
      xp: user.xp,
      progressPct: user.progressPct,
      xpForCurrentLevel: user.xpForCurrentLevel,
      xpRequiredForNextLevel: user.xpRequiredForNextLevel,
      completedWorkouts: completedCount,
      currentStreak,
      streakDays: currentStreak,
      tier: user.tier || 'FITAI PRO ATHLETE',
    };
  }

  async getCalendarSummary(userId: number = 1): Promise<Record<string, any>> {
    await this.ensureUserExists(userId);
    const summaryMap: Record<string, any> = {};

    // 1. Query Workouts
    let workouts: any[] = [];
    if (isPostgresConnected()) {
      const res = await pool.query(
        `SELECT * FROM workouts WHERE user_id = $1 ORDER BY id DESC LIMIT 100`,
        [userId]
      );
      workouts = res.rows;
    } else {
      workouts = memoryDb.workouts.filter(w => w.user_id === userId);
    }

    for (const w of workouts) {
      const dateStr = parseDbDateString(w.session_date, w.created_at);
      if (!summaryMap[dateStr]) summaryMap[dateStr] = { log_date: dateStr };
      summaryMap[dateStr].workout = {
        id: w.id,
        title: w.title,
        status: w.status || 'pending',
        duration_minutes: w.duration_minutes || w.durationMinutes || 45,
        estimated_calories: w.estimated_calories || w.estimatedCalories || 400,
        target_muscles: w.target_muscles || w.targetMuscles || [],
        completed_at: w.completed_at,
      };
    }

    // 2. Query Recovery Logs
    let recoveryLogs: any[] = [];
    if (isPostgresConnected()) {
      const res = await pool.query(
        `SELECT * FROM recovery_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 100`,
        [userId]
      );
      recoveryLogs = res.rows;
    } else {
      recoveryLogs = memoryDb.recovery_logs.filter(r => r.user_id === userId);
    }

    for (const r of recoveryLogs) {
      const dateStr = parseDbDateString(r.log_date, r.created_at);
      if (!summaryMap[dateStr]) summaryMap[dateStr] = { log_date: dateStr };
      summaryMap[dateStr].recovery = {
        id: r.id,
        readiness_percentage: r.readiness_percentage !== undefined ? r.readiness_percentage : 80,
        status_label: r.status_label || 'Bio-Recovery Logged',
        description: r.description || '',
        sleep_hours: r.sleep_hours !== undefined && r.sleep_hours !== null ? parseFloat(String(r.sleep_hours)) : 0,
        sleep_efficiency: r.sleep_efficiency !== undefined && r.sleep_efficiency !== null ? r.sleep_efficiency : 0,
        hrv_ms: r.hrv_ms !== undefined && r.hrv_ms !== null ? r.hrv_ms : 0,
        hydration_l: r.hydration_l !== undefined && r.hydration_l !== null ? parseFloat(String(r.hydration_l)) : 0,
        muscle_soreness: r.muscle_soreness || 'Low',
      };
    }

    // 3. Query Meal Logs
    let mealLogs: any[] = [];
    if (isPostgresConnected()) {
      const res = await pool.query(
        `SELECT * FROM meal_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 500`,
        [userId]
      );
      mealLogs = res.rows;
    } else {
      mealLogs = memoryDb.meal_logs.filter(m => m.user_id === userId);
    }

    for (const m of mealLogs) {
      const dateStr = parseDbDateString(m.log_date, m.created_at);
      if (!summaryMap[dateStr]) summaryMap[dateStr] = { log_date: dateStr };
      if (!summaryMap[dateStr].nutrition) {
        summaryMap[dateStr].nutrition = {
          totalProteinG: 0,
          totalCarbsG: 0,
          totalFatsG: 0,
          totalCalories: 0,
          mealCount: 0,
          meals: [],
        };
      }
      const n = summaryMap[dateStr].nutrition;
      n.totalProteinG += Math.round(parseFloat(String(m.protein_g || 0)));
      n.totalCarbsG += Math.round(parseFloat(String(m.carbs_g || 0)));
      n.totalFatsG += Math.round(parseFloat(String(m.fats_g || 0)));
      n.totalCalories += Math.round(parseFloat(String(m.calories || 0)));
      n.mealCount += 1;
      n.meals.push({
        mealType: m.meal_type,
        foodItem: m.food_item,
        proteinG: m.protein_g,
        calories: m.calories,
      });
    }

    // 4. Query Exercise Performance Logs
    let exerciseLogs: any[] = [];
    if (isPostgresConnected()) {
      try {
        const res = await pool.query(
          `SELECT * FROM exercise_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 500`,
          [userId]
        );
        exerciseLogs = res.rows;
      } catch {
        exerciseLogs = [];
      }
    } else {
      exerciseLogs = (memoryDb as any).exercise_logs || [];
      exerciseLogs = exerciseLogs.filter(e => e.user_id === userId);
    }

    for (const ex of exerciseLogs) {
      const dateStr = parseDbDateString(ex.log_date, ex.logged_at);
      if (!summaryMap[dateStr]) summaryMap[dateStr] = { log_date: dateStr };
      if (!summaryMap[dateStr].exerciseLogs) {
        summaryMap[dateStr].exerciseLogs = [];
      }
      summaryMap[dateStr].exerciseLogs.push({
        exerciseName: ex.exercise_name,
        weightKg: parseFloat(String(ex.weight_kg || 0)),
        barWeightKg: parseFloat(String(ex.bar_weight_kg || 0)),
        plateWeightKg: parseFloat(String(ex.plate_weight_kg || 0)),
        repsAchieved: ex.reps_achieved || 0,
        isBodyweight: !!ex.is_bodyweight,
        rpe: ex.rpe || 8,
      });
    }

    return summaryMap;
  }
}

export const userService = new UserService();
