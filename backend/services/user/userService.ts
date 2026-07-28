import { pool, isPostgresConnected, memoryDb } from '../../core/database';
import { getLocalDateString } from '../../core/config';

export function calculateLevelData(xp: number = 0) {
  const safeXp = Math.max(0, xp || 0);

  let level = Math.floor((1 + Math.sqrt(1 + (8 * safeXp) / 50)) / 2);
  level = Math.max(1, Math.min(100, level));

  const xpCurrentLevelStart = 50 * level * (level - 1);
  const xpNextLevelStart = 50 * (level + 1) * level;

  const xpForCurrentLevel = safeXp - xpCurrentLevelStart;
  const xpRequiredForNextLevel = xpNextLevelStart - xpCurrentLevelStart;

  const progressPct = Math.min(
    100,
    Math.max(0, Math.round((xpForCurrentLevel / xpRequiredForNextLevel) * 100))
  );

  return {
    level,
    xp: safeXp,
    xpForCurrentLevel,
    xpRequiredForNextLevel,
    progressPct,
  };
}

function parseDbDateString(dbDate: any, fallbackCreatedAt?: any): string {
  if (!dbDate) {
    return fallbackCreatedAt ? parseDbDateString(fallbackCreatedAt) : getLocalDateString();
  }
  if (typeof dbDate === 'string') {
    return dbDate.split('T')[0];
  }
  if (dbDate instanceof Date) {
    return dbDate.toISOString().split('T')[0];
  }
  return String(dbDate).split('T')[0];
}

