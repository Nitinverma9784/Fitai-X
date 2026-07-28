# FitAI Pro Backend Architecture & API Documentation

Welcome to the backend service of **FitAI Pro**—an enterprise-grade strength, conditioning, and nutrition AI coaching application built with Node.js, TypeScript, Express, PostgreSQL, and Groq LLM client-rotation.

---

## Project Overview

### Backend Architecture

The backend follows a **Feature-Based Modular Architecture**. Instead of separating code strictly by technical concerns (e.g., all routes in one folder, all controllers in another), code is grouped by feature modules under `src/modules/`. This makes the application highly maintainable, cohesive, and easy to scale.

Each module exposes its router, controllers, services, and repositories. Shared infrastructure and global cross-cutting concerns (e.g., config, database pool, security operations, error/auth middlewares) are isolated in `src/config/`, `src/core/`, and `src/shared/`.

### Directory Layout

```
backend/
├── dist/                          # Compiled production Javascript output
├── src/
│   ├── config/                    # Configuration files
│   │   ├── env.ts                 # Port, model, database URL
│   │   ├── groq.ts                # Groq API key rotation
│   │   ├── exerciseDb.ts          # RapidAPI ExerciseDB key rotation
│   │   ├── jwt.ts                 # JWT signature secret
│   │   ├── google.ts              # Google Client OAuth config
│   │   └── cors.ts                # CORS configuration
│   ├── core/                      # Global infrastructure and core utilities
│   │   ├── database/
│   │   │   └── connection.ts      # Pool connection & table migrations
│   │   ├── security/
│   │   │   └── crypto.ts          # Password hashing, JWT signing/verifying
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # JWT/x-user-id token validation
│   │   │   ├── error.middleware.ts # Global express error handler
│   │   │   └── notFound.middleware.ts # 404 handler
│   │   ├── exceptions/
│   │   │   └── exceptions.ts      # FitAiError, NotFoundError, UnauthorizedError
│   │   └── events/
│   │       └── systemEvents.ts    # Centralized event emitter
│   ├── shared/                    # Shared interfaces, models, database stores
│   │   ├── types/
│   │   │   └── index.ts           # Shared typings
│   │   ├── utils/
│   │   │   └── date.ts            # Date formatting utility
│   │   └── database/
│   │       └── memoryDb.ts        # In-Memory database store fallback
│   ├── modules/                   # Feature-based modules
│   │   ├── auth/                  # Handles user registration & authentication
│   │   ├── user/                  # User profile, stats, calendar, XP
│   │   ├── workout/               # Workouts generation, logs, version control, media proxy
│   │   ├── recovery/              # HRV, sleep metrics, and recovery score calculations
│   │   ├── coach/                 # AI coaching chatbot sessions
│   │   └── nutrition/             # Meal plans, grocery list generator, macro estimator
│   └── server.ts                  # Application entry point
```

### Module breakdown
- **Auth**: Sign up and login with email/password (with salt/pbkdf2 hashing) or via Google Sign-In authentication.
- **User**: Manage client profile settings, log onboarding preferences, view calendar logs, and increment gamified XP/Level thresholds.
- **Workout**: Dynamic daily workout plans constructed via Groq client key rotation. It fetches video demos, logs exercise sets, targets hypertrophy, tracks streak counts, and handles workout version commits and rollbacks.
- **Recovery**: Logs wearable metrics (HRV, sleep hours/efficiency, soreness) and estimates neuromuscular readiness.
- **Coach**: Real-time AI chat interaction utilizing dynamic system prompts and key-rotation fallbacks.
- **Nutrition**: High-protein Indian & Global diet scheduling, grocery optimization, and instant AI calorie estimation.

---

## Authentication Mechanisms

FitAI Pro uses double-layer authentication:
1. **JWT Session Token**: Requests provide `Authorization: Bearer <token>`. The backend validates the signature, checkexpiration, and extracts `userId` and `email`.
2. **Developer Override Header**: For local testing and staging integrations, providing the header `x-user-id: <number>` bypasses token validation and assigns the user context directly.

---

## Environment Variables

Configure these variables inside a `.env` file in the backend root directory:

