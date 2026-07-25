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
} = {
  users: [],
  workouts: [],
  exercises: [],
  recovery_logs: [],
  chat_messages: [],
};

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
        onboarding_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        duration_minutes INT NOT NULL,
        estimated_calories INT NOT NULL,
        target_muscles TEXT[] NOT NULL,
        why_recommendation TEXT,
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
        completed_sets INT DEFAULT 0
      );

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
         VALUES ($1, $2, $3, 'email', 'AT', 'FITAI ATHLETE', FALSE)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [id, `Athlete ${id}`, `user_${id}_${Date.now()}@fitai.test`]
      );
      await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`).catch(() => {});
      return res.rows[0];
    }
    let u = memoryDb.users.find(m => m.id === id);
    if (!u) {
      u = { id, name: `Athlete ${id}`, email: `user_${id}@fitai.test`, avatar: 'AT', tier: 'FITAI ATHLETE', onboarding_completed: false };
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
    const { name, age, heightCm, weightKg, goal, equipment, injuries, dietPref, timeCommitment } = onboardingData;

    if (postgresActive) {
      const res = await pool.query(
        `
        UPDATE users
        SET name = COALESCE($1, name),
            age = $2,
            height_cm = $3,
            weight_kg = $4,
            goal = $5,
            equipment = $6,
            injuries = $7,
            diet_pref = $8,
            time_commitment = $9,
            onboarding_completed = TRUE
        WHERE id = $10
        RETURNING *
      `,
        [
          name || null,
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
    if (!user) {
      user = { id: 1, name: name || 'Athlete', email: 'athlete@fitai.pro', avatar: (name || 'AT').slice(0, 2).toUpperCase() };
      memoryDb.users.push(user);
    }

    Object.assign(user, {
      name: name || user.name || 'Athlete',
      avatar: (name || user.name || 'AT').slice(0, 2).toUpperCase(),
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
    const { title, durationMinutes, estimatedCalories, targetMuscles, whyRecommendation, exercises } = workoutData;

    if (postgresActive) {
      const wRes = await pool.query(
        `
        INSERT INTO workouts (user_id, title, duration_minutes, estimated_calories, target_muscles, why_recommendation)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
        [userId, title, durationMinutes, estimatedCalories, targetMuscles, whyRecommendation]
      );

      const workout = wRes.rows[0];
      const savedExercises = [];

      for (const ex of exercises) {
        const eRes = await pool.query(
          `
          INSERT INTO exercises (workout_id, name, sets, reps, rest_sec, icon, tip, completed_sets)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
          [workout.id, ex.name, ex.sets, ex.reps, ex.restSec || ex.rest_sec || 60, ex.icon || 'dumbbell', ex.tip || '', 0]
        );
        savedExercises.push(eRes.rows[0]);
      }

      return { ...workout, exercises: savedExercises };
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
        `
        UPDATE exercises
        SET completed_sets = $1
        WHERE id = $2
        RETURNING *
      `,
        [completedSets, id]
      );
      return res.rows[0] || null;
    }
    const ex = memoryDb.exercises.find(e => e.id === id);
    if (ex) ex.completed_sets = completedSets;
    return ex || null;
  },

  async saveRecoveryLog(userId: number = 1, logData: any): Promise<any> {
    await this.ensureUserExists(userId);
    const { readinessPercentage, statusLabel, description, hrv_ms, sleep_hours, sleep_efficiency, muscle_soreness, hydration_l } = logData;

    if (postgresActive) {
      const res = await pool.query(
        `
        INSERT INTO recovery_logs (user_id, readiness_percentage, status_label, description, hrv_ms, sleep_hours, sleep_efficiency, muscle_soreness, hydration_l)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
        [userId, readinessPercentage, statusLabel, description, hrv_ms || 68, sleep_hours || 8.2, sleep_efficiency || 94, muscle_soreness || 'Low', hydration_l || 2.4]
      );
      return res.rows[0];
    }

    const log = {
      id: memoryDb.recovery_logs.length + 1,
      user_id: userId,
      readiness_percentage: readinessPercentage,
      status_label: statusLabel,
      description,
      hrv_ms: hrv_ms || 68,
      sleep_hours: sleep_hours || 8.2,
      sleep_efficiency: sleep_efficiency || 94,
      muscle_soreness: muscle_soreness || 'Low',
      hydration_l: hydration_l || 2.4,
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
    return memoryDb.recovery_logs[0] || null;
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
};
