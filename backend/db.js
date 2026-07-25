const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/fitaix',
  connectionTimeoutMillis: 3000,
});

let isPgConnected = false;

// In-Memory Database Fallback Store (active if local Postgres server is offline)
const memoryDb = {
  users: [
    {
      id: 1,
      name: "Alex Rivera",
      email: "alex.rivera@fitai.pro",
      avatar: "AR",
      tier: "FITAI PRO ATHLETE",
      goal: "Hypertrophy & Strength",
      weight_kg: 78.5,
      height_cm: 182,
      body_fat_pct: 14.2,
    }
  ],
  workouts: [
    {
      id: 1,
      user_id: 1,
      title: "AI Power Hypertrophy & Core Focus",
      duration_minutes: 45,
      estimated_calories: 420,
      target_muscles: ["Chest", "Triceps", "Abs"],
      why_recommendation: "Based on your 92% recovery score and 48-hour upper body rest, today is optimal for high-intensity chest & core hypertrophy.",
      created_at: new Date()
    }
  ],
  exercises: [
    { id: 1, workout_id: 1, name: "Incline Dumbbell Press", sets: 4, reps: "10-12", rest_sec: 60, icon: "dumbbell", tip: "Keep elbows at 45 degrees for maximum upper chest activation.", completed_sets: 2 },
    { id: 2, workout_id: 1, name: "Cable Chest Flyes", sets: 3, reps: "12-15", rest_sec: 45, icon: "activity", tip: "Squeeze tightly at full contraction for peak chest tension.", completed_sets: 1 },
    { id: 3, workout_id: 1, name: "Triceps Dip Machine", sets: 3, reps: "10-12", rest_sec: 60, icon: "zap", tip: "Control the eccentric motion for 3 seconds per rep.", completed_sets: 0 },
    { id: 4, workout_id: 1, name: "Hanging Leg Raises", sets: 4, reps: "15", rest_sec: 45, icon: "target", tip: "Avoid swinging; lift using lower abs.", completed_sets: 0 }
  ],
  recovery_logs: [
    {
      id: 1,
      user_id: 1,
      readiness_percentage: 92,
      status_label: "Optimal Recovery State",
      description: "HRV is 14ms above baseline and sleep efficiency hit 94%. Your neuromuscular system is primed for peak exertion.",
      hrv_ms: 68,
      sleep_hours: 8.2,
      sleep_efficiency: 94,
      muscle_soreness: "Low",
      hydration_l: 2.4,
      created_at: new Date()
    }
  ],
  chat_messages: [
    {
      id: 1,
      user_id: 1,
      sender: "ai",
      text: "👋 Hey Alex! I am your FitAI Pro Coach powered by Groq & PostgreSQL. Ask me anything about your workout, form tips, nutrition, or recovery!",
      created_at: new Date()
    }
  ]
};