```env
PORT=5000
DATABASE_URL=postgres://postgres:nitinverma@127.0.0.1:5433/fitaix
DEFAULT_MODEL=llama-3.3-70b-versatile
JWT_SECRET=fitai_secret_key_pro_2026

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:8081

# Groq API Rotation Pool (1-4 Keys)
GROQ_API_KEY_1=gsk_your_key_1
GROQ_API_KEY_2=gsk_your_key_2

# ExerciseDB API Rotation Pool (1-5 Keys)
RAPIDAPI_EXERCISEDB_KEY_1=your_rapidapi_key
```

---

## Running Locally, Building & Deployment

### Run Locally
1. Run `npm install` to download dependencies.
2. Setup a PostgreSQL instance and populate `DATABASE_URL` in `.env`.
3. Start the hot-reloading development server:
   ```bash
   npm run dev
   ```

### Production Build
1. Compile the TypeScript files:
   ```bash
   npm run build
   ```
2. The transpiled files will be created in `dist/`.

### Deployment & Production Run
To start the compiled production server:
```bash
npm start
```
Ensure that `dist/server.js` is executed on your hosting server (Node.js runtime environment).

---

## Data Models (Entities)

### 1. User
- **Purpose**: Represents an athlete's profile, credentials, level, and preferences.
- **Relationships**: Parent of `workouts`, `recovery_logs`, `meal_logs`, `exercise_logs`, and `chat_messages`.
- **Fields**:
  - `id` (INT, Required, PK)
  - `name` (VARCHAR, Required)
  - `email` (VARCHAR, Required, Unique)
  - `auth_provider` (VARCHAR, Default: `'email'`)
  - `avatar` (TEXT, Optional)
  - `tier` (VARCHAR, Default: `'FITAI ATHLETE'`)
  - `goal` (VARCHAR, Optional)
  - `weight_kg` (NUMERIC, Optional)
  - `height_cm` (NUMERIC, Optional)
  - `body_fat_pct` (NUMERIC, Optional)
  - `age` (INT, Optional)
  - `equipment` (VARCHAR, Optional)
  - `injuries` (TEXT[], Optional)
  - `diet_pref` (VARCHAR, Optional)
  - `time_commitment` (VARCHAR, Optional)
  - `password_hash` (VARCHAR, Optional)
  - `onboarding_completed` (BOOLEAN, Default: `false`)
  - `xp` (INT, Default: `0`)
  - `level` (INT, Default: `1`)
  - `gender` (VARCHAR, Default: `'male'`)

### 2. Workout
- **Purpose**: Represents a targeted training session.
- **Relationships**: Belongs to a `user`, contains one-to-many `exercises`.
- **Fields**:
  - `id` (INT, Required, PK)
  - `user_id` (INT, Required, FK)
  - `title` (VARCHAR, Required)
  - `duration_minutes` (INT, Required)
  - `estimated_calories` (INT, Required)
  - `target_muscles` (TEXT[], Required)
  - `why_recommendation` (TEXT, Optional)
  - `status` (VARCHAR, Default: `'pending'`)
  - `completed_at` (TIMESTAMP, Optional)
  - `session_date` (DATE, Default: Current Date)
  - `feedback_energy` (INT, Default: `0`)
  - `feedback_soreness` (INT, Default: `0`)
  - `feedback_mood` (INT, Default: `0`)
  - `feedback_notes` (TEXT, Optional)
  - `ai_reasoning` (TEXT, Optional)
  - `readiness_score` (INT, Default: `70`)

### 3. Exercise
- **Purpose**: Represents a specific movement within a workout.
- **Relationships**: Belongs to a `workout`.
- **Fields**:
  - `id` (INT, Required, PK)
  - `workout_id` (INT, Required, FK)
  - `name` (VARCHAR, Required)
  - `sets` (INT, Required)
  - `reps` (VARCHAR, Required)
  - `rest_sec` (INT, Required)
  - `icon` (VARCHAR, Optional)
  - `tip` (TEXT, Optional)
  - `target_muscle` (VARCHAR, Optional)
  - `video_url` (TEXT, Optional)
  - `steps` (TEXT[], Optional)
  - `completed_sets` (INT, Default: `0`)
  - `is_completed` (BOOLEAN, Default: `false`)

