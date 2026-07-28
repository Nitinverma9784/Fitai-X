import { Pool } from 'pg';
import { envConfig } from '../../config/env';

export const pool = new Pool({
  connectionString: envConfig.dbUrl,
  connectionTimeoutMillis: 3000,
});

let postgresActive = false;

export function isPostgresConnected(): boolean {
  return postgresActive;
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
      ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS body_fat_pct NUMERIC(4,2);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS equipment VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS time_commitment VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_pref VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_preference VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_calories_target INT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS protein_target_g INT;
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
        rpe INT DEFAULT 8,
        log_date DATE DEFAULT CURRENT_DATE,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS rpe INT DEFAULT 8;
      ALTER TABLE exercise_logs ADD COLUMN IF NOT EXISTS log_date DATE DEFAULT CURRENT_DATE;

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