export class UserService {
  async ensureUserExists(userId: number = 1): Promise<void> {
    if (!isPostgresConnected()) {
      let u = memoryDb.users.find(user => user.id === userId);
      if (!u) {
        u = {
          id: userId,
          name: 'Athlete',
          email: 'user@fitai.pro',
          avatar: 'AT',
          tier: 'FITAI PRO ATHLETE',
          xp: 0,
          onboarding_completed: false,
          created_at: new Date(),
        };
        memoryDb.users.push(u);
      }
      return;
    }

    try {
      const res = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
      if (res.rowCount === 0) {
        await pool.query(
          `INSERT INTO users (id, name, email, avatar, xp, onboarding_completed)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [userId, 'Athlete', `athlete_${userId}@fitai.pro`, 'AT', 0, false]
        );
      }
    } catch (err: any) {
      console.warn(`⚠️ ensureUserExists error for userId=${userId}:`, err.message);
    }
  }

  async getUser(userId: number = 1): Promise<any> {
    await this.ensureUserExists(userId);

    if (isPostgresConnected()) {
      const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        const lvl = calculateLevelData(u.xp || 0);
        return { ...u, ...lvl };
      }
    }

    const memUser = memoryDb.users.find(u => u.id === userId) || {
      id: userId,
      name: 'Athlete',
      email: 'user@fitai.pro',
      avatar: 'AT',
      xp: 0,
    };
    const lvl = calculateLevelData(memUser.xp || 0);
    return { ...memUser, ...lvl };
  }

  async getUserByEmail(email: string): Promise<any> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    if (isPostgresConnected()) {
      const res = await pool.query(`SELECT * FROM users WHERE LOWER(email) = $1`, [cleanEmail]);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        const lvl = calculateLevelData(u.xp || 0);
        return { ...u, ...lvl };
      }
      return null;
    }

    const memUser = memoryDb.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (memUser) {
      const lvl = calculateLevelData(memUser.xp || 0);
      return { ...memUser, ...lvl };
    }
    return null;
  }

  async createUser(data: { name: string; email: string; provider?: string; avatar?: string; passwordHash?: string }): Promise<any> {
    const cleanEmail = data.email.trim().toLowerCase();
    const avatar = data.avatar || data.name.slice(0, 2).toUpperCase();
    const provider = data.provider || 'email';

    if (isPostgresConnected()) {
      const res = await pool.query(
        `INSERT INTO users (name, email, auth_provider, avatar, password_hash, xp, onboarding_completed)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar
         RETURNING *`,
        [data.name, cleanEmail, provider, avatar, data.passwordHash || null, 0, false]
      );
      const u = res.rows[0];
      const lvl = calculateLevelData(u.xp || 0);
      return { ...u, ...lvl };
    }

    const newId = memoryDb.users.length > 0 ? Math.max(...memoryDb.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      name: data.name,
      email: cleanEmail,
      auth_provider: provider,
      avatar,
      password_hash: data.passwordHash || null,
      xp: 0,
      onboarding_completed: false,
      created_at: new Date(),
    };
    memoryDb.users.push(newUser);
    const lvl = calculateLevelData(0);
    return { ...newUser, ...lvl };
  }

  async addXp(userId: number = 1, amount: number): Promise<{ xpAdded: number; newTotalXp: number; levelData: any; leveledUp: boolean }> {
    await this.ensureUserExists(userId);

    let oldXp = 0;
    let newXp = 0;

    if (isPostgresConnected()) {
      const curr = await pool.query(`SELECT xp FROM users WHERE id = $1`, [userId]);
      oldXp = curr.rows[0]?.xp || 0;
      newXp = oldXp + amount;
      await pool.query(`UPDATE users SET xp = $1 WHERE id = $2`, [newXp, userId]);
    } else {
      const u = memoryDb.users.find(user => user.id === userId);
      if (u) {
        oldXp = u.xp || 0;
        u.xp = oldXp + amount;
        newXp = u.xp;
      }
    }

    const oldLevelData = calculateLevelData(oldXp);
    const newLevelData = calculateLevelData(newXp);
    const leveledUp = newLevelData.level > oldLevelData.level;

    return {
      xpAdded: amount,
      newTotalXp: newXp,
      levelData: newLevelData,
      leveledUp,
    };
  }

  async updateUser(userId: number = 1, updates: Record<string, any>): Promise<any> {
    await this.ensureUserExists(userId);

    const allowedFields = [
      'name', 'email', 'avatar', 'tier', 'goal', 'weight_kg', 'height_cm',
      'body_fat_pct', 'gender', 'age', 'equipment', 'time_commitment',
      'experience_level', 'injuries', 'diet_preference', 'daily_calories_target',
      'protein_target_g', 'carbs_target_g', 'fats_target_g', 'water_target_l',
      'onboarding_completed', 'xp'
    ];

    const filtered: Record<string, any> = {};
    for (const key of Object.keys(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        filtered[snakeKey] = updates[key];
      }
    }

    if (Object.keys(filtered).length === 0) {
      return this.getUser(userId);
    }

    if (isPostgresConnected()) {
      const setClauses: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [col, val] of Object.entries(filtered)) {
        if (Array.isArray(val)) {
          setClauses.push(`${col} = $${idx}`);
          values.push(val);
        } else {
          setClauses.push(`${col} = $${idx}`);
          values.push(val);
        }
        idx++;
      }

      values.push(userId);
      const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
      const res = await pool.query(query, values);
      const u = res.rows[0];
      const lvl = calculateLevelData(u.xp || 0);
      return { ...u, ...lvl };
    }

    const u = memoryDb.users.find(user => user.id === userId);
    if (u) {
      Object.assign(u, filtered);
      const lvl = calculateLevelData(u.xp || 0);
      return { ...u, ...lvl };
    }

    return this.getUser(userId);
  }

  async awardXp(userId: number = 1, amount: number): Promise<any> {
    return this.addXp(userId, amount);
  }

  async saveUserOnboarding(userId: number = 1, onboardingData: any): Promise<any> {
    await this.ensureUserExists(userId);
    const updates: Record<string, any> = {
      name: onboardingData.name || undefined,
      age: onboardingData.age ? parseInt(String(onboardingData.age), 10) : undefined,
      gender: onboardingData.gender || undefined,
      weight_kg: onboardingData.weightKg || onboardingData.weight_kg ? parseFloat(String(onboardingData.weightKg || onboardingData.weight_kg)) : undefined,
      height_cm: onboardingData.heightCm || onboardingData.height_cm ? parseFloat(String(onboardingData.heightCm || onboardingData.height_cm)) : undefined,
      body_fat_pct: onboardingData.bodyFatPct || onboardingData.body_fat_pct ? parseFloat(String(onboardingData.bodyFatPct || onboardingData.body_fat_pct)) : undefined,
      goal: onboardingData.goal || undefined,
      equipment: onboardingData.equipment || undefined,
      time_commitment: onboardingData.timeCommitment || onboardingData.time_commitment || undefined,
      experience_level: onboardingData.experienceLevel || onboardingData.experience_level || undefined,
      injuries: onboardingData.injuries || undefined,
      diet_preference: onboardingData.dietPref || onboardingData.diet_preference || undefined,
      daily_calories_target: onboardingData.dailyCaloriesTarget || onboardingData.daily_calories_target ? parseInt(String(onboardingData.dailyCaloriesTarget || onboardingData.daily_calories_target), 10) : undefined,
      protein_target_g: onboardingData.proteinTargetG || onboardingData.protein_target_g ? parseInt(String(onboardingData.proteinTargetG || onboardingData.protein_target_g), 10) : undefined,
      carbs_target_g: onboardingData.carbsTargetG || onboardingData.carbs_target_g ? parseInt(String(onboardingData.carbsTargetG || onboardingData.carbs_target_g), 10) : undefined,
      fats_target_g: onboardingData.fatsTargetG || onboardingData.fats_target_g ? parseInt(String(onboardingData.fatsTargetG || onboardingData.fats_target_g), 10) : undefined,
      water_target_l: onboardingData.waterTargetL || onboardingData.water_target_l ? parseFloat(String(onboardingData.waterTargetL || onboardingData.water_target_l)) : undefined,
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

    // 1. Query Workouts (Filter strictly by userId, exclude hardcoding)
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

    // 2. Query Recovery Logs (Filter strictly by userId, exact values only)
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
