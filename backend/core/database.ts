import { Pool } from 'pg';
import { config } from './config';

const pool = new Pool({
  connectionString: config.dbUrl,
  connectionTimeoutMillis: 3000,
});

let postgresActive = false;

// Dynamic Memory Store Fallback
const memoryDb: {
  users: any[];
  workouts: any[];
  exercises: any[];
  recovery_logs: any[];
  chat_messages: any[];
  exercise_logs: any[];
  diet_plans: any[];
  meal_logs: any[];
} = {
  users: [],
  workouts: [],
  exercises: [],
  recovery_logs: [],
  chat_messages: [],
  exercise_logs: [],
  diet_plans: [],
  meal_logs: [],
};

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

export async function initDb(): Promise<void> {
  try {
    const client = await pool.connect();
    postgresActive = true;
    console.log('🐘 Connected to PostgreSQL Database Engine on Port 5433!');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        auth_provider VARCHAR(50) DEFAULT 'email',
        avatar TEXT,
        tier VARCHAR(100) DEFAULT 'FITAI ATHLETE',
        goal VARCHAR(255),
        weight_kg NUMERIC(5,2),
        height_cm NUMERIC(5,2),
        body_fat_pct NUMERIC(4,2),
        age INT,
        equipment VARCHAR(255),
        injuries TEXT[],
        diet_pref VARCHAR(255),
        time_commitment VARCHAR(50),
        password_hash VARCHAR(255),
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'male';
      ALTER TABLE users ALTER COLUMN avatar TYPE TEXT;

      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        duration_minutes INT NOT NULL,
        estimated_calories INT NOT NULL,
        target_muscles TEXT[] NOT NULL,
        why_recommendation TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        completed_at TIMESTAMP,
        session_date DATE DEFAULT CURRENT_DATE,
        feedback_energy INT DEFAULT 0,
        feedback_soreness INT DEFAULT 0,
        feedback_mood INT DEFAULT 0,
        feedback_notes TEXT,
        ai_reasoning TEXT,
        readiness_score INT DEFAULT 70,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        sets INT NOT NULL,
        reps VARCHAR(50) NOT NULL,
        rest_sec INT NOT NULL,
        icon VARCHAR(50),
        tip TEXT,
        target_muscle VARCHAR(255),
        video_url TEXT,
        steps TEXT[],
        completed_sets INT DEFAULT 0,
        is_completed BOOLEAN DEFAULT FALSE
      );

      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS session_date DATE DEFAULT CURRENT_DATE;
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS feedback_energy INT DEFAULT 0;
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS feedback_soreness INT DEFAULT 0;
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS feedback_mood INT DEFAULT 0;
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS feedback_notes TEXT;
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
      ALTER TABLE workouts ADD COLUMN IF NOT EXISTS readiness_score INT DEFAULT 70;
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS steps TEXT[];
      ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_muscle VARCHAR(255);

      CREATE TABLE IF NOT EXISTS recovery_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        readiness_percentage INT NOT NULL,
        status_label VARCHAR(255),
        description TEXT,
        hrv_ms INT,
        sleep_hours NUMERIC(4,2),
        sleep_efficiency INT,
        muscle_soreness VARCHAR(50),
        hydration_l NUMERIC(4,2),
        log_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE recovery_logs ADD COLUMN IF NOT EXISTS log_date DATE DEFAULT CURRENT_DATE;

      CREATE TABLE IF NOT EXISTS diet_plans (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        plan_data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS meal_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        meal_type VARCHAR(50) NOT NULL,
        food_item VARCHAR(255) NOT NULL,
        protein_g NUMERIC(6,2) DEFAULT 0,
        carbs_g NUMERIC(6,2) DEFAULT 0,
        fats_g NUMERIC(6,2) DEFAULT 0,
        calories NUMERIC(6,2) DEFAULT 0,
        log_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exercise_logs (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        exercise_name VARCHAR(255) NOT NULL,
        weight_kg NUMERIC(6,2) DEFAULT 0,
        bar_weight_kg NUMERIC(6,2) DEFAULT 0,
        plate_weight_kg NUMERIC(6,2) DEFAULT 0,
        reps_achieved INT DEFAULT 0,
        is_bodyweight BOOLEAN DEFAULT FALSE,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        sender VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
  } catch (err: any) {
    postgresActive = false;
    console.warn(`⚠️ PostgreSQL connection warning (${err.message}). Using memory store fallback.`);
  }
}

export const db = {
  isPostgresConnected(): boolean {
    return postgresActive;
  },

  async ensureUserExists(id: number = 1): Promise<any> {
    if (postgresActive) {
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
  },

  async getUser(id: number = 1): Promise<any> {
    await this.ensureUserExists(id);
    if (postgresActive) {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return memoryDb.users.find(u => u.id === id) || (memoryDb.users.length > 0 ? memoryDb.users[memoryDb.users.length - 1] : null);
  },

  async awardXp(id: number = 1, xpAmount: number = 5): Promise<any> {
    const user = await this.getUser(id);
    const currentXp = (user?.xp || 0) + xpAmount;
    const levelData = calculateLevelData(currentXp);

    if (postgresActive) {
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
  },

  async getUserByEmail(email: string): Promise<any> {
    if (postgresActive) {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rows[0] || null;
    }
    return memoryDb.users.find(u => u.email?.toLowerCase() === email?.toLowerCase()) || null;
  },

  async createUser(data: { name: string; email: string; provider?: string; avatar?: string; passwordHash?: string }): Promise<any> {
    const { name, email, provider = 'email', avatar = 'AT', passwordHash } = data;

    if (postgresActive) {
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
  },

  async saveUserOnboarding(userId: number = 1, onboardingData: any): Promise<any> {
    await this.ensureUserExists(userId);
    const { name, gender, age, heightCm, weightKg, goal, equipment, injuries, dietPref, timeCommitment } = onboardingData;

    if (postgresActive) {
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
  },

  async updateUser(id: number = 1, data: any = {}): Promise<any> {
    await this.ensureUserExists(id);
    if (postgresActive) {
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
  },

  async saveWorkout(userId: number = 1, workoutData: any): Promise<any> {
    await this.ensureUserExists(userId);
    const {
      title, durationMinutes, estimatedCalories, targetMuscles,
      whyRecommendation, aiReasoning, readinessScore, adaptations, analysisSteps, exercises,
    } = workoutData;

    const today = new Date().toISOString().split('T')[0];

    if (postgresActive) {
      const wRes = await pool.query(
        `
        INSERT INTO workouts (user_id, title, duration_minutes, estimated_calories, target_muscles, why_recommendation, ai_reasoning, readiness_score, session_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
        [userId, title, durationMinutes, estimatedCalories, targetMuscles, whyRecommendation, aiReasoning || '', readinessScore || 75, today]
      );

      const workout = wRes.rows[0];
      const savedExercises = [];

      for (const ex of exercises) {
        const eRes = await pool.query(
          `
          INSERT INTO exercises (workout_id, name, sets, reps, rest_sec, icon, tip, target_muscle, video_url, steps, completed_sets)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `,
          [
            workout.id,
            ex.name,
            ex.sets,
            ex.reps,
            ex.restSec || ex.rest_sec || 60,
            ex.icon || 'dumbbell',
            ex.tip || '',
            ex.targetMuscle || ex.target_muscle || '',
            ex.videoUrl || ex.video_url || '',
            ex.steps || [],
            0
          ]
        );
        savedExercises.push(eRes.rows[0]);
      }

      return {
        ...workout,
        adaptations: adaptations || [],
        analysis_steps: analysisSteps || [],
        exercises: savedExercises,
      };
    }

    const newId = memoryDb.workouts.length + 1;
    const workout = {
      id: newId,
      user_id: userId,
      title,
      duration_minutes: durationMinutes,
      estimated_calories: estimatedCalories,
      target_muscles: targetMuscles,
      why_recommendation: whyRecommendation,
      ai_reasoning: aiReasoning || '',
      readiness_score: readinessScore || 75,
      adaptations: adaptations || [],
      analysis_steps: analysisSteps || [],
      session_date: today,
      status: 'pending',
      created_at: new Date(),
    };
    memoryDb.workouts.unshift(workout);

    const savedExercises = (exercises || []).map((ex: any, idx: number) => ({
      id: memoryDb.exercises.length + idx + 1,
      workout_id: newId,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest_sec: ex.restSec || ex.rest_sec || 60,
      icon: ex.icon || 'dumbbell',
      tip: ex.tip || '',
      target_muscle: ex.targetMuscle || ex.target_muscle || '',
      video_url: ex.videoUrl || ex.video_url || '',
      steps: ex.steps || [],
      bodymap_male: ex.bodymapMaleUrl || ex.bodymap_male || '',
      bodymap_female: ex.bodymapFemaleUrl || ex.bodymap_female || '',
      bodymap_url: ex.bodymap_url || ex.bodymapUrl || ex.bodymapMaleUrl || ex.bodymap_male || '',
      completed_sets: 0,
    }));

    memoryDb.exercises.push(...savedExercises);
    return { ...workout, exercises: savedExercises };
  },

  async getLatestWorkout(userId: number = 1): Promise<any> {
    if (postgresActive) {
      const wRes = await pool.query('SELECT * FROM workouts WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
      if (wRes.rows.length === 0) return null;
      const workout = wRes.rows[0];
      const eRes = await pool.query('SELECT * FROM exercises WHERE workout_id = $1 ORDER BY id ASC', [workout.id]);
      return { ...workout, exercises: eRes.rows };
    }
    const workout = memoryDb.workouts[0];
    if (!workout) return null;
    const exercises = memoryDb.exercises.filter(e => e.workout_id === workout.id);
    return { ...workout, exercises };
  },

  async getWorkoutHistory(userId: number = 1, limit: number = 20): Promise<any[]> {
    if (postgresActive) {
      const wRes = await pool.query(
        'SELECT w.*, array_agg(row_to_json(e)) FILTER (WHERE e.id IS NOT NULL) as exercises FROM workouts w LEFT JOIN exercises e ON e.workout_id = w.id WHERE w.user_id = $1 GROUP BY w.id ORDER BY w.id DESC LIMIT $2',
        [userId, limit]
      );
      return wRes.rows;
    }
    return memoryDb.workouts
      .filter(w => w.user_id === userId)
      .slice(0, limit)
      .map(w => ({ ...w, exercises: memoryDb.exercises.filter(e => e.workout_id === w.id) }));
  },

  async updateExerciseSets(exerciseId: number | string, completedSets: number): Promise<any> {
    const id = typeof exerciseId === 'number' ? exerciseId : (parseInt(String(exerciseId), 10) || 1);
    if (postgresActive) {
      const res = await pool.query(
        `UPDATE exercises SET completed_sets = $1 WHERE id = $2 RETURNING *`,
        [completedSets, id]
      );
      return res.rows[0] || null;
    }
    const ex = memoryDb.exercises.find(e => e.id === id);
    if (ex) ex.completed_sets = completedSets;
    return ex || null;
  },

  async toggleExerciseCompletion(exerciseId: number | string, isCompleted: boolean): Promise<any> {
    const id = typeof exerciseId === 'number' ? exerciseId : (parseInt(String(exerciseId), 10) || 1);
    if (postgresActive) {
      const res = await pool.query(
        `UPDATE exercises SET is_completed = $1, completed_sets = CASE WHEN $1 THEN sets ELSE 0 END WHERE id = $2 RETURNING *`,
        [isCompleted, id]
      );
      return res.rows[0] || null;
    }
    const ex = memoryDb.exercises.find(e => e.id === id);
    if (ex) { ex.is_completed = isCompleted; ex.completed_sets = isCompleted ? ex.sets : 0; }
    return ex || null;
  },

  async getTodayWorkout(userId: number = 1): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    if (postgresActive) {
      const wRes = await pool.query(
        `SELECT * FROM workouts WHERE user_id = $1 AND session_date = $2 ORDER BY id DESC LIMIT 1`,
        [userId, today]
      );
      if (wRes.rows.length === 0) return null;
      const workout = wRes.rows[0];
      const eRes = await pool.query('SELECT * FROM exercises WHERE workout_id = $1 ORDER BY id ASC', [workout.id]);
      return { ...workout, exercises: eRes.rows };
    }
    const workout = memoryDb.workouts.find(w => w.user_id === userId && w.session_date === today);
    if (!workout) return null;
    const exercises = memoryDb.exercises.filter(e => e.workout_id === workout.id);
    return { ...workout, exercises };
  },

  async markMissedWorkoutsBeforeToday(userId: number = 1): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    if (postgresActive) {
      await pool.query(
        `UPDATE workouts SET status = 'missed' WHERE user_id = $1 AND session_date < $2 AND status = 'pending'`,
        [userId, today]
      );
    } else {
      memoryDb.workouts.forEach(w => {
        if (w.user_id === userId && w.session_date < today && w.status === 'pending') w.status = 'missed';
      });
    }
  },

  async markWorkoutComplete(workoutId: number, feedback: { energy: number; soreness: number; mood: number; notes?: string }): Promise<any> {
    let completedWorkout: any = null;
    if (postgresActive) {
      const res = await pool.query(
        `UPDATE workouts
         SET status = 'completed', completed_at = NOW(),
             feedback_energy = $2, feedback_soreness = $3, feedback_mood = $4, feedback_notes = $5
         WHERE id = $1 RETURNING *`,
        [workoutId, feedback.energy, feedback.soreness, feedback.mood, feedback.notes || '']
      );
      completedWorkout = res.rows[0] || null;
    } else {
      const w = memoryDb.workouts.find(w => w.id === workoutId);
      if (w) { Object.assign(w, { status: 'completed', completed_at: new Date(), ...feedback }); }
      completedWorkout = w || null;
    }
    if (completedWorkout?.user_id) {
      await this.addXp(completedWorkout.user_id, 20);
    }
    return completedWorkout;
  },

  async markWorkoutMissed(workoutId: number): Promise<any> {
    if (postgresActive) {
      const res = await pool.query(
        `UPDATE workouts SET status = 'missed' WHERE id = $1 RETURNING *`,
        [workoutId]
      );
      return res.rows[0] || null;
    }
    const w = memoryDb.workouts.find(w => w.id === workoutId);
    if (w) w.status = 'missed';
    return w || null;
  },

  async getWorkoutStreak(userId: number = 1, days: number = 7): Promise<any[]> {
    const result: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({ date: dateStr, status: 'none' });
    }
    if (postgresActive) {
      const startDate = result[0].date;
      const rows = await pool.query(
        `SELECT session_date::text as date, status FROM workouts WHERE user_id = $1 AND session_date >= $2 ORDER BY session_date ASC`,
        [userId, startDate]
      );
      rows.rows.forEach((row: any) => {
        const slot = result.find(r => r.date === row.date);
        if (slot) slot.status = row.status || 'pending';
      });
    } else {
      memoryDb.workouts.filter(w => w.user_id === userId).forEach(w => {
        const slot = result.find(r => r.date === w.session_date);
        if (slot) slot.status = w.status || 'pending';
      });
    }
    return result;
  },

  async saveRecoveryLog(userId: number = 1, logData: any): Promise<any> {
    await this.ensureUserExists(userId);
    const readinessPercentage = logData.readinessPercentage || 85;
    const statusLabel = logData.statusLabel || 'Optimal Bio-Recovery';
    const description = logData.description || '';
    const hrv_ms = logData.hrv_ms || 65;
    const sleep_hours = logData.sleep_hours || 7.5;
    const sleep_efficiency = logData.sleep_efficiency || 90;
    const muscle_soreness = logData.muscle_soreness || 'Low';
    const hydration_l = logData.hydration_l || 2.5;
    const todayStr = new Date().toISOString().split('T')[0];

    if (postgresActive) {
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
  },

  async getLatestRecovery(userId: number = 1): Promise<any> {
    if (postgresActive) {
      const res = await pool.query('SELECT * FROM recovery_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
      return res.rows[0] || null;
    }
    const userLogs = memoryDb.recovery_logs.filter(r => r.user_id === userId);
    return userLogs.length > 0 ? userLogs[0] : null;
  },

  async getRecoveryHistory(userId: number = 1, limit: number = 30): Promise<any[]> {
    if (postgresActive) {
      const res = await pool.query('SELECT * FROM recovery_logs WHERE user_id = $1 ORDER BY id DESC LIMIT $2', [userId, limit]);
      return res.rows;
    }
    return (memoryDb.recovery_logs || []).filter(r => r.user_id === userId).slice(0, limit);
  },

  async saveChatMessage(userId: number = 1, sender: string, text: string): Promise<any> {
    if (postgresActive) {
      const res = await pool.query(
        `
        INSERT INTO chat_messages (user_id, sender, text)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
        [userId, sender, text]
      );
      return res.rows[0];
    }
    const msg = {
      id: memoryDb.chat_messages.length + 1,
      user_id: userId,
      sender,
      text,
      created_at: new Date(),
    };
    memoryDb.chat_messages.push(msg);
    return msg;
  },

  async getChatHistory(userId: number = 1): Promise<any[]> {
    if (postgresActive) {
      const res = await pool.query('SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY id ASC', [userId]);
      return res.rows;
    }
    return memoryDb.chat_messages;
  },

  async addXp(userId: number = 1, amount: number = 20): Promise<{ user: any; levelData: any; xpAdded: number }> {
    await this.ensureUserExists(userId);
    let user: any = null;
    if (postgresActive) {
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
  },

  async getUserStatsAndAchievements(userId: number = 1) {
    const user = await this.getUser(userId);
    const history = await this.getWorkoutHistory(userId, 500);
    const streakDays = await this.getWorkoutStreak(userId, 30);

    const totalWorkouts = history.length;
    const completedWorkouts = history.filter((w: any) => w.status === 'completed').length;

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
  },

  async saveExerciseLog(userId: number = 1, data: { exerciseName: string; weightKg?: number; barWeightKg?: number; plateWeightKg?: number; repsAchieved: number; isBodyweight?: boolean }): Promise<any> {
    const bar = data.barWeightKg || 0;
    const plate = data.plateWeightKg || 0;
    const totalWeight = data.weightKg || (bar + plate);
    const isBw = !!data.isBodyweight;

    if (postgresActive) {
      const res = await pool.query(
        `INSERT INTO exercise_logs (user_id, exercise_name, weight_kg, bar_weight_kg, plate_weight_kg, reps_achieved, is_bodyweight)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, data.exerciseName, totalWeight, bar, plate, data.repsAchieved, isBw]
      );
      return res.rows[0];
    }
    const log = {
      id: (memoryDb as any).exercise_logs ? (memoryDb as any).exercise_logs.length + 1 : 1,
      user_id: userId,
      exercise_name: data.exerciseName,
      weight_kg: totalWeight,
      bar_weight_kg: bar,
      plate_weight_kg: plate,
      reps_achieved: data.repsAchieved,
      is_bodyweight: isBw,
      logged_at: new Date(),
    };
    if (!(memoryDb as any).exercise_logs) (memoryDb as any).exercise_logs = [];
    (memoryDb as any).exercise_logs.unshift(log);
    return log;
  },

  async getDietPlan(userId: number = 1): Promise<any> {
    if (postgresActive) {
      const res = await pool.query(`SELECT * FROM diet_plans WHERE user_id = $1 ORDER BY id DESC LIMIT 1`, [userId]);
      return res.rows[0]?.plan_data || null;
    }
    const record = memoryDb.diet_plans.find(d => d.user_id === userId);
    return record?.plan_data || null;
  },

  async saveDietPlan(userId: number = 1, planData: any): Promise<any> {
    if (postgresActive) {
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
  },

  async logMeal(userId: number = 1, meal: { mealType: string; foodItem: string; proteinG: number; carbsG: number; fatsG: number; calories: number }): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    if (postgresActive) {
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
  },

  async getMealLogs(userId: number = 1, dateStr?: string): Promise<any[]> {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    if (postgresActive) {
      const res = await pool.query(`SELECT * FROM meal_logs WHERE user_id = $1 AND log_date = $2 ORDER BY id DESC`, [userId, targetDate]);
      return res.rows;
    }
    return memoryDb.meal_logs.filter(m => m.user_id === userId && m.log_date === targetDate);
  },

  async getUserExerciseLogs(userId: number = 1, limit: number = 20): Promise<any[]> {
    if (postgresActive) {
      try {
        const res = await pool.query(
          `SELECT DISTINCT ON (exercise_name) * FROM exercise_logs WHERE user_id = $1 ORDER BY exercise_name, logged_at DESC LIMIT $2`,
          [userId, limit]
        );
        return res.rows;
      } catch {
        return [];
      }
    }
    const logs = (memoryDb as any).exercise_logs || [];
    const map = new Map<string, any>();
    for (const log of logs) {
      if (log.user_id === userId && !map.has(log.exercise_name.toLowerCase())) {
        map.set(log.exercise_name.toLowerCase(), log);
      }
    }
    return Array.from(map.values()).slice(0, limit);
  },
};

