import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({
  connectionString: config.dbUrl,
  connectionTimeoutMillis: 3000,
});

export let postgresActive = false;

export function isPostgresConnected(): boolean {
  return postgresActive;
}

// Dynamic Memory Store Fallback
export const memoryDb: {
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

// Lazy-loaded Domain Service Exports & Facade for Backward Compatibility
import { userService, calculateLevelData } from '../services/userService';
import { workoutService } from '../services/workoutService';
import { recoveryService } from '../services/recoveryService';
import { nutritionService } from '../services/nutritionService';
import { coachService } from '../services/coachService';
import { analyticsService } from '../services/analyticsService';

export { calculateLevelData };

export const db = {
  isPostgresConnected(): boolean {
    return postgresActive;
  },

  // User Domain Delegates
  ensureUserExists(id: number = 1) { return userService.ensureUserExists(id); },
  getUser(id: number = 1) { return userService.getUser(id); },
  awardXp(id: number = 1, xpAmount: number = 5) { return userService.awardXp(id, xpAmount); },
  getUserByEmail(email: string) { return userService.getUserByEmail(email); },
  createUser(data: any) { return userService.createUser(data); },
  saveUserOnboarding(userId: number = 1, onboardingData: any) { return userService.saveUserOnboarding(userId, onboardingData); },
  updateUser(id: number = 1, data: any = {}) { return userService.updateUser(id, data); },
  addXp(userId: number = 1, amount: number = 20) { return userService.addXp(userId, amount); },
  async getUserStatsAndAchievements(userId: number = 1) {
    const history = await workoutService.getWorkoutHistory(userId, 500);
    const streakDays = await workoutService.getWorkoutStreak(userId, 30);
    return userService.getUserStatsAndAchievements(userId, history, streakDays);
  },

  // Workout Domain Delegates
  saveWorkout(userId: number = 1, workoutData: any) { return workoutService.saveWorkout(userId, workoutData); },
  getLatestWorkout(userId: number = 1) { return workoutService.getLatestWorkout(userId); },
  getWorkoutHistory(userId: number = 1, limit: number = 20) { return workoutService.getWorkoutHistory(userId, limit); },
  updateExerciseSets(exerciseId: number | string, completedSets: number) { return workoutService.updateExerciseSets(exerciseId, completedSets); },
  toggleExerciseCompletion(exerciseId: number | string, isCompleted: boolean) { return workoutService.toggleExerciseCompletion(exerciseId, isCompleted); },
  getTodayWorkout(userId: number = 1) { return workoutService.getTodayWorkout(userId); },
  markMissedWorkoutsBeforeToday(userId: number = 1) { return workoutService.markMissedWorkoutsBeforeToday(userId); },
  markWorkoutComplete(workoutId: number, feedback: any) { return workoutService.markWorkoutComplete(workoutId, feedback); },
  markWorkoutMissed(workoutId: number) { return workoutService.markWorkoutMissed(workoutId); },
  getWorkoutStreak(userId: number = 1, days: number = 7) { return workoutService.getWorkoutStreak(userId, days); },

  // Recovery Domain Delegates
  saveRecoveryLog(userId: number = 1, logData: any) { return recoveryService.saveRecoveryLog(userId, logData); },
  getLatestRecovery(userId: number = 1) { return recoveryService.getLatestRecovery(userId); },
  getRecoveryHistory(userId: number = 1, limit: number = 30) { return recoveryService.getRecoveryHistory(userId, limit); },

  // Coach Domain Delegates
  saveChatMessage(userId: number = 1, sender: string, text: string) { return coachService.saveChatMessage(userId, sender, text); },
  getChatHistory(userId: number = 1) { return coachService.getChatHistory(userId); },

  // Analytics & Exercise Log Delegates
  saveExerciseLog(userId: number = 1, data: any) { return analyticsService.saveExerciseLog(userId, data); },
  getUserExerciseLogs(userId: number = 1, limit: number = 20) { return analyticsService.getUserExerciseLogs(userId, limit); },

  // Nutrition Domain Delegates
  getDietPlan(userId: number = 1) { return nutritionService.getDietPlan(userId); },
  saveDietPlan(userId: number = 1, planData: any) { return nutritionService.saveDietPlan(userId, planData); },
  logMeal(userId: number = 1, meal: any) { return nutritionService.logMeal(userId, meal); },
  getMealLogs(userId: number = 1, dateStr?: string) { return nutritionService.getMealLogs(userId, dateStr); },
};