### 4. RecoveryLog
- **Purpose**: Tracks biometric readiness.
- **Relationships**: Belongs to a `user`.
- **Fields**:
  - `id` (INT, Required, PK)
  - `user_id` (INT, Required, FK)
  - `readiness_percentage` (INT, Required)
  - `status_label` (VARCHAR, Optional)
  - `description` (TEXT, Optional)
  - `hrv_ms` (INT, Optional)
  - `sleep_hours` (NUMERIC, Optional)
  - `sleep_efficiency` (INT, Optional)
  - `muscle_soreness` (VARCHAR, Optional)
  - `hydration_l` (NUMERIC, Optional)
  - `log_date` (DATE, Default: Current Date)

### 5. ChatMessage
- **Purpose**: Conversation log with the AI coach.
- **Relationships**: Belongs to a `user`.
- **Fields**:
  - `id` (INT, Required, PK)
  - `user_id` (INT, Required, FK)
  - `sender` (VARCHAR, Required, `'user' | 'ai'`)
  - `text` (TEXT, Required)

### 6. DietPlan
- **Purpose**: Stores the active weekly meal schedule.
- **Relationships**: One-to-one with a `user`.
- **Fields**:
  - `id` (INT, Required, PK)
  - `user_id` (INT, Required, Unique, FK)
  - `plan_data` (JSONB, Required)

### 7. MealLog
- **Purpose**: Tracks consumed food items and nutritional macros.
- **Relationships**: Belongs to a `user`.
- **Fields**:
  - `id` (INT, Required, PK)
  - `user_id` (INT, Required, FK)
  - `meal_type` (VARCHAR, Required)
  - `food_item` (VARCHAR, Required)
  - `protein_g` (NUMERIC, Default: `0`)
  - `carbs_g` (NUMERIC, Default: `0`)
  - `fats_g` (NUMERIC, Default: `0`)
  - `calories` (NUMERIC, Default: `0`)
  - `log_date` (DATE, Default: Current Date)

### 8. ExerciseLog
- **Purpose**: Historical log of working weight and volume for Progressive Overload.
- **Relationships**: Belongs to a `user`.
- **Fields**:
  - `id` (INT, Required, PK)
  - `user_id` (INT, Required, FK)
  - `exercise_name` (VARCHAR, Required)
  - `weight_kg` (NUMERIC, Default: `0`)
  - `bar_weight_kg` (NUMERIC, Default: `0`)
  - `plate_weight_kg` (NUMERIC, Default: `0`)
  - `reps_achieved` (INT, Default: `0`)
  - `is_bodyweight` (BOOLEAN, Default: `false`)
  - `rpe` (INT, Default: `8`)
  - `log_date` (DATE, Default: Current Date)

---

## API Endpoints Documentation

### System Status & Health Check
- **Method**: `GET`
- **Route**: `/api/status`
- **Purpose**: Returns the status of the server and database.
- **Auth Required**: No
- **Success Response (200 OK)**:
  ```json
  {
    "status": "online",
    "postgresConnected": true,
    "model": "llama-3.3-70b-versatile",
    "activeKeysCount": 2,
    "keyRotationActive": true,
    "timestamp": "2026-07-28T08:39:13.000Z"
  }
  ```

---

### Auth Module