// Initialize PostgreSQL tables & seed data
async function initDb() {
  try {
    const client = await pool.connect();
    isPgConnected = true;
    console.log("🐘 Connected to PostgreSQL Database Engine!");

    // Table Migrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        avatar VARCHAR(50),
        tier VARCHAR(100),
        goal VARCHAR(255),
        weight_kg NUMERIC(5,2),
        height_cm NUMERIC(5,2),
        body_fat_pct NUMERIC(4,2),
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

    // Seed default user if table is empty
    const userRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userRes.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO users (name, email, avatar, tier, goal, weight_kg, height_cm, body_fat_pct)
        VALUES ('Alex Rivera', 'alex.rivera@fitai.pro', 'AR', 'FITAI PRO ATHLETE', 'Hypertrophy & Strength', 78.5, 182, 14.2);
      `);
      console.log("🌱 Seeded initial PostgreSQL user profile");
    }

    client.release();
  } catch (err) {
    isPgConnected = false;
    console.warn(`⚠️ PostgreSQL connection not active (${err.message}). Using in-memory state fallback.`);
  }
}

// Database helper functions with transparent PostgreSQL / Memory fallback
const db = {
  async getUser(id = 1) {
    if (isPgConnected) {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || memoryDb.users[0];
    }
    return memoryDb.users.find(u => u.id === id) || memoryDb.users[0];
  },

  async updateUser(id = 1, data = {}) {
    if (isPgConnected) {
      const { weight_kg, height_cm, body_fat_pct, goal } = data;
      const res = await pool.query(`
        UPDATE users
        SET weight_kg = COALESCE($1, weight_kg),
            height_cm = COALESCE($2, height_cm),
            body_fat_pct = COALESCE($3, body_fat_pct),
            goal = COALESCE($4, goal)
        WHERE id = $5
        RETURNING *
      `, [weight_kg, height_cm, body_fat_pct, goal, id]);
      return res.rows[0];
    }
    const user = memoryDb.users.find(u => u.id === id);
    if (user) Object.assign(user, data);
    return user;
  },

  async saveWorkout(userId = 1, workoutData) {
    const { title, durationMinutes, estimatedCalories, targetMuscles, whyRecommendation, exercises } = workoutData;

    if (isPgConnected) {
      const wRes = await pool.query(`
        INSERT INTO workouts (user_id, title, duration_minutes, estimated_calories, target_muscles, why_recommendation)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, title, durationMinutes, estimatedCalories, targetMuscles, whyRecommendation]);

      const workout = wRes.rows[0];
      const savedExercises = [];

      for (const ex of exercises) {
        const eRes = await pool.query(`
          INSERT INTO exercises (workout_id, name, sets, reps, rest_sec, icon, tip, completed_sets)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [workout.id, ex.name, ex.sets, ex.reps, ex.restSec || ex.rest_sec, ex.icon, ex.tip, 0]);
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
      created_at: new Date()
    };
    memoryDb.workouts.unshift(workout);

    const savedExercises = exercises.map((ex, idx) => ({
      id: memoryDb.exercises.length + idx + 1,
      workout_id: newId,
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest_sec: ex.restSec || ex.rest_sec,
      icon: ex.icon,
      tip: ex.tip,
      completed_sets: 0
    }));

    memoryDb.exercises.push(...savedExercises);
    return { ...workout, exercises: savedExercises };
  },

  async getLatestWorkout(userId = 1) {
    if (isPgConnected) {
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

  async updateExerciseSets(exerciseId, completedSets) {
    if (isPgConnected) {
      const res = await pool.query(`
        UPDATE exercises
        SET completed_sets = $1
        WHERE id = $2
        RETURNING *
      `, [completedSets, exerciseId]);
      return res.rows[0];
    }
    const ex = memoryDb.exercises.find(e => e.id === Number(exerciseId));
    if (ex) ex.completed_sets = completedSets;
    return ex;
  },

  async saveRecoveryLog(userId = 1, logData) {
    const { readinessPercentage, statusLabel, description, hrv_ms, sleep_hours, sleep_efficiency, muscle_soreness, hydration_l } = logData;

    if (isPgConnected) {
      const res = await pool.query(`
        INSERT INTO recovery_logs (user_id, readiness_percentage, status_label, description, hrv_ms, sleep_hours, sleep_efficiency, muscle_soreness, hydration_l)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [userId, readinessPercentage, statusLabel, description, hrv_ms || 68, sleep_hours || 8.2, sleep_efficiency || 94, muscle_soreness || "Low", hydration_l || 2.4]);
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
      muscle_soreness: muscle_soreness || "Low",
      hydration_l: hydration_l || 2.4,
      created_at: new Date()
    };
    memoryDb.recovery_logs.unshift(log);
    return log;
  },

  async getLatestRecovery(userId = 1) {
    if (isPgConnected) {
      const res = await pool.query('SELECT * FROM recovery_logs WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
      return res.rows[0] || null;
    }
    return memoryDb.recovery_logs[0] || null;
  },

  async saveChatMessage(userId = 1, sender, text) {
    if (isPgConnected) {
      const res = await pool.query(`
        INSERT INTO chat_messages (user_id, sender, text)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, sender, text]);
      return res.rows[0];
    }
    const msg = {
      id: memoryDb.chat_messages.length + 1,
      user_id: userId,
      sender,
      text,
      created_at: new Date()
    };
    memoryDb.chat_messages.push(msg);
    return msg;
  },

  async getChatHistory(userId = 1) {
    if (isPgConnected) {
      const res = await pool.query('SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY id ASC', [userId]);
      return res.rows;
    }
    return memoryDb.chat_messages;
  }
};

module.exports = { initDb, db, isPgConnected: () => isPgConnected };
