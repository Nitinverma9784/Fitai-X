import { pool, isPostgresConnected, memoryDb } from '../../core/database';
import { getLocalDateString } from '../../core/config';

export function calculateLevelData(xp: number = 0) {
  const safeXp = Math.max(0, xp || 0);

  let level = Math.floor((1 + Math.sqrt(1 + (8 * safeXp) / 50)) / 2);
  level = Math.max(1, Math.min(100, level));

  const xpCurrentLevelStart = 50 * level * (level - 1);
  const xpNextLevelStart = 50 * (level + 1) * level;
  const xpNeeded = xpNextLevelStart - xpCurrentLevelStart;
  const xpInCurrentLevel = safeXp - xpCurrentLevelStart;
  const progressPct = level >= 100 ? 100 : Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeeded) * 100)));

  let title = 'Novice Trainee';
  if (level >= 100) title = 'FitAI GODMODE';
  else if (level >= 75) title = 'FitAI Elite Apex';
  else if (level >= 50) title = 'Grandmaster Legend';
  else if (level >= 30) title = 'Diamond Master';
  else if (level >= 20) title = 'Platinum Titan';
  else if (level >= 15) title = 'Gold Contender';
  else if (level >= 10) title = 'Silver Lifter';
  else if (level >= 5) title = 'Bronze Athlete';

  return {
    xp: safeXp,
    level,
    levelTitle: title,
    xpCurrentLevelStart,
    xpNextLevelStart,
    xpInCurrentLevel,
    xpNeeded,
    progressPct,
    xpToNextLevel: Math.max(0, xpNextLevelStart - safeXp),
  };
}

export class UserService {
  async ensureUserExists(id: number = 1): Promise<any> {
    if (isPostgresConnected()) {
      const check = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (check.rows.length > 0) return check.rows[0];
      const res = await pool.query(
        `INSERT INTO users (id, name, email, auth_provider, avatar, tier, onboarding_completed)
         VALUES ($1, $2, $3, 'email', 'FA', 'FITAI PRO MEMBER', FALSE)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [id, `FitAI Member ${id}`, `user_${id}_${Date.now()}@fitai.pro`]
      );
      await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`).catch(() => {});
      return res.rows[0];
    }
    let u = memoryDb.users.find(m => m.id === id);
    if (!u) {
      u = { id, name: `FitAI Member ${id}`, email: `user_${id}@fitai.pro`, avatar: 'FA', tier: 'FITAI PRO MEMBER', onboarding_completed: false };
      memoryDb.users.push(u);
    }
    return u;
  }