#### 1. SignUp
- **Method**: `POST`
- **Route**: `/api/auth/signup`
- **Purpose**: Create a new account with email & password.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Alex",
    "email": "alex@fitai.pro",
    "password": "securepassword123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": 1, "name": "Alex", "email": "alex@fitai.pro", "onboarding_completed": false },
    "isOnboarded": false
  }
  ```
- **Error Response (400 Bad Request)**:
  ```json
  { "success": false, "error": "An account with this email already exists. Please log in." }
  ```

#### 2. Login
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Purpose**: Login using email & password.
- **Auth Required**: No
- **Request Body**:
  ```json
  { "email": "alex@fitai.pro", "password": "securepassword123" }
  ```
- **Success Response (200 OK)**: Same as SignUp.
- **Error Response (401 Unauthorized)**:
  ```json
  { "success": false, "error": "Invalid email or password." }
  ```

#### 3. Google URL Generator
- **Method**: `GET`
- **Route**: `/api/auth/google/url`
- **Purpose**: Generate Google OAuth login redirect link.
- **Auth Required**: No
- **Success Response (200 OK)**:
  ```json
  { "url": "https://accounts.google.com/o/oauth2/v2/auth...", "redirectUri": "http://localhost:5000/api/auth/google/callback" }
  ```

#### 4. Google Token Verify
- **Method**: `POST`
- **Route**: `/api/auth/google/verify`
- **Purpose**: Verify mobile Google ID token and return user session.
- **Auth Required**: No
- **Request Body**:
  ```json
  { "googleIdToken": "some-oauth-id-token" }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhb...",
    "user": { "id": 2, "name": "Google Athlete", "email": "google.athlete@fitai.pro" },
    "provider": "google"
  }
  ```

---

### User Module

#### 1. Profile Fetch
- **Method**: `GET`
- **Route**: `/api/user/profile`
- **Purpose**: Fetch profile data for the authenticated athlete.
- **Auth Required**: Yes (`Bearer <token>` or `x-user-id`)
- **Success Response (200 OK)**:
  ```json
  { "success": true, "data": { "id": 1, "name": "Alex", "email": "alex@fitai.pro", "level": 1, "xp": 0 } }
  ```

#### 2. Profile Update
- **Method**: `PUT`
- **Route**: `/api/user/profile`
- **Purpose**: Modify profile details.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "weight_kg": 80.5, "goal": "Strength Gain" }
  ```
- **Success Response (200 OK)**: Returns updated profile structure.

#### 3. Onboarding Preferences
- **Method**: `POST`
- **Route**: `/api/user/onboarding`
- **Purpose**: Save user's fitness settings.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "goal": "Strength", "weightKg": 75, "equipment": "Dumbbells", "timeCommitment": "45 mins" }
  ```
- **Success Response (200 OK)**: Returns updated profile structure.

#### 4. Stats
- **Method**: `GET`
- **Route**: `/api/user/stats`
- **Purpose**: Fetch summary of workout history, current level, XP, and streaks.
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  { "success": true, "data": { "userId": 1, "level": 2, "completedWorkouts": 5, "currentStreak": 3 } }
  ```

#### 5. Calendar
- **Method**: `GET`
- **Route**: `/api/user/calendar`
- **Purpose**: Fetch summary of workouts, recovery scores, meals, and exercise performance logs day-by-day.
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "2026-07-28": {
        "log_date": "2026-07-28",
        "workout": { "id": 5, "title": "45m Session", "status": "completed" },
        "recovery": { "readiness_percentage": 90, "sleep_hours": 8 }
      }
    }
  }
  ```

#### 6. Award XP
- **Method**: `POST`
- **Route**: `/api/user/award-xp`
- **Purpose**: Award custom XP value manually (e.g. for complete action in widget).
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "amount": 30 }
  ```
- **Success Response (200 OK)**: Returns new totals and level.

---

### Workout Module

#### 1. Get Today State
- **Method**: `GET`
- **Route**: `/api/workout/today`
- **Purpose**: Determine what scenario the user is in (FIRST_DAY, HAS_WORKOUT_TODAY, COMPLETED_TODAY, READY_TO_GENERATE).
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  { "success": true, "scenario": "READY_TO_GENERATE", "workout": null, "streak": [] }
  ```

#### 2. Generate Workout
- **Method**: `POST`
- **Route**: `/api/workout/generate`
- **Purpose**: Run AI workout generator with Groq rotation, fuzzy-match video tutorials, and commit configuration version.
- **Auth Required**: Yes
- **Success Response (200 OK)**: Returns a full `workout` object with an array of `exercises`.

#### 3. Complete Workout
- **Method**: `POST`
- **Route**: `/api/workout/:id/complete`
- **Purpose**: Submit workout feedback, set status = completed, and grant +20 XP (and +5 bonus XP).
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "energy": 4, "soreness": 3, "mood": 4, "notes": "Great burn!" }
  ```
