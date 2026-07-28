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

    const weightKg = onboardingData.weightKg || onboardingData.weight_kg ? parseFloat(String(onboardingData.weightKg || onboardingData.weight_kg)) : undefined;
    const heightCm = onboardingData.heightCm || onboardingData.height_cm ? parseFloat(String(onboardingData.heightCm || onboardingData.height_cm)) : undefined;

    let dailyCaloriesTarget = onboardingData.dailyCaloriesTarget || onboardingData.daily_calories_target;
    let proteinTargetG = onboardingData.proteinTargetG || onboardingData.protein_target_g;
    if (weightKg) {
      proteinTargetG = proteinTargetG || Math.round(weightKg * 2.0);
      dailyCaloriesTarget = dailyCaloriesTarget || Math.round(weightKg * 32);
    }

    const updates: Record<string, any> = {
      name: onboardingData.name || undefined,
      age: onboardingData.age ? parseInt(String(onboardingData.age), 10) : undefined,
      gender: onboardingData.gender,
      weight_kg: weightKg,
      height_cm: heightCm,
      body_fat_pct: onboardingData.bodyFatPct || onboardingData.body_fat_pct ? parseFloat(String(onboardingData.bodyFatPct || onboardingData.body_fat_pct)) : undefined,
      goal: onboardingData.goal,
      diet_preference: onboardingData.dietPref || onboardingData.diet_preference || onboardingData.diet,
      equipment: onboardingData.equipment,
      time_commitment: onboardingData.timeCommitment || onboardingData.time_commitment,
      experience_level: onboardingData.experienceLevel || onboardingData.experience_level,
      injuries: onboardingData.injuries,
      daily_calories_target: dailyCaloriesTarget,
      protein_target_g: proteinTargetG,
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

    const achievements = [
      {
        id: 'first_workout',
        emoji: '🏋️',
        name: 'First Blood',
        description: 'Complete your first custom workout',
        unlocked: completedCount >= 1,
        current: Math.min(completedCount, 1),
        target: 1,
        progressPct: Math.min(100, Math.round((completedCount / 1) * 100)),
      },
      {
        id: 'streak_3d',
        emoji: '🔥',
        name: 'Consistency Kick',
        description: 'Maintain a 3-day workout streak',
        unlocked: currentStreak >= 3,
        current: Math.min(currentStreak, 3),
        target: 3,
        progressPct: Math.min(100, Math.round((currentStreak / 3) * 100)),
      },
      {
        id: 'level_5',
        emoji: '🥉',
        name: 'Bronze Athlete',
        description: 'Reach Level 5 (450+ XP)',
        unlocked: user.level >= 5,
        current: Math.min(user.level, 5),
        target: 5,
        progressPct: Math.min(100, Math.round((user.level / 5) * 100)),
      },
      {
        id: 'workouts_10',
        emoji: '⚡',
        name: 'Iron Will',
        description: 'Complete 10 total sessions',
        unlocked: completedCount >= 10,
        current: Math.min(completedCount, 10),
        target: 10,
        progressPct: Math.min(100, Math.round((completedCount / 10) * 100)),
      },
    ];

    const levelData = {
      xp: user.xp || 0,
      level: user.level || 1,
      levelTitle: user.levelTitle || 'Novice Trainee',
      xpCurrentLevelStart: user.xpCurrentLevelStart || 0,
      xpNextLevelStart: user.xpNextLevelStart || 100,
      xpInCurrentLevel: user.xpInCurrentLevel || 0,
      xpNeeded: user.xpNeeded || 100,
      progressPct: user.progressPct || 0,
      xpToNextLevel: user.xpToNextLevel || 100,
    };

    return {
      userId,
      user,
      stats: {
        totalWorkouts: history.length,
        completedWorkouts: completedCount,
        currentStreak,
        xp: user.xp || 0,
        level: user.level || 1,
        levelTitle: user.levelTitle || 'Novice Trainee',
      },
      levelData,
      achievements,
      completedWorkouts: completedCount,
      currentStreak,
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