  async getUser(id: number = 1): Promise<any> {
    await this.ensureUserExists(id);
    if (isPostgresConnected()) {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return memoryDb.users.find(u => u.id === id) || (memoryDb.users.length > 0 ? memoryDb.users[memoryDb.users.length - 1] : null);
  }

  async awardXp(id: number = 1, xpAmount: number = 5): Promise<any> {
    const user = await this.getUser(id);
    const currentXp = (user?.xp || 0) + xpAmount;
    const levelData = calculateLevelData(currentXp);

    if (isPostgresConnected()) {
      const res = await pool.query(
        `UPDATE users SET xp = $1, level = $2, level_title = $3 WHERE id = $4 RETURNING *`,
        [currentXp, levelData.level, levelData.levelTitle, id]
      );
      return { user: res.rows[0], xpEarned: xpAmount, levelData };
    }

    if (user) {
      user.xp = currentXp;
      user.level = levelData.level;
      user.level_title = levelData.levelTitle;
    }
    return { user, xpEarned: xpAmount, levelData };
  }

  async getUserByEmail(email: string): Promise<any> {
    if (isPostgresConnected()) {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rows[0] || null;
    }
    return memoryDb.users.find(u => u.email?.toLowerCase() === email?.toLowerCase()) || null;
  }

  async createUser(data: { name: string; email: string; provider?: string; avatar?: string; passwordHash?: string }): Promise<any> {
    const { name, email, provider = 'email', avatar = 'AT', passwordHash } = data;

    if (isPostgresConnected()) {
      const res = await pool.query(
        `
        INSERT INTO users (name, email, auth_provider, avatar, password_hash, tier, onboarding_completed)
        VALUES ($1, $2, $3, $4, $5, 'FITAI ATHLETE', FALSE)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, auth_provider = EXCLUDED.auth_provider, password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash)
        RETURNING *
      `,
        [name, email, provider, avatar, passwordHash || null]
      );
      return res.rows[0];
    }

    let user = memoryDb.users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    if (!user) {
      user = {
        id: memoryDb.users.length + 1,
        name,
        email,
        auth_provider: provider,
        password_hash: passwordHash,
        avatar,
        tier: 'FITAI ATHLETE',
        onboarding_completed: false,
        created_at: new Date(),
      };
      memoryDb.users.push(user);
    } else {
      user.auth_provider = provider;
      if (passwordHash) user.password_hash = passwordHash;
    }
    return user;
  }

  async saveUserOnboarding(userId: number = 1, onboardingData: any): Promise<any> {
    await this.ensureUserExists(userId);
    const { name, gender, age, heightCm, weightKg, goal, equipment, injuries, dietPref, timeCommitment } = onboardingData;

    if (isPostgresConnected()) {
      const res = await pool.query(
        `
        UPDATE users
        SET name = COALESCE($1, name),
            gender = $2,
            age = $3,
            height_cm = $4,
            weight_kg = $5,
            goal = $6,
            equipment = $7,
            injuries = $8,
            diet_pref = $9,
            time_commitment = $10,
            onboarding_completed = TRUE
        WHERE id = $11
        RETURNING *
      `,
        [
          name || null,
          gender || 'male',
          age ? parseInt(age, 10) : null,
          heightCm ? parseFloat(heightCm) : null,
          weightKg ? parseFloat(weightKg) : null,
          goal || 'Muscle Gain & Hypertrophy',
          equipment || 'Commercial Gym',
          injuries || ['None'],
          dietPref || 'High Protein Non-Veg',
          timeCommitment || '45 mins',
          userId,
        ]
      );
      return res.rows[0];
    }

    let user = memoryDb.users.find(u => u.id === userId) || memoryDb.users[memoryDb.users.length - 1];
    const computedName = (name && name.trim() && !name.toLowerCase().includes('athlete'))
      ? name.trim()
      : (user?.name && !user.name.toLowerCase().includes('athlete') ? user.name : 'FitAI Member');
    if (!user) {
      user = { id: 1, name: computedName, email: 'user@fitai.pro', avatar: computedName.slice(0, 2).toUpperCase() };
      memoryDb.users.push(user);
    }

    Object.assign(user, {
      name: computedName,
      avatar: computedName.slice(0, 2).toUpperCase(),
      gender: gender || user.gender || 'male',
      age: age ? parseInt(age, 10) : 25,
      height_cm: heightCm ? parseFloat(heightCm) : 175,
      weight_kg: weightKg ? parseFloat(weightKg) : 70,
      goal: goal || 'Muscle Gain & Hypertrophy',
      equipment: equipment || 'Commercial Gym',
      injuries: injuries || ['None'],
      diet_pref: dietPref || 'High Protein Non-Veg',
      time_commitment: timeCommitment || '45 mins',
      onboarding_completed: true,
    });

    return user;
  }

  async updateUser(id: number = 1, data: any = {}): Promise<any> {
    await this.ensureUserExists(id);
    if (isPostgresConnected()) {
      const { weight_kg, height_cm, body_fat_pct, goal } = data;
      const res = await pool.query(
        `
        UPDATE users
        SET weight_kg = COALESCE($1, weight_kg),
            height_cm = COALESCE($2, height_cm),
            body_fat_pct = COALESCE($3, body_fat_pct),
            goal = COALESCE($4, goal)
        WHERE id = $5
        RETURNING *
      `,
        [weight_kg, height_cm, body_fat_pct, goal, id]
      );
      return res.rows[0];
    }
    const user = memoryDb.users.find(u => u.id === id);
    if (user) Object.assign(user, data);
    return user;
  }

  async addXp(userId: number = 1, amount: number = 20): Promise<{ user: any; levelData: any; xpAdded: number }> {
    await this.ensureUserExists(userId);
    let user: any = null;
    if (isPostgresConnected()) {
      const res = await pool.query(
        `UPDATE users SET xp = COALESCE(xp, 0) + $1 WHERE id = $2 RETURNING *`,
        [amount, userId]
      );
      user = res.rows[0];
      const levelData = calculateLevelData(user.xp || 0);
      await pool.query(`UPDATE users SET level = $1 WHERE id = $2`, [levelData.level, userId]);
      user.level = levelData.level;
      return { user, levelData, xpAdded: amount };
    }
    user = memoryDb.users.find(u => u.id === userId);
    if (user) {
      user.xp = (user.xp || 0) + amount;
      const levelData = calculateLevelData(user.xp);
      user.level = levelData.level;
      return { user, levelData, xpAdded: amount };
    }
    return { user: null, levelData: calculateLevelData(0), xpAdded: 0 };
  }

  async getUserStatsAndAchievements(userId: number = 1, workoutHistory: any[] = [], streakDays: any[] = []) {
    const user = await this.getUser(userId);

    const totalWorkouts = workoutHistory.length;
    const completedWorkouts = workoutHistory.filter((w: any) => w.status === 'completed').length;

    let currentStreak = 0;
    const sortedStreakDays = [...streakDays].reverse();
    for (const d of sortedStreakDays) {
      if (d.status === 'completed') {
        currentStreak++;
      } else if (d.status === 'missed') {
        break;
      }
    }

    const xp = user?.xp || 0;
    const levelData = calculateLevelData(xp);

    const achievements = [
      {
        id: 'first_workout',
        emoji: '🎬',
        name: 'First Blood',
        description: 'Complete your first workout session',
        unlocked: completedWorkouts >= 1,
        current: Math.min(completedWorkouts, 1),
        target: 1,
        progressPct: Math.min(100, Math.round((completedWorkouts / 1) * 100)),
      },
      {
        id: 'streak_5',
        emoji: '🔥',
        name: '5-Day Momentum',
        description: 'Maintain a 5-day workout streak',
        unlocked: currentStreak >= 5,
        current: currentStreak,
        target: 5,
        progressPct: Math.min(100, Math.round((currentStreak / 5) * 100)),
      },
      {
        id: 'streak_10',
        emoji: '⚡',
        name: '10-Day Streak Master',
        description: 'Consistency record — 10 days active',
        unlocked: currentStreak >= 10,
        current: currentStreak,
        target: 10,
        progressPct: Math.min(100, Math.round((currentStreak / 10) * 100)),
      },
      {
        id: 'level_5',
        emoji: '🥉',
        name: 'Bronze Athlete',
        description: 'Reach Level 5 in FitAI Gamification',
        unlocked: levelData.level >= 5,
        current: levelData.level,
        target: 5,
        progressPct: Math.min(100, Math.round((levelData.level / 5) * 100)),
      },
      {
        id: 'workouts_25',
        emoji: '🏋️',
        name: '25 Workouts Milestone',
        description: 'Log 25 completed workout sessions',
        unlocked: completedWorkouts >= 25,
        current: completedWorkouts,
        target: 25,
        progressPct: Math.min(100, Math.round((completedWorkouts / 25) * 100)),
      },
      {
        id: 'workouts_100',
        emoji: '🏆',
        name: '100 Workouts Club',
        description: 'Complete 100 full workout sessions',
        unlocked: completedWorkouts >= 100,
        current: completedWorkouts,
        target: 100,
        progressPct: Math.min(100, Math.round((completedWorkouts / 100) * 100)),
      },
      {
        id: 'xp_1000',
        emoji: '⭐',
        name: '1,000 XP Veteran',
        description: 'Earn 1,000 total Experience Points',
        unlocked: xp >= 1000,
        current: xp,
        target: 1000,
        progressPct: Math.min(100, Math.round((xp / 1000) * 100)),
      },
    ];

    return {
      user: { ...user, ...levelData },
      stats: {
        totalWorkouts,
        completedWorkouts,
        currentStreak,
        xp: levelData.xp,
        level: levelData.level,
        levelTitle: levelData.levelTitle,
      },
      levelData,
      achievements,
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
      const dateStr = w.session_date ? (typeof w.session_date === 'string' ? w.session_date.split('T')[0] : getLocalDateString(new Date(w.session_date))) : getLocalDateString(new Date(w.created_at));
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
      const dateStr = r.log_date ? (typeof r.log_date === 'string' ? r.log_date.split('T')[0] : getLocalDateString(new Date(r.log_date))) : getLocalDateString(new Date(r.created_at));
      if (!summaryMap[dateStr]) summaryMap[dateStr] = { log_date: dateStr };
      summaryMap[dateStr].recovery = {
        id: r.id,
        readiness_percentage: r.readiness_percentage || 85,
        status_label: r.status_label || 'Optimal Bio-Recovery',
        description: r.description || '',
        sleep_hours: parseFloat(String(r.sleep_hours)) || 7.5,
        sleep_efficiency: r.sleep_efficiency || 90,
        hrv_ms: r.hrv_ms || 65,
        hydration_l: parseFloat(String(r.hydration_l)) || 2.5,
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
      const dateStr = m.log_date ? (typeof m.log_date === 'string' ? m.log_date.split('T')[0] : getLocalDateString(new Date(m.log_date))) : getLocalDateString(new Date(m.created_at));
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

    return summaryMap;
  }
}

export const userService = new UserService();