- **Success Response (200 OK)**:
  ```json
  { "success": true, "data": { "id": 5, "status": "completed", "xpEarned": 5, "levelData": { "level": 2 } } }
  ```

#### 4. Toggle Exercise Completion
- **Method**: `PUT`
- **Route**: `/api/workout/exercise/:id/toggle`
- **Purpose**: Toggle completion checkmark of an individual exercise.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "isCompleted": true }
  ```
- **Success Response (200 OK)**: Returns updated exercise object.

#### 5. Rollback Version
- **Method**: `POST`
- **Route**: `/api/workout/version-control/rollback` / `/api/workout/rollback`
- **Purpose**: Restore workout layout structure to previous commits.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "targetVersionId": "v1.2" }
  ```
- **Success Response (200 OK)**: Returns rolled-back commit description.

#### 6. Exercise Log (Progressive Overload)
- **Method**: `POST`
- **Route**: `/api/workout/exercise-log`
- **Purpose**: Log specific sets details (reps, weight, RPE).
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "exerciseName": "Bench Press", "weightKg": 60, "repsAchieved": 10, "rpe": 8 }
  ```
- **Success Response (200 OK)**: Returns saved log.

---

### Recovery Module

#### 1. Get Latest Recovery Log
- **Method**: `GET`
- **Route**: `/api/recovery/latest`
- **Purpose**: Get latest recovery checking log.
- **Auth Required**: Yes
- **Success Response (200 OK)**: Returns latest recovery log data.

#### 2. Get Recovery Insights
- **Method**: `POST`
- **Route**: `/api/recovery/insights`
- **Purpose**: Input wearable metrics and calculate Bio-Readiness score with recommendations, granting +5 XP.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "sleepHours": 7.5, "hrv": 62, "soreness": "Medium", "hydrationL": 2.5 }
  ```
- **Success Response (200 OK)**: Returns calculated recovery insights and saved recovery log record.

---

### Coach Module

#### 1. Get Chat History
- **Method**: `GET`
- **Route**: `/api/coach/history`
- **Purpose**: Fetch conversation logs.
- **Auth Required**: Yes
- **Success Response (200 OK)**: Array of messages.

#### 2. Chat with AI
- **Method**: `POST`
- **Route**: `/api/coach/chat`
- **Purpose**: Send query to AI Coach (relying on Groq rotating keys, falls back to local answers if keys fail).
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "message": "How do I optimize squat form?" }
  ```
- **Success Response (200 OK)**:
  ```json
  { "success": true, "response": "Squat form guidelines..." }
  ```

---

### Nutrition Module

#### 1. Daily Plan
- **Method**: `GET`
- **Route**: `/api/nutrition/plan`
- **Purpose**: Get weekly Indian meal suggestions and daily macro target status.
- **Auth Required**: Yes
- **Success Response (200 OK)**: Returns list of breakfast, lunch, snack, dinner suggestions and macro targets.

#### 2. Macro Calculator
- **Method**: `POST`
- **Route**: `/api/nutrition/calculate-macros`
- **Purpose**: Instant calorie and macro check for any query without database insertion.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "foodItem": "2 chapatis and 100g paneer" }
  ```
- **Success Response (200 OK)**: Returns estimated grams of protein, carbs, fats, and calories.

#### 3. Log Meal
- **Method**: `POST`
- **Route**: `/api/nutrition/log-meal`
- **Purpose**: Confirm macro counts and insert log to database (awards +3 XP).
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "mealType": "Lunch", "foodItem": "Rice and Soya Chunks", "proteinG": 30, "carbsG": 55, "fatsG": 5, "calories": 385 }
  ```
- **Success Response (200 OK)**: Returns logged meal structure and level metrics.

#### 4. Budget Grocery Optimize
- **Method**: `POST`
- **Route**: `/api/nutrition/grocery-optimize`
- **Purpose**: Budget grocery organizer based on dietary choices.
- **Auth Required**: Yes
- **Request Body**:
  ```json
  { "budgetUsd": 50, "dietPref": "Veg" }
  ```
- **Success Response (200 OK)**: Returns structured shopping list items and week meal outline.
