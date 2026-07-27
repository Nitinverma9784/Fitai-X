# 🏋️ FitAI X — Workout Planner Feature: Complete Technical Documentation

> **Last Updated:** July 2026  
> **Feature Scope:** AI-Adaptive Workout Generation, Exercise Tracking, ExerciseDB Integration, Version Control  
> **Stack:** React Native (Expo) Frontend · Node.js/TypeScript Backend · PostgreSQL + In-Memory Fallback · Groq LLM (llama-3.3-70b-versatile) · ExerciseDB V2 RapidAPI

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Frontend File Map](#3-frontend-file-map)
4. [Backend File Map](#4-backend-file-map)
5. [End-to-End Flow Diagram](#5-end-to-end-flow-diagram)
6. [State Machine: Workout Scenarios](#6-state-machine-workout-scenarios)
7. [Frontend Deep Dive](#7-frontend-deep-dive)
8. [Backend API Routes Reference](#8-backend-api-routes-reference)
9. [The Groq AI Engine](#9-the-groq-ai-engine)
10. [ExerciseDB V2 Integration](#10-exercisedb-v2-integration)
11. [Database Schema & Layer](#11-database-schema--layer)
12. [Version Control System](#12-version-control-system)
13. [Data Types & Interfaces](#13-data-types--interfaces)
14. [Key Algorithms](#14-key-algorithms)
15. [Configuration & API Keys](#15-configuration--api-keys)

---

## 1. Feature Overview

The **Workout Planner** is the core feature of FitAI X. It provides a fully AI-driven, adaptive daily workout generation system that:

- **Generates a unique workout every day** using the Groq LLM (llama-3.3-70b) tailored to the user's profile, recovery state, previous session feedback, equipment, and time availability.
- **Enriches exercises** with real HD video demonstrations, muscle bodymap images, and step-by-step instructions from the ExerciseDB V2 API (RapidAPI).
- **Tracks completion** of individual exercises within a session with real-time toggling.
- **Collects post-workout feedback** (energy, soreness, mood) that directly influences the next day's AI generation.
- **Maintains version history** of all generated workout plans (like Git commits) with rollback capability.
- **Awards XP** to users upon workout completion (gamification).
- **Maintains a 7-day streak calendar** showing completed, missed, and pending workout days.

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph FRONTEND["📱 Frontend — React Native / Expo"]
        WS["workout.tsx\n(Main Workout Screen)"]
        VC["version-control.tsx\n(History & Rollback)"]
        WKService["workoutService.ts\n(API Client)"]
        GroqSvc["groqService.ts\n(General API Client)"]
        SessSvc["sessionService.ts\n(Auth Token / User ID)"]
    end

    subgraph BACKEND["🖥️ Backend — Node.js / TypeScript"]
        Server["server.ts\n(Express Entry Point)"]
        WRoute["workoutRoutes.ts\n(12 REST Endpoints)"]
        WaiSvc["workoutAiService.ts\n(Groq Prompt Builder)"]
        EDBSvc["exerciseDbService.ts\n(ExerciseDB V2 Fetcher)"]
        VCSvc["versionControlService.ts\n(Git-like Commits)"]
        AuthMW["authMiddleware.ts\n(JWT + x-user-id)"]
        Config["core/config.ts\n(Key Rotation Pools)"]
        Database["core/database.ts\n(pg Pool + Memory Fallback)"]
    end

    subgraph EXTERNAL["☁️ External APIs"]
        Groq["Groq AI API\nllama-3.3-70b-versatile\n(Up to 4 key rotation)"]
        EDB["ExerciseDB V2\nRapidAPI\n(Up to 7 key rotation)"]
        PG["PostgreSQL\nPort 5433\n(fitaix database)"]
    end

    WS -->|"REST fetch()"| WKService
    VC -->|"REST fetch()"| WKService
    WKService -->|"Bearer token + x-user-id"| WRoute
    WRoute --> AuthMW
    AuthMW --> WRoute
    WRoute --> WaiSvc
    WRoute --> VCSvc
    WRoute --> Database
    WaiSvc --> Config
    WaiSvc --> EDBSvc
    EDBSvc --> Config
    Config -->|"rotated key"| Groq
    Config -->|"rotated key"| EDB
    Database --> PG
    Database -->|"fallback if PG offline"| MemDB["In-Memory Store\n(memoryDb)"]
```

---

## 3. Frontend File Map

All workout planner frontend code lives inside `d:\Fitai X\frontend\`.

```
frontend/
├── app/
│   ├── (tabs)/
│   │   └── workout.tsx          ← 🎯 PRIMARY WORKOUT SCREEN (1026 lines)
│   ├── version-control.tsx      ← Workout History & Rollback UI (406 lines)
│   └── _layout.tsx              ← Tab navigation layout
├── services/
│   ├── workoutService.ts        ← Typed API client for all workout endpoints
│   ├── groqService.ts           ← General REST API client (used by other tabs)
│   └── sessionService.ts        ← Auth token & userId storage
├── components/
│   └── WorkoutVersionControlModal.tsx   ← Version control modal component
└── types/
    └── user.ts                  ← Shared TypeScript types (WorkoutPlan, etc.)
```

### File Responsibilities

| File | Role | Lines |
|------|------|-------|
| [workout.tsx](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) | Full workout screen: state machine, exercise cards, modals, feedback form | 1026 |
| [version-control.tsx](file:///d:/Fitai%20X/frontend/app/version-control.tsx) | Browse AI commit history, view diffs, rollback plans | 406 |
| [workoutService.ts](file:///d:/Fitai%20X/frontend/services/workoutService.ts) | All typed `fetch()` calls to `/api/workout/*` endpoints | 194 |
| [sessionService.ts](file:///d:/Fitai%20X/frontend/services/sessionService.ts) | Retrieves `userId` and JWT `token` for request headers | 81 |
| [groqService.ts](file:///d:/Fitai%20X/frontend/services/groqService.ts) | General backend API client (also used by recovery/nutrition tabs) | 381 |

---

## 4. Backend File Map

All workout backend code lives inside `d:\Fitai X\backend\`.

```
backend/
├── server.ts / server.js         ← Express entry point, Groq key pool, routes mount
├── routes/
│   └── workoutRoutes.ts          ← 🎯 ALL 12 workout REST API endpoints (390 lines)
├── services/
│   ├── workoutAiService.ts       ← 🧠 Groq prompt builder + AI generation engine (389 lines)
│   ├── exerciseDbService.ts      ← 🎥 ExerciseDB V2 fetch, fuzzy matching, enrichment (209 lines)
│   ├── versionControlService.ts  ← Git-like commit/rollback system (98 lines)
│   └── adaptiveAiEngine.ts       ← Local exercise DB + bio-readiness scoring (144 lines)
├── core/
│   ├── database.ts               ← 🐘 PostgreSQL + memory fallback, all DB functions (983 lines)
│   ├── config.ts                 ← Groq + ExerciseDB key rotation managers (69 lines)
│   ├── authMiddleware.ts         ← JWT Bearer token + x-user-id middleware (35 lines)
│   └── security.ts               ← JWT sign/verify helpers
├── db.js                         ← Legacy simple DB for server.js (334 lines)
└── .env                          ← API keys, DB URL, port
```

### File Responsibilities

| File | Role | Lines |
|------|------|-------|
| [workoutRoutes.ts](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) | 12 REST endpoints: GET today, POST generate, POST complete, toggle, streak, history, version control, media proxy | 390 |
| [workoutAiService.ts](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) | Builds Groq prompt from user context, calls API, enriches with ExerciseDB, filters by equipment | 389 |
| [exerciseDbService.ts](file:///d:/Fitai%20X/backend/services/exerciseDbService.ts) | Fuzzy search ExerciseDB V2, smart relevance scoring, fetch video+image+instructions | 209 |
| [versionControlService.ts](file:///d:/Fitai%20X/backend/services/versionControlService.ts) | In-memory git-like commit store, diff calculation, rollback | 98 |
| [adaptiveAiEngine.ts](file:///d:/Fitai%20X/backend/services/adaptiveAiEngine.ts) | Local exercise database, bio-readiness score formula (sleep/soreness/stress/calories) | 144 |
| [database.ts](file:///d:/Fitai%20X/backend/core/database.ts) | Full database layer: initDb (schema migrations), saveWorkout, getTodayWorkout, markComplete, streak, exercise logs | 983 |
| [config.ts](file:///d:/Fitai%20X/backend/core/config.ts) | Groq key rotation (4 keys), ExerciseDB key rotation (7 keys), model selection | 69 |
| [authMiddleware.ts](file:///d:/Fitai%20X/backend/core/authMiddleware.ts) | JWT token verification OR x-user-id header fallback | 35 |

---

## 5. End-to-End Flow Diagram

### Generating a Workout

```mermaid
sequenceDiagram
    participant U as 👤 User (Mobile App)
    participant WUI as workout.tsx
    participant WSvc as workoutService.ts
    participant API as workoutRoutes.ts (POST /generate)
    participant DB as database.ts (PostgreSQL)
    participant AIE as workoutAiService.ts
    participant G as Groq AI (llama-3.3-70b)
    participant EDB as exerciseDbService.ts
    participant EDBAPI as ExerciseDB V2 (RapidAPI)
    participant VC as versionControlService.ts

    U->>WUI: Taps "Generate Today's Workout"
    WUI->>WUI: setGenerating(true), show AIGenerationModal
    WUI->>WSvc: workoutService.generate()
    WSvc->>API: POST /api/workout/generate\n(Bearer token + x-user-id)
    API->>API: authenticateToken middleware
    API->>DB: getUser(userId) — fetch profile\n(goal, equipment, injuries, time_commitment)
    API->>DB: getWorkoutHistory(userId, 20) — last 20 sessions
    API->>DB: getWorkoutStreak(userId, 7) — last 7 days
    API->>DB: getUserExerciseLogs(userId, 20) — weight/rep logs
    API->>DB: getLatestRecovery(userId) — sleep/HRV/readiness
    API->>API: Build WorkoutGenerationContext object
    API->>AIE: generateAdaptiveWorkoutWithGroq(ctx)
    AIE->>AIE: buildAdaptivePrompt(ctx)\n→ analyze feedback, missed days,\n→ previous muscles, equipment filter
    AIE->>G: chat.completions.create()\n(JSON mode, temp=0.3)
    G-->>AIE: Raw JSON workout plan\n(title, exercises[], adaptations, reasoning)
    AIE->>AIE: Validate exercises against allowed list\n(bodyweight/dumbbell/full gym)
    loop For each exercise
        AIE->>EDB: fetchExerciseDbDetails(exerciseName)
        EDB->>EDBAPI: GET /api/v1/exercises/search?search=...
        EDBAPI-->>EDB: Candidate exercises array
        EDB->>EDB: scoreCandidate() — fuzzy match, threshold=250
        EDB->>EDBAPI: GET /api/v1/exercises/{exerciseId}\n(fetch video URL, instructions, tips)
        EDBAPI-->>EDB: Exercise detail (videoUrl, imageUrl, steps)
        EDB-->>AIE: EnrichedExercise (video ✅, steps ✅, muscle ✅)
    end
    AIE-->>API: AdaptiveWorkoutPlan (title, exercises with videos, reasoning)
    API->>DB: saveWorkout(userId, plan) — INSERT workouts + exercises rows
    API->>VC: commitNewVersion(userId, plan)\n(git-like commit with diff)
    API-->>WSvc: { success: true, data: savedWorkout }
    WSvc-->>WUI: WorkoutRecord with exercises
    WUI->>WUI: setGenerating(false), setState(data)
    WUI->>U: Render workout plan with exercise cards
```

---

### Completing a Workout

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant WUI as workout.tsx
    participant WSvc as workoutService.ts
    participant API as workoutRoutes.ts

    U->>WUI: Taps exercise checkbox → handleToggleExercise()
    WUI->>WSvc: toggleExercise(exId, isDone)
    WSvc->>API: PUT /api/workout/exercise/:id/toggle
    API->>DB: toggleExerciseCompletion(id, bool)\nSets is_completed + completed_sets
    API-->>WUI: Updated exercise row

    U->>WUI: Taps "Finish Workout" button
    WUI->>WUI: setShowFeedback(true) → shows FeedbackModal
    U->>WUI: Rates energy(1-5), soreness(1-5), mood(1-5), optional notes
    WUI->>WSvc: completeWorkout(workoutId, feedback)
    WSvc->>API: POST /api/workout/:id/complete\n{ energy, soreness, mood, notes }
    API->>DB: markWorkoutComplete(id, feedback)\nSets status='completed', completed_at=NOW()
    API->>DB: awardXp(userId, 5) — XP gamification
    API-->>WUI: { success:true, xpEarned:5, levelData }
    WUI->>WUI: Reload state → scenario='COMPLETED_TODAY'
    WUI->>U: "Session Complete!" banner + feedback chips
```

---

## 6. State Machine: Workout Scenarios

The workout screen operates as a 4-state machine determined by `GET /api/workout/today`:

```mermaid
stateDiagram-v2
    [*] --> Loading: App opens, load() called

    Loading --> FIRST_DAY: totalWorkouts === 0
    Loading --> HAS_WORKOUT_TODAY: todayWorkout exists\nstatus = 'pending'
    Loading --> COMPLETED_TODAY: todayWorkout exists\nstatus = 'completed'
    Loading --> READY_TO_GENERATE: No workout yet today\nbut history exists

    FIRST_DAY --> HAS_WORKOUT_TODAY: User taps "Generate My First Workout"\nPOST /generate called

    READY_TO_GENERATE --> HAS_WORKOUT_TODAY: User taps "Generate Today's Workout"\nPOST /generate called

    HAS_WORKOUT_TODAY --> HAS_WORKOUT_TODAY: User toggles exercises\nPUT /exercise/:id/toggle

    HAS_WORKOUT_TODAY --> COMPLETED_TODAY: User finishes + submits feedback\nPOST /:id/complete

    COMPLETED_TODAY --> READY_TO_GENERATE: Next day (new session_date)
```

### Scenario UI Rendering

| Scenario | What the UI Shows |
|----------|-------------------|
| `FIRST_DAY` | Welcome hero card — "Let's Begin", generates first full-body session |
| `READY_TO_GENERATE` | Previous session card + AI Planner hero card with "Generate Today's Workout" button |
| `HAS_WORKOUT_TODAY` | Full workout plan: hero stats (readiness %, duration, calories), AI reasoning box, adaptation tags, progress bar, exercise cards, "Finish Session" button |
| `COMPLETED_TODAY` | Exercise list (read-only) + green "Session Complete!" banner with feedback chips |

---

## 7. Frontend Deep Dive

### 7.1 workout.tsx — Component Map

[workout.tsx](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) (1026 lines) is organized into these sub-components:

```
workout.tsx
│
├── StreakCalendar (L27–91)
│   └── Renders 7-day weekly streak with status dots (completed/missed/pending)
│
├── FeedbackModal (L102–161)
│   └── Bottom sheet: 3 rating sliders (energy/soreness/mood) + notes text input
│
├── AIGenerationModal (L171–299)
│   └── 4-step animated timeline showing AI analysis in progress:
│       1. Analyzing Session History & Feedback
│       2. Calculating Muscle Recovery & Fatigue Index
│       3. Synthesizing Progressive Overload Plan
│       4. Finalizing Customized Exercises & Form Tips
│
├── ExerciseVideoModal (L332–600)
│   └── Bottom sheet with:
│       - HD video player (expo-av Video + HTML5 <video> for web)
│       - Sets × Reps × Rest meta bar
│       - Targeted Muscle Bodymap image (from ExerciseDB imageUrl)
│       - PRO FORM TIP section
│       - Step-by-step instructions (numbered)
│
├── ExerciseCard (L605–661)
│   └── List item for each exercise:
│       - Exercise number badge
│       - Name, sets × reps · rest info
│       - "▶ Video & Steps" button → opens ExerciseVideoModal
│       - Completion toggle checkbox (shows completed_sets/total or ✓)
│
└── WorkoutScreen (L666–967) — DEFAULT EXPORT
    ├── State: state(TodayState), loading, generating, refreshing, showFeedback, completing, selectedExercise
    ├── load() → workoutService.getToday()
    ├── handleGenerate() → workoutService.generate()
    ├── handleToggleExercise() → workoutService.toggleExercise()
    ├── handleFeedbackSubmit() → workoutService.completeWorkout()
    └── Renders scenario-based UI (FIRST_DAY / READY_TO_GENERATE / HAS_WORKOUT_TODAY / COMPLETED_TODAY)
```

### 7.2 Key State Variables

```typescript
const [state, setState] = useState<TodayState | null>(null);
// Full today's state: scenario, workout, lastWorkout, streak, totalWorkouts, missedCount

const [loading, setLoading] = useState(true);
// Initial load spinner

const [generating, setGenerating] = useState(false);
// Controls AIGenerationModal visibility during AI call

const [showFeedback, setShowFeedback] = useState(false);
// Controls FeedbackModal visibility

const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);
// Controls ExerciseVideoModal — which exercise is being viewed
```

### 7.3 workoutService.ts — API Client

[workoutService.ts](file:///d:/Fitai%20X/frontend/services/workoutService.ts) is a pure REST client with typed method signatures:

```typescript
workoutService.getToday()          → GET /api/workout/today
workoutService.generate()          → POST /api/workout/generate
workoutService.completeWorkout()   → POST /api/workout/:id/complete
workoutService.missWorkout()       → POST /api/workout/:id/miss
workoutService.toggleExercise()    → PUT /api/workout/exercise/:id/toggle
workoutService.getStreak()         → GET /api/workout/streak?days=7
workoutService.getHistory()        → GET /api/workout/history
workoutService.getVersionHistory() → GET /api/workout/version-control/history
workoutService.rollbackToVersion() → POST /api/workout/version-control/rollback
workoutService.saveExerciseLog()   → POST /api/workout/exercise-log
```

**Header strategy:** Every request includes:
```typescript
{
  'Content-Type': 'application/json',
  'x-user-id': String(sessionService.getUserId()),
  'Authorization': `Bearer ${sessionService.getToken()}` // if logged in
}
```

**Backend URL resolution:**
```typescript
function resolveBackendUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:5000/api';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:5000/api`; // Expo Go LAN IP
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
}
```

### 7.4 ExerciseVideoModal — Video Player

The video player handles both **native mobile** and **web** platforms:

```tsx
{Platform.OS === 'web' ? (
  // HTML5 <video> tag — autoplay, muted, loop
  <video src={videoUrl} controls autoPlay muted loop playsInline ... />
) : (
  // expo-av Video component — native iOS/Android
  <Video
    source={{ uri: videoUrl }}
    useNativeControls
    isLooping
    shouldPlay={true}
    isMuted={true}
    onLoad={() => setLoadingVideo(false)}
    onError={(e) => { setVideoError(e.message); setLoadingVideo(false); }}
  />
)}
```

**`cleanMediaUrl()`** strips any proxy wrappers from the URL (recursively unwraps `media-proxy?url=...`) to give the direct ExerciseDB CDN URL to the player.

---

## 8. Backend API Routes Reference

All routes are mounted at `/api/workout` via [workoutRoutes.ts](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts).

```mermaid
graph LR
    subgraph "GET endpoints"
        G1["GET /today\nReturns scenario + workout + streak"]
        G2["GET /streak?days=7\nReturns 7-day status array"]
        G3["GET /history\nAll past workouts"]
        G4["GET /latest\nMost recent workout"]
        G5["GET /exercise-logs\nWeight/rep history (30 logs)"]
        G6["GET /version-control/history\nAll AI commits"]
    end
    subgraph "POST endpoints"
        P1["POST /generate\n🧠 AI Workout Generation"]
        P2["POST /:id/complete\nMark done + feedback"]
        P3["POST /:id/miss\nMark as missed"]
        P4["POST /set-complete\nLegacy set tracker"]
        P5["POST /exercise-log\nSave weight/rep log"]
        P6["POST /version-control/rollback\nRestore old plan"]
        P7["POST /rollback\nAlias rollback"]
    end
    subgraph "PUT endpoints"
        U1["PUT /exercise/:id/toggle\nToggle exercise completion"]
    end
    subgraph "Media"
        M1["GET /video-proxy\nProxy ExerciseDB videos"]
        M2["GET /media-proxy\nAlias media proxy"]
    end
```

### Route Detail: `GET /today`

This is the most critical route — it determines what the user sees.

```typescript
1. db.markMissedWorkoutsBeforeToday(userId)  // auto-mark past pending → missed
2. history = db.getWorkoutHistory(userId)
3. streak = db.getWorkoutStreak(userId, 7)
4. todayWorkout = db.getTodayWorkout(userId)  // WHERE session_date = CURRENT_DATE

// Scenario Logic:
if (history.length === 0) → scenario: 'FIRST_DAY'
if (todayWorkout) {
  // Live-enrich exercises with ExerciseDB if video_url missing
  for (ex of todayWorkout.exercises) {
    if (!ex.video_url) {
      edbData = await fetchExerciseDbDetails(ex.name)
      ex.video_url = edbData.videoUrl // patch on-the-fly
    }
  }
  scenario = todayWorkout.status === 'completed' ? 'COMPLETED_TODAY' : 'HAS_WORKOUT_TODAY'
}
else → scenario: 'READY_TO_GENERATE'
```

### Route Detail: `POST /generate`

The most complex route — orchestrates the entire AI generation pipeline:

```typescript
1. userProfile = db.getUser(userId)           // goal, equipment, injuries, time_commitment
2. history = db.getWorkoutHistory(userId, 20) // last 20 sessions
3. streak = db.getWorkoutStreak(userId, 7)
4. userExerciseLogs = db.getUserExerciseLogs(userId, 20) // progressive overload data
5. latestRecovery = db.getLatestRecovery(userId)         // sleep/HRV data

// Build context object
ctx: WorkoutGenerationContext = {
  userName, gender, goal, weightKg, equipment, injuries,
  timeCommitment, dayNumber: history.length,
  missedDaysCount, lastWorkout, lastFeedback,
  userExerciseLogs, previousDaySummary
}

6. plan = generateAdaptiveWorkoutWithGroq(ctx)  // calls Groq AI + ExerciseDB

7. db.saveWorkout(userId, plan)                 // INSERT workout + exercises rows

8. versionControlService.commitNewVersion(...)  // git-like commit

9. return savedWorkout
```

### Route Detail: `POST /:id/complete`

```typescript
1. db.markWorkoutComplete(workoutId, { energy, soreness, mood, notes })
   → UPDATE workouts SET status='completed', completed_at=NOW(), feedback_* = $n
2. db.awardXp(userId, 5)   // +5 XP for completing a workout
3. return { ...result, xpEarned: 5, levelData }
```

---

## 9. The Groq AI Engine

### File: [workoutAiService.ts](file:///d:/Fitai%20X/backend/services/workoutAiService.ts)

This is the heart of the workout planner. It contains three key functions:

### 9.1 `getTimeBasedConfig()` — Exercise Count Calculator

```typescript
function getTimeBasedConfig(timeStr, lowEnergy, highSoreness) {
  // Parse minutes from user's onboarding selection (e.g. "45 mins" → 45)
  const mins = parseInt(timeStr.match(/\d+/)[0]);

  let targetExercises = 5;

  if (mins <= 20) targetExercises = 3;       // 20-min session → 3 exercises
  else if (mins <= 35) targetExercises = 4;  // 30-min session → 4 exercises
  else if (mins <= 50) targetExercises = 5;  // 45-min session → 5 exercises
  else targetExercises = 6;                  // 60-min session → 6 exercises

  // Reduce 1 exercise if user reported low energy or high soreness
  if (lowEnergy || highSoreness) targetExercises = Math.max(3, targetExercises - 1);

  const estimatedCalories = Math.round(durationMinutes * 8.5);
  return { targetExercises, durationMinutes, estimatedCalories };
}
```

### 9.2 `buildAdaptivePrompt()` — The Groq Prompt

This function constructs the dynamic system prompt sent to Groq. Here is the **complete prompt logic** annotated:

```
PROMPT STRUCTURE
═════════════════

[SYSTEM HEADER]
"You are FitAI Pro, an elite strength & conditioning AI coach."

[USER PROFILE]
- User: {userName}
- Goal: {goal}                         ← from onboarding (e.g. "Muscle Gain & Hypertrophy")
- Weight: {weightKg}kg
- Equipment: {equipment}               ← from onboarding (e.g. "Commercial Gym")

[EQUIPMENT MANDATE]
BODYWEIGHT ONLY → restricts to VERIFIED_BODYWEIGHT_EXERCISES list
HOME/DUMBBELL   → restricts to VERIFIED_DUMBBELL_EXERCISES list
COMMERCIAL GYM  → all exercises allowed (VERIFIED_FULL_GYM_EXERCISES)

[INJURY BLOCK]
"INJURY RESTRICTIONS: User has [knee, shoulder]. AVOID exercises stressing these areas!"

[TIME MANDATE]
"Session #{dayNumber+1} → Generate EXACTLY {targetExercises} exercises"

[ALLOWED EXERCISE LIST]
Only exercises in the VERIFIED lists are allowed (guarantees ExerciseDB video match):
VERIFIED_BODYWEIGHT_EXERCISES = [
  'Push-up', 'Clap Push Up', 'Diamond Push up', 'Wide Hand Push up',
  'Pull-up', 'Chin-ups', 'Squat', 'Bulgarian Split Squat',
  'Triceps Dip', 'Elbow Up and Down Dynamic Plank', ...
]
VERIFIED_DUMBBELL_EXERCISES = [...bodyweight + 
  'Bench Press', 'Arnold Press', 'Lateral Raise',
  'Hammer Curl', 'Romanian Deadlift', 'Goblet Squat', ...
]

[EXERCISE LOG BLOCK] ← Progressive Overload Directive
"USER RECORDED EXERCISE LOGS:
- Bench Press: 80kg (40kg bar + 40kg plates) × 8 reps
- Squat: bodyweight × 15 reps max
PROGRESSIVE OVERLOAD DIRECTIVE: Automatically scale weight/reps!"

[ADAPTIVE CONTEXT BLOCK] ← Changes based on:

  IF firstDay:
  "Design a welcoming, balanced Full Body intro session."

  IF missedDays > 0:
  "User missed 2 day(s). Reduce volume by ~20% for re-engagement."

  IF lastWorkout exists:
  "PREVIOUS SESSION: 'Push Day' targeting [Chest, Triceps]
   CRITICAL RULE: DO NOT repeat these muscles. Select Back/Pull or Legs."

  IF lastFeedback exists:
  "PREVIOUS FEEDBACK: Energy 2/5, Soreness 4/5, Mood 3/5.
   User notes: 'shoulders felt tight'"

  IF soreness >= 4:
  "HIGH SORENESS: Lower sets (2-3 max), extend rest (75-90s), no heavy axial loading."

  IF energy <= 2:
  "LOW ENERGY: Keep session 30mins, 3-4 exercises max, moderate effort."

  IF energy >= 4 AND NOT highSoreness:
  "HIGH ENERGY: Apply progressive overload (+1 set or higher intensity)."

  IF dayNumber >= 7:
  "1-WEEK ESCALATION: Auto-increase weight (+2.5kg or +1 set) — document in aiReasoning!"

[PREVIOUS DAY RECOVERY SUMMARY]
"Sleep: 7.2 hrs (88% efficiency), HRV: 58ms, Readiness: 74%
 IF readiness < 75% OR sleep < 6.5h → lower volume by 15-20%"

[OUTPUT FORMAT MANDATE]
Return ONLY valid JSON:
{
  "title": "...",
  "durationMinutes": 45,
  "estimatedCalories": 380,
  "targetMuscles": ["Back", "Biceps"],
  "whyRecommendation": "...",
  "aiReasoning": "...",
  "readinessScore": 82,
  "commitMessage": "feat: adaptive Commercial Gym session (45m)",
  "adaptations": ["Matched exercises to equipment", "Set count for time"],
  "analysisSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."],
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 4,
      "reps": "8-10",
      "restSec": 60,
      "icon": "dumbbell",
      "tip": "Keep shoulder blades retracted.",
      "targetMuscle": "Chest"
    }
  ]
}
```

### 9.3 `generateAdaptiveWorkoutWithGroq()` — Main Generation Function

```mermaid
flowchart TD
    A["buildAdaptivePrompt(ctx)"] --> B["Groq API call\nmodel: llama-3.3-70b-versatile\ntemp: 0.3, json_object mode"]
    B --> C{Parse JSON response}
    C -->|Valid| D["For each exercise in plan"]
    C -->|Error| ERR["Throw FitAI Engine Error"]
    D --> E{Exercise in allowed list?}
    E -->|No| SKIP["Skip — log equipment mismatch warning"]
    E -->|Yes| F["fetchExerciseDbDetails(ex.name)"]
    F --> G{ExerciseDB score >= 250?}
    G -->|No| SKIP2["Skip — score below threshold"]
    G -->|Yes| H["Enrich: add videoUrl, imageUrl, steps, targetMuscle"]
    H --> I{enrichedExercises.length >= targetExercises?}
    I -->|Yes| J["Slice to exact count\nreturn finalExercises"]
    I -->|No| K["Query allowed list for fallback exercises\nuntil count reached"]
    K --> J
    SKIP --> D
    SKIP2 --> D
```

### 9.4 Groq API Configuration

```typescript
// File: core/config.ts
// Up to 4 Groq API keys rotate round-robin
const groqKeys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
].filter(Boolean);

// Round-robin rotation — prevents rate limiting
let rotationIndex = 0;
export function getNextGroqClient() {
  const key = groqKeys[rotationIndex % groqKeys.length];
  rotationIndex++;
  return { client: new Groq({ apiKey: key }), ... };
}

// Groq call parameters:
client.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,              // low = deterministic, consistent output
  response_format: { type: 'json_object' },  // forces pure JSON
  messages: [
    { role: 'system', content: 'You are FitAI Pro engine. Generate adaptive workout plans in valid JSON format only.' },
    { role: 'user', content: prompt }  // the full buildAdaptivePrompt() output
  ]
})
```

---

## 10. ExerciseDB V2 Integration

### File: [exerciseDbService.ts](file:///d:/Fitai%20X/backend/services/exerciseDbService.ts)

### 10.1 Purpose

After Groq generates exercise names, `fetchExerciseDbDetails()` fetches from ExerciseDB V2 (RapidAPI):
- **HD Video URL** (MP4) — for the in-app video player
- **Muscle Bodymap Image URL** — anatomical diagram showing targeted muscles  
- **Step-by-step instructions** — numbered form cues
- **Exercise tips** — pro coaching advice

### 10.2 Key Pool (Up to 7 Keys)

```typescript
const exerciseDbKeys = [
  process.env.RAPIDAPI_EXERCISEDB_KEY_1,  // primary
  process.env.RAPIDAPI_EXERCISEDB_KEY_2,
  process.env.RAPIDAPI_EXERCISEDB_KEY_3,
  process.env.RAPIDAPI_EXERCISEDB_KEY_4,
  process.env.RAPIDAPI_EXERCISEDB_KEY_5,
  process.env.EXERCISEDB_API_KEY,          // legacy key
  process.env.RAPIDAPI_KEY,               // generic RapidAPI key
].filter(Boolean);

export const rapidApiHost = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com';
```

### 10.3 Fetch Flow

```mermaid
flowchart TD
    A["fetchExerciseDbDetails(exerciseName)"] --> B["sanitizeSearchQuery()\nStrip: 'AI', 'Hypertrophy', 'Focus', etc."]
    B --> C["GET /api/v1/exercises/search?search={cleanQuery}\nHeaders: x-rapidapi-key, x-rapidapi-host"]
    C --> D["Response: array of candidate exercises"]
    D --> E["scoreCandidate() for each candidate\nRanked by relevance score"]
    E --> F{topMatch.score >= 250?}
    F -->|No| FALLBACK["Return empty fallback object\n(no video URL)"]
    F -->|Yes| G["GET /api/v1/exercises/{exerciseId}\nFetch full detail"]
    G --> H["Extract:\n- videoUrl (MP4 CDN link)\n- imageUrl (720p/480p/360p)\n- instructions[] → steps[]\n- exerciseTips[] → tip\n- targetMuscles[] → targetMuscle\n- secondaryMuscles[]"]
    H --> I["Return ExerciseDbResult object"]
```

### 10.4 Smart Scoring Algorithm

```typescript
function scoreCandidate(targetName: string, candidateName: string): number {
  // Normalize both names: lowercase, strip punctuation, collapse spaces
  const t = normalize(targetName);
  const c = normalize(candidateName);

  if (c === t) return 1000;           // Exact match — highest score

  if (c.startsWith(t)) score += 500; // Candidate starts with target
  if (t.startsWith(c)) score += 400; // Target starts with candidate

  // Word overlap scoring
  const matches = targetWords.filter(w => candidateWords.includes(w));
  score += matches.length * 100;
  if (matches.length === targetWords.length) score += 200; // all words match

  // Deduction: key words in target completely missing from candidate
  for (const tw of targetWords) {
    if (!candidateWords.some(cw => cw.includes(tw) || tw.includes(cw))) {
      score -= 250; // heavy penalty for mismatch
    }
  }

  // Deduction: unwanted variations (towel, chair, door, bed)
  if (c.includes('towel') && !t.includes('towel')) score -= 300;
  // Deduction: one-arm/single-leg unless requested
  if (c.includes('one arm') && !t.includes('one')) score -= 150;

  return score; // must be >= 250 to accept
}
```

**Threshold of 250** prevents wrong video matches (e.g., "Arnold Press" video being shown for "Leg Press").

### 10.5 Fallback Steps (when API unavailable)

If ExerciseDB returns no valid match:
```typescript
return {
  name: exerciseName,
  videoUrl: '',
  imageUrl: '',
  steps: [
    `Setup with feet planted shoulder-width apart and core engaged for ${exerciseName}.`,
    `Perform concentric movement through full range of motion.`,
    `Pause for 1 second at peak contraction.`,
    `Lower weight under strict 2-3 second control.`
  ],
  targetMuscle: 'Target Muscle',
  tip: `Focus on strict tempo and full range of motion for ${exerciseName}.`
};
```

---

## 11. Database Schema & Layer

### 11.1 PostgreSQL Tables (from database.ts)

```sql
-- Users table (extended for workout planner)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  goal VARCHAR(255),              -- "Muscle Gain & Hypertrophy", "Weight Loss", etc.
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  equipment VARCHAR(255),         -- "Commercial Gym", "Home Gym / Dumbbells", "Bodyweight Only"
  injuries TEXT[],               -- ["knee", "shoulder"] or ["None"]
  time_commitment VARCHAR(50),   -- "20 mins", "30 mins", "45 mins", "60 mins"
  gender VARCHAR(20) DEFAULT 'male',
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Workouts table
CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  duration_minutes INT NOT NULL,
  estimated_calories INT NOT NULL,
  target_muscles TEXT[] NOT NULL,      -- ["Chest", "Triceps"]
  why_recommendation TEXT,             -- "One sentence AI explanation"
  ai_reasoning TEXT,                   -- "2-3 sentence detailed AI reasoning"
  readiness_score INT DEFAULT 70,      -- 0-100 computed readiness
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'completed' | 'missed'
  session_date DATE DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP,
  feedback_energy INT DEFAULT 0,       -- 1-5 user rating
  feedback_soreness INT DEFAULT 0,     -- 1-5 user rating
  feedback_mood INT DEFAULT 0,         -- 1-5 user rating
  feedback_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercises table (child of workouts)
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  workout_id INT REFERENCES workouts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sets INT NOT NULL,
  reps VARCHAR(50) NOT NULL,           -- "10-12" or "15"
  rest_sec INT NOT NULL,
  icon VARCHAR(50),                    -- "dumbbell", "activity", "zap", etc.
  tip TEXT,                            -- Pro form tip from ExerciseDB
  target_muscle VARCHAR(255),          -- "Chest", "Biceps"
  video_url TEXT,                      -- ExerciseDB CDN MP4 URL
  steps TEXT[],                        -- Numbered instructions array
  completed_sets INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE
);

-- Exercise logs (progressive overload tracking)
CREATE TABLE exercise_logs (
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

-- Recovery logs (fed into workout generation)
CREATE TABLE recovery_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  readiness_percentage INT NOT NULL,
  hrv_ms INT,
  sleep_hours NUMERIC(4,2),
  sleep_efficiency INT,
  muscle_soreness VARCHAR(50),         -- "Low", "Moderate", "High"
  hydration_l NUMERIC(4,2),
  log_date DATE DEFAULT CURRENT_DATE
);
```

### 11.2 Dual-Mode Database (PostgreSQL + In-Memory Fallback)

```typescript
// database.ts — every function checks postgresActive flag
let postgresActive = false;

async function saveWorkout(userId, workoutData) {
  if (postgresActive) {
    // PostgreSQL: INSERT INTO workouts ... INSERT INTO exercises ...
    const wRes = await pool.query(`INSERT INTO workouts ...`);
    for (const ex of exercises) {
      await pool.query(`INSERT INTO exercises ...`);
    }
    return { ...workout, exercises: savedExercises };
  }
  
  // In-Memory Fallback: push to memoryDb.workouts and memoryDb.exercises
  memoryDb.workouts.unshift(workout);
  memoryDb.exercises.push(...savedExercises);
  return { ...workout, exercises: savedExercises };
}
```

### 11.3 Key Database Functions for Workout Feature

| Function | SQL / Action | Called By |
|----------|-------------|-----------|
| `getTodayWorkout(userId)` | `WHERE session_date = CURRENT_DATE ORDER BY id DESC LIMIT 1` | `GET /today` |
| `markMissedWorkoutsBeforeToday()` | `UPDATE workouts SET status='missed' WHERE session_date < TODAY AND status='pending'` | `GET /today` |
| `getWorkoutStreak(userId, 7)` | Generates 7-day array with status: completed/missed/pending/none | `GET /today`, `GET /streak` |
| `saveWorkout(userId, data)` | INSERT workouts row + all exercises rows | `POST /generate` |
| `markWorkoutComplete(id, feedback)` | UPDATE status='completed', store feedback ratings | `POST /:id/complete` |
| `toggleExerciseCompletion(id, bool)` | UPDATE is_completed, completed_sets | `PUT /exercise/:id/toggle` |
| `getUserExerciseLogs(userId, 20)` | SELECT last 20 weight/rep records | `POST /generate` |
| `awardXp(userId, amount)` | UPDATE users SET xp = xp + amount | `POST /:id/complete` |

---

## 12. Version Control System

### File: [versionControlService.ts](file:///d:/Fitai%20X/backend/services/versionControlService.ts)

The workout planner maintains a **Git-like commit history** of every generated workout plan. This is entirely in-memory (session-scoped) and separate from the SQL workout records.

### 12.1 WorkoutCommit Structure

```typescript
interface WorkoutCommit {
  versionId: string;              // "v1.3.0", "v1.4.0-rollback"
  parentVersionId: string | null; // previous commit's versionId
  timestamp: string;              // ISO 8601 timestamp
  author: 'FitAI Engine' | 'User Customization' | 'Recovery Auto-Deload';
  commitMessage: string;          // e.g. "feat: adaptive Commercial Gym session (45m)"
  aiReasoning: string;            // 2-3 sentence explanation from Groq
  exercises: ExerciseItem[];      // full exercise list at this version
  adaptations?: string[];         // ["Reduced volume for high soreness", ...]
  diffSummary: {
    addedCount: number;           // new exercises vs parent
    removedCount: number;         // removed exercises vs parent
    swappedCount: number;         // conflict-substituted exercises
  };
}
```

### 12.2 Version ID Scheme

```typescript
const major = 1;
const minor = list.length + 1;  // increments with each commit
const patch = 0;
const versionId = `v${major}.${minor}.${patch}`;
// Examples: v1.1.0, v1.2.0, v1.3.0
// Rollback: v{length+1}.0.0-rollback
```

### 12.3 Rollback Flow

```mermaid
sequenceDiagram
    participant U as User (version-control.tsx)
    participant API as POST /version-control/rollback
    participant VC as versionControlService

    U->>API: { targetVersionId: "v1.2.0" }
    API->>VC: rollbackToVersion(userId, "v1.2.0")
    VC->>VC: Find commit with versionId === "v1.2.0"
    VC->>VC: Create new commit: versionId="v1.5.0-rollback"\nexercises = target.exercises (restored)
    VC->>VC: Push to history list
    VC-->>API: RolledBack commit object
    API-->>U: { success: true, data: rolledBackCommit }
    U->>U: Show success toast, reload history
```

### 12.4 Version Control UI ([version-control.tsx](file:///d:/Fitai%20X/frontend/app/version-control.tsx))

- Timeline of all AI commits with version badges (v1.1.0, v1.2.0...)
- Each commit shows: author color (gold=AI, blue=User, red=Recovery), diff badges (+2 added, -1 removed)
- Tap any commit → `CommitDetailModal` showing full exercise list, AI reasoning, adaptations
- "Rollback to this version" button → POST `/version-control/rollback`

---

## 13. Data Types & Interfaces

### Frontend Types ([workoutService.ts](file:///d:/Fitai%20X/frontend/services/workoutService.ts))

```typescript
interface WorkoutExercise {
  id: number;
  name: string;
  sets: number;
  reps: string;           // "10-12"
  rest_sec: number;
  icon: string;
  tip: string;
  completed_sets: number;
  is_completed: boolean;
  targetMuscle?: string;
  video_url?: string;     // ExerciseDB CDN MP4 URL
  image_url?: string;     // Muscle bodymap image URL
  steps?: string[];       // Step-by-step form instructions
}

interface WorkoutRecord {
  id: number;
  title: string;
  duration_minutes: number;
  estimated_calories: number;
  target_muscles: string[];
  why_recommendation: string;
  ai_reasoning?: string;       // Groq 2-3 sentence reasoning
  readiness_score?: number;    // 0-100
  status: 'pending' | 'completed' | 'missed';
  session_date: string;
  feedback_energy?: number;    // 1-5
  feedback_soreness?: number;  // 1-5
  feedback_mood?: number;      // 1-5
  feedback_notes?: string;
  adaptations?: string[];
  exercises: WorkoutExercise[];
}

interface StreakDay {
  date: string;
  status: 'none' | 'pending' | 'completed' | 'missed';
}

interface TodayState {
  scenario: 'FIRST_DAY' | 'HAS_WORKOUT_TODAY' | 'COMPLETED_TODAY' | 'READY_TO_GENERATE';
  workout: WorkoutRecord | null;
  lastWorkout?: WorkoutRecord;
  streak: StreakDay[];
  totalWorkouts: number;
  missedCount: number;
}
```

### Backend Types ([workoutAiService.ts](file:///d:/Fitai%20X/backend/services/workoutAiService.ts))

```typescript
interface WorkoutGenerationContext {
  userName: string;
  gender?: string;
  goal: string;                  // "Muscle Gain & Hypertrophy"
  weightKg: number;
  equipment: string;             // "Commercial Gym"
  injuries: string[];            // ["None"] or ["knee", "shoulder"]
  timeCommitment: string;        // "45 mins"
  dayNumber: number;             // history.length (session number)
  missedDaysCount: number;
  lastWorkout?: { title, targetMuscles, exercises, durationMinutes };
  lastFeedback?: { energy, soreness, mood, notes };
  userExerciseLogs?: ExerciseLogEntry[];
  previousDaySummary?: { date, sleepHours, sleepEfficiency, hrvMs, soreness, readinessPercentage };
}

interface AdaptiveWorkoutPlan {
  title: string;
  durationMinutes: number;
  estimatedCalories: number;
  targetMuscles: string[];
  whyRecommendation: string;     // 1-sentence "why today"
  aiReasoning: string;           // 2-3 sentence detailed reasoning
  readinessScore: number;
  exercises: GeneratedExercise[];
  commitMessage: string;         // "feat: adaptive Commercial Gym session (45m)"
  adaptations: string[];
  analysisSteps: string[];
}
```

---

## 14. Key Algorithms

### 14.1 Bio-Readiness Score (Local Engine — adaptiveAiEngine.ts)

The local engine (fallback, not Groq) computes readiness:

```typescript
const sleepFactor    = Math.min(sleepHours / 8, 1) * 35;     // max 35pts
const sorenessFactor = (10 - sorenessLevel) * 3.5;            // max 35pts
const stressFactor   = (10 - stressLevel) * 1.5;              // max 15pts
const calorieFactor  = Math.min(caloriesIn / targetCalories, 1) * 15; // max 15pts

readinessScore = Math.round(sleepFactor + sorenessFactor + stressFactor + calorieFactor);
// Score 0–100. < 50 = deload protocol, 50-75 = moderate, > 75 = full intensity
```

### 14.2 Streak Calendar Generation

```typescript
// Generates last N days with status
async getWorkoutStreak(userId, days = 7) {
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const workout = await getTodayWorkout(userId, dateStr);
    const status = !workout ? 'none'
      : workout.status === 'completed' ? 'completed'
      : workout.status === 'missed' ? 'missed'
      : 'pending';
    
    streakDays.push({ date: dateStr, status });
  }
  return streakDays;
}
```

### 14.3 XP Leveling Formula

```typescript
// Level calculated from total XP (quadratic formula)
function calculateLevelData(xp: number) {
  let level = Math.floor((1 + Math.sqrt(1 + (8 * xp) / 50)) / 2);
  level = Math.max(1, Math.min(100, level));
  
  const xpCurrentLevelStart = 50 * level * (level - 1);
  const xpNextLevelStart = 50 * (level + 1) * level;
  const progressPct = Math.round(((xp - xpCurrentLevelStart) / (xpNextLevelStart - xpCurrentLevelStart)) * 100);
  
  // Level titles: Novice (1) → Bronze (5) → Silver (10) → Gold (15) → Platinum (20) → Diamond (30) → Grandmaster (50) → Elite Apex (75) → GODMODE (100)
}
// Workout completion awards: +5 XP (route) + +20 XP (markWorkoutComplete internal)
```

---

## 15. Configuration & API Keys

### Backend `.env` File Structure

```bash
# Server
PORT=5000

# PostgreSQL
DATABASE_URL=postgres://postgres:password@127.0.0.1:5433/fitaix

# Groq API Keys (round-robin rotation, up to 4)
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...
GROQ_API_KEY_3=gsk_...
GROQ_API_KEY_4=gsk_...

# AI Model
DEFAULT_MODEL=llama-3.3-70b-versatile

# ExerciseDB V2 API Keys (round-robin rotation, up to 7)
RAPIDAPI_EXERCISEDB_KEY_1=...
RAPIDAPI_EXERCISEDB_KEY_2=...
RAPIDAPI_EXERCISEDB_KEY_3=...
RAPIDAPI_EXERCISEDB_KEY_4=...
RAPIDAPI_EXERCISEDB_KEY_5=...
EXERCISEDB_API_KEY=...
RAPIDAPI_KEY=...

# ExerciseDB Host
RAPIDAPI_EXERCISEDB_HOST=edb-with-videos-and-images-by-ascendapi.p.rapidapi.com

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

### Frontend `.env` (optional override)

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
# If not set, auto-resolved from Expo's hostUri (LAN IP for physical device)
```

---

## Feature Interaction Summary

```mermaid
graph LR
    Onboarding["Onboarding\n(equipment, goal, time,\ninjuries, weight)"] -->|Profile saved to DB| Generate

    Generate["POST /generate\n(Groq AI + ExerciseDB)"] -->|Workout + exercises saved| Track

    Track["Exercise Tracking\n(toggle is_completed)"] -->|All exercises done| Complete

    Complete["POST /complete\n(feedback: energy/soreness/mood)"] -->|Stored as lastFeedback| NextGenerate

    NextGenerate["Next Day:\nGET /today → READY_TO_GENERATE\nGroq reads lastFeedback"] -->|Adapts volume/intensity| Generate

    Recovery["Recovery Log\n(sleep, HRV, soreness)"] -->|previousDaySummary fed to Groq| Generate

    ExerciseLogs["Exercise Logs\n(weight × reps saved)"] -->|Progressive overload context| Generate

    Generate -->|git commit| VersionControl["Version Control\n(view history, rollback)"]
```

> [!IMPORTANT]
> The workout generation is a **closed feedback loop**. Every workout completion feeds forward:
> - `lastFeedback` (energy/soreness/mood) → Groq prompt context
> - `previousDaySummary` (from recovery_logs) → volume adjustment
> - `userExerciseLogs` (weight × reps) → progressive overload scaling
> - `lastWorkout.targetMuscles` → muscle group rotation (prevent consecutive same group)

---

## 16. ExerciseDB Video Pipeline — Complete Deep Dive

This section documents exactly how HD exercise videos are fetched, matched, validated, stored, and played in FitAI X from end to end.

---

### 16.1 What Data Comes From ExerciseDB

The ExerciseDB V2 API (hosted on RapidAPI at `edb-with-videos-and-images-by-ascendapi.p.rapidapi.com`) provides the following per exercise:

| Field | Type | Example |
|-------|------|---------|
| `exerciseId` | string | `"0001"` |
| `name` | string | `"Bench Press"` |
| `videoUrl` | string | `"https://cdn.exercisedb.dev/video/bench-press.mp4"` |
| `imageUrl` | string | `"https://cdn.exercisedb.dev/image/bench-press.jpg"` |
| `imageUrls` | object | `{ "720p": "...", "480p": "...", "360p": "..." }` |
| `instructions` | string[] | `["Step:1 Lie flat on bench...", "Step:2 Grip bar..."]` |
| `exerciseTips` | string[] | `["Keep shoulder blades retracted throughout the movement"]` |
| `targetMuscles` | string[] | `["pectoralis major"]` |
| `secondaryMuscles` | string[] | `["triceps brachii", "anterior deltoid"]` |
| `bodyParts` | string[] | `["chest"]` |
| `overview` | string | Long description paragraph |

---

### 16.2 Where Video Fetching Happens (Two Trigger Points)

Videos are fetched from ExerciseDB at **two distinct moments** in the system:

```mermaid
graph TD
    T1["🔴 Trigger 1: POST /generate\n(workoutAiService.ts)\nAfter Groq returns exercise names,\neach exercise is immediately enriched\nbefore saving to DB"]
    T2["🟡 Trigger 2: GET /today\n(workoutRoutes.ts)\nWhen loading today's workout,\nexercises missing video_url\nare re-enriched on-the-fly"]

    T1 -->|"videoUrl saved to DB with exercise row"| DB["exercises table\n(video_url TEXT column)"]
    T2 -->|"video_url patched on response object\n(not re-saved to DB)"| RES["API response to frontend"]
```

**Why two triggers?**  
- **Trigger 1** (generation time): Videos are fetched and **saved to PostgreSQL** with each exercise row. This is the primary enrichment.
- **Trigger 2** (load time): A safety net — if an exercise was saved without a valid `video_url` (e.g. API was down at generation time), it gets re-enriched every time the workout is loaded.

---

### 16.3 Trigger 1 — At Generation Time (workoutAiService.ts L313–380)

After Groq returns a list of exercise names, the enrichment loop runs:

```typescript
// File: backend/services/workoutAiService.ts  Lines 313–380

const enrichedExercises: GeneratedExercise[] = [];

// ── STEP 1: Try each AI-generated exercise ──────────────────────────
for (const ex of resultPlan.exercises) {

  // Equipment filter — skip if exercise doesn't match user's setup
  const isAllowedByEquipment = allowedSet.has(ex.name.toLowerCase()) || eqCat === 'full';
  if (!isAllowedByEquipment) {
    console.warn(`⚠️ Skipping "${ex.name}" — equipment mismatch (${ctx.equipment})`);
    continue;
  }

  // Fetch video + image + instructions from ExerciseDB
  const edbData = await fetchExerciseDbDetails(ex.name);

  if (edbData.videoUrl) {  // Only add if we got a real video URL
    enrichedExercises.push({
      ...ex,                           // Groq's: sets, reps, restSec, icon, tip
      name: edbData.name || ex.name,   // Use ExerciseDB's canonical name
      videoUrl: edbData.videoUrl,      // ← HD video URL from ExerciseDB CDN
      imageUrl: edbData.imageUrl,      // ← Muscle bodymap image
      steps: edbData.steps.length > 0 ? edbData.steps : ex.steps,  // Step instructions
      targetMuscle: edbData.targetMuscle || ex.targetMuscle,
      tip: edbData.tip || ex.tip,
    });
  } else {
    // No video found for this exercise — skip it entirely
    console.warn(`⚠️ No video for "${ex.name}" — skipping exercise`);
  }

  if (enrichedExercises.length >= targetExercises) break; // Got enough exercises
}

// ── STEP 2: Fallback — if AI exercises didn't yield enough videos ──
if (enrichedExercises.length < targetExercises) {
  console.log(`⚡ Fallback: querying ExerciseDB for filler exercises...`);

  for (const candidateName of allowedList) {  // Walk through VERIFIED_* list
    if (enrichedExercises.length >= targetExercises) break;
    if (enrichedExercises.some(e => e.name.toLowerCase() === candidateName.toLowerCase())) continue;

    const edbData = await fetchExerciseDbDetails(candidateName);
    if (edbData.videoUrl) {
      enrichedExercises.push({
        name: edbData.name,
        sets: 3, reps: '10-12', restSec: 60, icon: 'dumbbell',
        tip: edbData.tip || `Perform ${edbData.name} under strict controlled form.`,
        targetMuscle: edbData.targetMuscle || 'Target Muscle',
        videoUrl: edbData.videoUrl,
        imageUrl: edbData.imageUrl,
        steps: edbData.steps,
      });
    }
  }
}

// ── Final guard ──────────────────────────────────────────────────────
if (enrichedExercises.length === 0) {
  throw new Error('FitAI Engine Error: Could not load verified exercise videos...');
}

return enrichedExercises.slice(0, targetExercises);
```

---

### 16.4 Trigger 2 — At Load Time (workoutRoutes.ts L38–55)

Every time `GET /api/workout/today` is called, exercises are re-checked:

```typescript
// File: backend/routes/workoutRoutes.ts  Lines 38–55

if (todayWorkout) {
  for (const ex of todayWorkout.exercises) {

    // Re-enrich ONLY if video_url is missing OR not a real ExerciseDB URL
    if (!ex.video_url || !ex.video_url.includes('exercisedb.dev')) {

      const edbData = await fetchExerciseDbDetails(ex.name);

      if (edbData.videoUrl) {
        // Patch the exercise object in-memory (not saved back to DB)
        ex.video_url   = edbData.videoUrl;
        ex.videoUrl    = edbData.videoUrl;   // camelCase alias for frontend
        ex.image_url   = edbData.imageUrl;
        ex.imageUrl    = edbData.imageUrl;
        ex.steps       = edbData.steps.length > 0 ? edbData.steps : ex.steps;
        ex.target_muscle = edbData.targetMuscle;
        ex.targetMuscle  = edbData.targetMuscle;
        ex.tip         = edbData.tip || ex.tip;
      }
    }
  }
}
```

> [!NOTE]
> The condition `!ex.video_url.includes('exercisedb.dev')` is the domain guard. Any URL not from the official ExerciseDB CDN domain triggers a re-fetch. This prevents stale/wrong URLs from persisting.

---

### 16.5 Inside fetchExerciseDbDetails() — Step-by-Step

The full call chain inside [exerciseDbService.ts](file:///d:/Fitai%20X/backend/services/exerciseDbService.ts) for a single exercise:

```mermaid
sequenceDiagram
    participant Caller as workoutAiService.ts
    participant EDB as exerciseDbService.ts
    participant API1 as ExerciseDB /search
    participant API2 as ExerciseDB /exercises/{id}

    Caller->>EDB: fetchExerciseDbDetails("Bench Press")

    Note over EDB: Step 1: Sanitize query name
    EDB->>EDB: sanitizeSearchQuery("Bench Press")<br/>→ strips "AI", "Hypertrophy", etc.<br/>→ result: "Bench Press"

    Note over EDB: Step 2: GET key from rotation pool
    EDB->>EDB: getNextExerciseDbKey()<br/>→ RAPIDAPI_EXERCISEDB_KEY_1

    EDB->>API1: GET /api/v1/exercises/search?search=Bench+Press<br/>Headers: x-rapidapi-key, x-rapidapi-host

    API1-->>EDB: Array of candidate exercises<br/>[{name:"Bench Press", exerciseId:"0001",...},<br/> {name:"Close Grip Bench Press",...},<br/> {name:"Smith Machine Bench Press",...}]

    Note over EDB: Step 3: Score all candidates
    EDB->>EDB: scoreCandidate("bench press", "bench press") = 1000<br/>scoreCandidate("bench press", "close grip bench press") = 550<br/>scoreCandidate("bench press", "smith machine bench press") = 450

    Note over EDB: Step 4: Threshold check
    EDB->>EDB: topMatch.score (1000) >= 250 ✅<br/>Accept "Bench Press" (ID: 0001)

    Note over EDB: Step 5: Fetch full detail (if videoUrl missing)
    EDB->>API2: GET /api/v1/exercises/0001<br/>Headers: x-rapidapi-key, x-rapidapi-host

    API2-->>EDB: Full exercise detail:<br/>{ videoUrl: "https://cdn.exercisedb.dev/video/bench-press.mp4",<br/>  imageUrl: "https://cdn.exercisedb.dev/image/bench-press-720p.jpg",<br/>  instructions: ["Step:1 Lie flat...", "Step:2 Grip bar..."],<br/>  exerciseTips: ["Retract shoulder blades throughout"],<br/>  targetMuscles: ["pectoralis major"],<br/>  secondaryMuscles: ["triceps brachii"] }

    Note over EDB: Step 6: Extract + clean fields
    EDB->>EDB: Strip "Step:N " prefix from instructions<br/>Title-case targetMuscle<br/>Select highest-res imageUrl (720p → 480p → 360p)

    EDB-->>Caller: ExerciseDbResult {<br/>  exerciseId: "0001",<br/>  name: "Bench Press",<br/>  videoUrl: "https://cdn.exercisedb.dev/video/bench-press.mp4",<br/>  imageUrl: "https://cdn.exercisedb.dev/image/...",<br/>  steps: ["Lie flat on bench...", "Grip bar..."],<br/>  targetMuscle: "Pectoralis Major",<br/>  secondaryMuscles: ["Triceps Brachii"],<br/>  tip: "Retract shoulder blades throughout"<br/>}
```

---

### 16.6 sanitizeSearchQuery() — Why It Exists

Groq sometimes generates exercise names with AI-style prefixes that would break ExerciseDB search. This function strips them:

```typescript
// File: exerciseDbService.ts  L59–65

function sanitizeSearchQuery(inputName: string): string {
  return inputName
    .replace(/\b(ai|focus|hypertrophy|power|superset|warmup|max|heavy|tempo|pro|elite|protocol)\b/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')  // strip special chars
    .replace(/\s+/g, ' ')              // collapse whitespace
    .trim();
}

// Examples:
// "AI Hypertrophy Bench Press"   → "Bench Press"
// "Power Squat Protocol"         → "Squat"
// "Pro Tempo Romanian Deadlift"  → "Romanian Deadlift"
// "Warmup Push-up"               → "Push up"
```

---

### 16.7 scoreCandidate() — Preventing Wrong Video Matches

This algorithm prevents false positives — e.g. showing the "Arnold Press" video for a "Leg Press" search.

```typescript
// File: exerciseDbService.ts  L19–54

function scoreCandidate(targetName: string, candidateName: string): number {
  // Normalize: lowercase + remove punctuation + collapse spaces
  const t = normalize(targetName);  // "bench press"
  const c = normalize(candidateName);

  // === SCORING RULES ===

  if (c === t)          return 1000;   // Exact match — immediate accept

  if (c.startsWith(t))  score += 500;  // "bench press" starts with "bench press" → accept
  if (t.startsWith(c))  score += 400;  // target starts with candidate → good

  // Word overlap
  const matches = targetWords.filter(w => candidateWords.includes(w));
  score += matches.length * 100;           // +100 per matching word
  if (matches.length === all target words) score += 200;  // all words matched → bonus

  // === PENALTY RULES ===

  // Missing key words from target → heavy deduction
  for (const tw of targetWords) {
    if (tw not in candidate words) score -= 250;
  }

  // Unwanted prop exercise variants
  if (candidate has "towel" and target does not) score -= 300;
  if (candidate has "one arm" and target does not) score -= 150;
  if (candidate has "single leg" and target does not) score -= 150;
  if (candidate has "chair" or "door" or "bed") score -= 300;

  return score;
}

// THRESHOLD: score must be >= 250 to accept
// Below 250 → reject entirely (returns empty ExerciseDbResult)
```

**Score examples for query "bench press":**

| Candidate Name | Score | Decision |
|---------------|-------|----------|
| `"bench press"` | 1000 | ✅ Exact match |
| `"incline bench press"` | 700 | ✅ Accept |
| `"close grip bench press"` | 600 | ✅ Accept |
| `"smith machine bench press"` | 550 | ✅ Accept |
| `"arnold press"` | -150 | ❌ Rejected — "bench" missing |
| `"leg press"` | -150 | ❌ Rejected — "bench" missing |
| `"one arm bench press"` | 450 | ✅ Accept (if target includes "one") |

---

### 16.8 Key Rotation Pool — Preventing Rate Limiting

ExerciseDB has per-key rate limits. FitAI X maintains a **pool of up to 7 RapidAPI keys** that rotate in round-robin fashion:

```typescript
// File: backend/core/config.ts  L41–67

const exerciseDbKeys = [
  process.env.RAPIDAPI_EXERCISEDB_KEY_1,   // Primary key
  process.env.RAPIDAPI_EXERCISEDB_KEY_2,
  process.env.RAPIDAPI_EXERCISEDB_KEY_3,
  process.env.RAPIDAPI_EXERCISEDB_KEY_4,
  process.env.RAPIDAPI_EXERCISEDB_KEY_5,
  process.env.EXERCISEDB_API_KEY,          // Legacy key alias
  process.env.RAPIDAPI_KEY,               // Generic RapidAPI key
].filter(Boolean);

let edbRotationIndex = 0;

export function getNextExerciseDbKey() {
  const keyIndex = edbRotationIndex % exerciseDbKeys.length;
  const apiKey = exerciseDbKeys[keyIndex];
  edbRotationIndex++;   // Advance for next call
  return { apiKey, keyIndex, totalKeys: exerciseDbKeys.length };
}
```

**Active keys from `.env`:**
```bash
RAPIDAPI_EXERCISEDB_KEY_1=428fe91a9bmsha4c506b5dfa775dp1eddf3jsn913b45388e3e
RAPIDAPI_EXERCISEDB_KEY_2=31b85e7fd3msh860f96a5c1eb87fp14e28ajsn4838fbac7adb
RAPIDAPI_EXERCISEDB_KEY_3=31b85e7fd3msh860f96a5c1eb87fp14e28ajsn4838fbac7adb  (duplicate)
RAPIDAPI_EXERCISEDB_KEY_4=31b85e7fd3msh860f96a5c1eb87fp14e28ajsn4838fbac7adb  (duplicate)
RAPIDAPI_EXERCISEDB_KEY_5=31b85e7fd3msh860f96a5c1eb87fp14e28ajsn4838fbac7adb  (duplicate)
RAPIDAPI_EXERCISEDB_HOST=edb-with-videos-and-images-by-ascendapi.p.rapidapi.com
```

**Key retry loop:** If key #1 fails (HTTP 429 / rate-limited / network error), the next key is automatically tried:

```typescript
let attempts = 0;
while (attempts < totalKeys) {
  const { apiKey, keyIndex } = getNextExerciseDbKey();
  try {
    const res = await fetch(`https://${rapidApiHost}/api/v1/exercises/search?...`, {
      headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': rapidApiHost }
    });
    if (res.ok) { /* process and return */ break; }
    else console.warn(`Key #${keyIndex+1} HTTP ${res.status}`);
  } catch (err) {
    console.warn(`Key #${keyIndex+1} error: ${err.message}`);
  }
  attempts++;  // Try next key
}
```

---

### 16.9 How Video URL Flows Through the System

```mermaid
flowchart LR
    EDB["ExerciseDB CDN\nhttps://cdn.exercisedb.dev/\nvideo/bench-press.mp4"]

    subgraph BACKEND["Backend"]
        Fetch["exerciseDbService.ts\nfetchExerciseDbDetails()"]
        Save["database.ts\nsaveWorkout()\nINSERT exercises(video_url=...)"]
        Load["workoutRoutes.ts\nGET /today\npatch ex.video_url if missing"]
    end

    subgraph FRONTEND["Frontend"]
        Service["workoutService.ts\ngetToday() → workout.exercises[]"]
        Clean["workout.tsx\ncleanMediaUrl(ex.video_url)"]
        Player["ExerciseVideoModal\n<Video source={{uri: videoUrl}} />"]
        Web["ExerciseVideoModal\n<video src={videoUrl} />"]
    end

    EDB -->|"MP4 URL in API response"| Fetch
    Fetch -->|"videoUrl in GeneratedExercise"| Save
    Save -->|"video_url stored in PG exercises table"| Load
    Load -->|"exercises[] in JSON response"| Service
    Service -->|"WorkoutExercise.video_url"| Clean
    Clean -->|"cleaned direct CDN URL"| Player
    Clean -->|"cleaned direct CDN URL"| Web
```

**URL is stored as a direct CDN link** (e.g. `https://cdn.exercisedb.dev/video/bench-press.mp4`) in the `exercises.video_url` column in PostgreSQL. No proxying happens by default.

---

### 16.10 cleanMediaUrl() — URL Sanitization on Frontend

Before sending the URL to the video player, [workout.tsx](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) calls `cleanMediaUrl()` to strip any accidentally double-wrapped proxy URLs:

```typescript
// File: workout.tsx  L311–330

function cleanMediaUrl(inputUrl?: string): string {
  if (!inputUrl) return '';
  let url = inputUrl.trim();

  // Recursively unwrap any proxy wrappers
  // e.g. "http://localhost:5000/api/workout/media-proxy?url=https%3A%2F%2Fcdn.exercisedb.dev%2F..."
  // becomes → "https://cdn.exercisedb.dev/..."
  while (url.includes('media-proxy?') || url.includes('video-proxy?')) {
    const match = url.match(/url=([^&]+)/);
    if (match?.[1]) {
      try { url = decodeURIComponent(match[1]); }
      catch { url = match[1]; }
    } else break;
  }

  return url;  // Always returns a direct URL
}
```

**Example transformations:**

| Input | Output |
|-------|--------|
| `"https://cdn.exercisedb.dev/video/push-up.mp4"` | `"https://cdn.exercisedb.dev/video/push-up.mp4"` (unchanged) |
| `"http://localhost:5000/api/workout/media-proxy?url=https%3A%2F%2Fcdn.exercisedb.dev%2Fvideo%2Fpush-up.mp4"` | `"https://cdn.exercisedb.dev/video/push-up.mp4"` |

---

### 16.11 Media Proxy Route — /video-proxy & /media-proxy

[workoutRoutes.ts](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) exposes a **media proxy** endpoint as a fallback (e.g. for CORS issues on web):

```typescript
// File: workoutRoutes.ts  L357–387
// Available at both GET /api/workout/video-proxy and GET /api/workout/media-proxy

router.get(['/video-proxy', '/media-proxy'], async (req, res) => {
  const directUrl = req.query.url;   // e.g. ?url=https://cdn.exercisedb.dev/video/...

  const reqHeaders = {};
  // Pass Range header for video seeking (byte-range requests)
  if (req.headers.range) reqHeaders['Range'] = req.headers.range;

  const upstreamRes = await fetch(directUrl, { headers: reqHeaders });

  // Forward only safe media headers
  ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control']
    .forEach(h => res.setHeader(h, upstreamRes.headers.get(h)));

  // Stream the video bytes back to the client
  const buf = await upstreamRes.arrayBuffer();
  res.send(Buffer.from(buf));
});
```

> [!NOTE]
> The proxy supports **HTTP Range requests** (`Range: bytes=0-`, `Range: bytes=1024-2048`), enabling video seeking (scrubbing to a timestamp) to work correctly on both iOS and Android.

---

### 16.12 Video Player Implementation (Platform-Specific)

**Native (iOS / Android) — expo-av Video component:**

```tsx
// File: workout.tsx  L445–480
import { Video, ResizeMode } from 'expo-av';

<Video
  ref={videoRef}
  source={{ uri: videoUrl }}         // Direct ExerciseDB CDN MP4 URL
  style={{ width: '100%', height: 210, borderRadius: 14 }}
  useNativeControls                  // Show play/pause/seek controls
  resizeMode={ResizeMode.CONTAIN}    // Letter-box fit
  isLooping                          // Loop indefinitely
  shouldPlay={true}                  // Autoplay on open
  isMuted={true}                     // Muted by default (gym environment)
  onLoad={() => setLoadingVideo(false)}
  onPlaybackStatusUpdate={(status) => {
    if (status.isLoaded && !status.isBuffering) setLoadingVideo(false);
    if (status.error) setVideoError(String(status.error));
  }}
  onError={(e) => {
    setVideoError(e.message);
    setLoadingVideo(false);
  }}
/>
```

**Web — HTML5 `<video>` element:**

```tsx
// File: workout.tsx  L429–443
<video
  key={videoUrl}                     // Forces remount on URL change
  src={videoUrl}                     // Direct MP4 URL
  controls                           // Browser-native controls
  autoPlay
  muted
  loop
  playsInline                        // iOS Safari: no fullscreen forced
  onLoadedData={() => setLoadingVideo(false)}
  onCanPlay={() => setLoadingVideo(false)}
  style={{ width: '100%', height: 210, borderRadius: 14, objectFit: 'contain' }}
/>
```

**Loading State UX:**

```tsx
// 10-second timeout safety net:
useEffect(() => {
  if (visible) {
    setLoadingVideo(true);
    const timer = setTimeout(() => {
      setLoadingVideo(false);  // Stop spinner after 10s regardless
    }, 10000);
    return () => clearTimeout(timer);
  }
}, [visible, exercise]);
```

---

### 16.13 Image (Muscle Bodymap) Handling

ExerciseDB also provides a **muscle bodymap image** showing which muscles are activated. This is handled alongside the video:

```typescript
// In exerciseDbService.ts:
const imageUrl = detail.imageUrl 
  || detail.imageUrls?.['720p']    // Try highest resolution first
  || detail.imageUrls?.['480p']
  || detail.imageUrls?.['360p']
  || '';
```

In the frontend modal ([workout.tsx](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) L364–367):

```tsx
// Resolve bodymap URL (supports multiple field name variants from DB)
const rawBodymap = cleanMediaUrl(
  exercise.image_url   ||   // snake_case (from PostgreSQL column)
  exercise.imageUrl    ||   // camelCase (from API response)
  exercise.bodymap_url ||   // legacy field
  exercise.bodymapUrl       // legacy camelCase
);
```

The bodymap is then displayed below the video player:

```tsx
{resolvedBodymap ? (
  <View style={evmS.bodymapCard}>
    <Text style={evmS.bodymapTag}>🎯 TARGETED MUSCLE BODYMAP</Text>
    <Image
      source={{ uri: resolvedBodymap }}
      style={{ width: '100%', height: 160, borderRadius: 10, resizeMode: 'contain' }}
    />
  </View>
) : null}
```

---

### 16.14 Full Video Fetch Failure Handling

```mermaid
flowchart TD
    START["fetchExerciseDbDetails(exerciseName)"]
    
    START --> K{Keys available?}
    K -->|No keys configured| FB["Return fallback object\n(empty videoUrl)"]
    K -->|Keys exist| SANITIZE["sanitizeSearchQuery()"]
    
    SANITIZE --> SEARCH["GET /search?search=..."]
    SEARCH --> HTTP{HTTP response?}
    HTTP -->|"429 Rate Limited"| NEXTKEY["Try next key in pool"]
    HTTP -->|"Network Error"| NEXTKEY
    HTTP -->|"200 OK"| RESULTS{Results array?}
    NEXTKEY --> K
    
    RESULTS -->|"Empty array"| FB
    RESULTS -->|"Has candidates"| SCORE["scoreCandidate() all results\nSort by score DESC"]
    
    SCORE --> THRESH{topScore >= 250?}
    THRESH -->|"No — below threshold"| FB
    THRESH -->|"Yes — good match"| DETAIL["GET /exercises/{id}"]
    
    DETAIL --> VIDEO{videoUrl in response?}
    VIDEO -->|"No video URL"| FB
    VIDEO -->|"Has URL"| ENRICH["Extract: videoUrl, imageUrl,\nsteps, targetMuscle, tip"]
    
    ENRICH --> SUCCESS["Return ExerciseDbResult ✅"]
    
    FB --> HANDLED["Exercise skipped in enrichment loop\n(Groq fallback exercise used instead)"]
```

---

### 16.15 What Gets Stored in the Database

After enrichment, the `exercises` INSERT into PostgreSQL includes:

```sql
INSERT INTO exercises (
  workout_id,
  name,           -- Canonical ExerciseDB name (e.g. "Bench Press")
  sets,           -- From Groq (e.g. 4)
  reps,           -- From Groq (e.g. "8-10")
  rest_sec,       -- From Groq (e.g. 60)
  icon,           -- From Groq (e.g. "dumbbell")
  tip,            -- From ExerciseDB exerciseTips[0]
  target_muscle,  -- From ExerciseDB targetMuscles[0] (title-cased)
  video_url,      -- ← Direct MP4 URL from ExerciseDB CDN
  steps,          -- ← TEXT[] of cleaned instruction strings
  completed_sets
) VALUES ($1, $2, ..., $9_video_url, $10_steps, 0)
```

**The `video_url` column persists the raw CDN URL.** This means:
- First app open after generation: video URL already in DB → no ExerciseDB API call needed.
- `GET /today` checks: `if (!ex.video_url || !ex.video_url.includes('exercisedb.dev'))` — only fetches again if URL is missing or invalid.

---

### 16.16 ExerciseDB Video Pipeline Summary

```mermaid
flowchart LR
    subgraph "1 — Groq generates name"
        G["Groq AI\nreturns: 'Bench Press'"]
    end
    subgraph "2 — ExerciseDB Search"
        S1["GET /search?search=bench+press\n→ 15 candidates"]
        S2["scoreCandidate() each\n→ top score: 1000"]
        S3["Threshold 250 ✅"]
    end
    subgraph "3 — ExerciseDB Detail"
        D["GET /exercises/0001\n→ videoUrl, imageUrl,\n   instructions, tips"]
    end
    subgraph "4 — Save to DB"
        DB["INSERT exercises\nvideo_url = 'https://cdn.exercisedb.dev/...'\nsteps = ['Lie flat...', 'Grip bar...']\ntarget_muscle = 'Pectoralis Major'"]
    end
    subgraph "5 — Serve to Frontend"
        API["GET /today\n→ exercises[] with video_url"]
    end
    subgraph "6 — Play in App"
        CLEAN["cleanMediaUrl()\nstrips proxy wrappers"]
        PLAYER["expo-av Video\nor HTML5 video\nautoplay, muted, loop"]
    end

    G --> S1 --> S2 --> S3 --> D --> DB --> API --> CLEAN --> PLAYER
```

> [!TIP]
> To add more exercise videos, simply add the exercise name to one of the `VERIFIED_*` lists in [workoutAiService.ts](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) and ensure ExerciseDB has a matching record. The scoring and enrichment system handles everything else automatically.

---

## 17. Complete Workout Lifecycle — Step-by-Step Numbered Flow

This section describes every single thing that happens, in exact order, from the moment the user opens the Workout tab to the moment their session is marked complete. Each step tells you **what happens**, **which file handles it**, and **where the key code lives**.

---

### PHASE 1 — App Opens, Workout Tab Loads

---

**Step 1 — User taps the Workout tab**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L666
- **What happens:** React Native renders `WorkoutScreen`. The `useEffect` hook fires immediately calling `load()`.

---

**Step 2 — Frontend calls `workoutService.getToday()`**
- **File:** [`frontend/services/workoutService.ts`](file:///d:/Fitai%20X/frontend/services/workoutService.ts) — L101–107
- **What happens:** A `fetch()` request is sent to `GET /api/workout/today` with `Authorization: Bearer <token>` and `x-user-id: <userId>` headers.

```
GET http://192.168.x.x:5000/api/workout/today
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
  x-user-id: 3
```

---

**Step 3 — `authenticateToken` middleware validates the request**
- **File:** [`backend/core/authMiddleware.ts`](file:///d:/Fitai%20X/backend/core/authMiddleware.ts) — L11–34
- **What happens:** Checks `Authorization` header for a valid JWT. If valid, sets `req.user = { userId, email }`. Falls back to `x-user-id` header if no Bearer token. Rejects with `401` if neither present.

---

**Step 4 — `GET /today` route handler runs**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L13–75
- **What happens (in order):**

  - **4a.** `db.markMissedWorkoutsBeforeToday(userId)` — Any workout with `session_date < TODAY` and `status = 'pending'` is automatically flipped to `status = 'missed'` via `UPDATE workouts SET status='missed' WHERE...`
  - **4b.** `db.getWorkoutHistory(userId)` — Fetches all past workouts for this user from PostgreSQL `workouts` table (JOIN with `exercises`).
  - **4c.** `db.getWorkoutStreak(userId, 7)` — Generates the last 7 days as `[{ date, status }]` — used for the streak calendar on screen.
  - **4d.** `db.getTodayWorkout(userId)` — Queries `WHERE session_date = CURRENT_DATE ORDER BY id DESC LIMIT 1`.

---

**Step 5 — Scenario is determined (4 possible outcomes)**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L27–74

| Condition | Scenario returned |
|-----------|-------------------|
| `history.length === 0` | `FIRST_DAY` |
| `todayWorkout` exists AND `status = 'pending'` | `HAS_WORKOUT_TODAY` |
| `todayWorkout` exists AND `status = 'completed'` | `COMPLETED_TODAY` |
| No workout for today but history exists | `READY_TO_GENERATE` |

---

**Step 5a — (If `HAS_WORKOUT_TODAY` or `COMPLETED_TODAY`) — Live video enrichment check**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L38–55
- **What happens:** For every exercise in `todayWorkout.exercises`, if `ex.video_url` is missing or not from `exercisedb.dev` domain, it calls `fetchExerciseDbDetails(ex.name)` and patches `video_url`, `image_url`, `steps`, `target_muscle`, `tip` onto the exercise object before sending the response. This is a **safety re-enrichment** and does not write back to the DB.

---

**Step 6 — Response sent to frontend**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L58–74
- **What happens:** JSON response is sent:
```json
{
  "success": true,
  "scenario": "READY_TO_GENERATE",
  "workout": null,
  "lastWorkout": { "title": "Push Day", "target_muscles": ["Chest", "Triceps"], ... },
  "streak": [
    { "date": "2026-07-21", "status": "completed" },
    { "date": "2026-07-22", "status": "missed" },
    ...
  ],
  "totalWorkouts": 14,
  "missedCount": 1
}
```

---

**Step 7 — Frontend renders the correct UI state**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L741–966
- **What happens:** `setState(data)`, `setLoading(false)`. Based on `scenario`, the screen renders one of four views:
  - `FIRST_DAY` → Welcome hero card with "Generate My First Workout" button
  - `READY_TO_GENERATE` → Last session card + "Generate Today's Workout" button
  - `HAS_WORKOUT_TODAY` → Full workout plan with exercise list, progress bar, "Finish Session" button
  - `COMPLETED_TODAY` → Read-only exercise list + "Session Complete!" green banner

---

### PHASE 2 — User Generates a Workout

*(Triggered when user taps "Generate Today's Workout" or "Generate My First Workout")*

---

**Step 8 — `handleGenerate()` fires, `AIGenerationModal` appears**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L685–693
- **What happens:** `setGenerating(true)` makes the `AIGenerationModal` visible. This shows a 4-step animated timeline to the user while the actual API call runs in the background:
  - Step 1: "Analyzing Session History & Feedback"
  - Step 2: "Calculating Muscle Recovery & Fatigue Index"
  - Step 3: "Synthesizing Progressive Overload Plan"
  - Step 4: "Finalizing Customized Exercises & Form Tips"

---

**Step 9 — `workoutService.generate()` is called**
- **File:** [`frontend/services/workoutService.ts`](file:///d:/Fitai%20X/frontend/services/workoutService.ts) — L109–118
- **What happens:** `fetch()` sends `POST /api/workout/generate` with auth headers. No body needed — all context is read server-side.

```
POST http://192.168.x.x:5000/api/workout/generate
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
  x-user-id: 3
  Content-Type: application/json
```

---

**Step 10 — `POST /generate` route collects ALL context data from DB**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L78–134
- **What happens (in exact order):**

  - **10a.** `db.getUser(userId)` — Fetches `name, gender, goal, weight_kg, equipment, injuries, time_commitment` from `users` table.
  - **10b.** `db.getWorkoutHistory(userId, 20)` — Gets last 20 sessions. First record (`history[0]`) = `lastWorkout`.
  - **10c.** Builds `lastFeedback` object from `lastWorkout.feedback_energy/soreness/mood/notes` — **only if** that last workout's `status === 'completed'`.
  - **10d.** `db.getWorkoutStreak(userId, 7)` — Gets 7-day streak. Counts consecutive `missed` days going backwards to compute `missedDaysCount`.
  - **10e.** `db.getUserExerciseLogs(userId, 20)` — Gets last 20 weight × rep records from `exercise_logs` table (used for progressive overload).
  - **10f.** `db.getLatestRecovery(userId)` — Gets most recent record from `recovery_logs` (sleep, HRV, readiness %).
  - **10g.** Assembles the **`WorkoutGenerationContext`** object with all the above data.

```typescript
// Interface defined in:
// File: backend/services/workoutAiService.ts — L4–44
interface WorkoutGenerationContext {
  userName, gender, goal, weightKg, equipment, injuries,
  timeCommitment, dayNumber,      // history.length = session number
  missedDaysCount,
  lastWorkout?,                   // title, targetMuscles, exercises[], durationMinutes
  lastFeedback?,                  // energy, soreness, mood, notes
  userExerciseLogs?,              // [{exercise_name, weight_kg, reps_achieved, ...}]
  previousDaySummary?,            // sleepHours, hrvMs, soreness, readinessPercentage
}
```

---

**Step 11 — `generateAdaptiveWorkoutWithGroq(ctx)` is called**
- **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — L272–388
- **What happens:** This is the main AI engine function. It orchestrates Groq + ExerciseDB.

---

**Step 12 — `getTimeBasedConfig()` calculates target exercise count**
- **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — L107–136
- **What happens:** Parses the user's `time_commitment` setting (e.g. `"45 mins"`) and determines:

| Time Selected | Target Exercises | Duration |
|--------------|-----------------|----------|
| ≤ 20 mins | 3 exercises | 20 mins |
| ≤ 35 mins | 4 exercises | 30 mins |
| ≤ 50 mins | 5 exercises | 45 mins |
| > 50 mins | 6 exercises | 60 mins |

If `lowEnergy` (feedback_energy ≤ 2) OR `highSoreness` (feedback_soreness ≥ 4): **−1 exercise**, **−10 mins**.

---

**Step 13 — `buildAdaptivePrompt(ctx)` constructs the Groq prompt**

> 🔴 **THE GROQ PROMPT IS BUILT IN:**  
> **[`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — Function `buildAdaptivePrompt()` at Line 138–270**

- **What happens:** The function assembles a large text prompt by reading all fields in `ctx`. Here is the exact build order:

**13a. Determine flags from context:**
```
isFirstDay        = ctx.dayNumber === 0
isOneWeekAdapt    = ctx.dayNumber >= 7
hasMissedDays     = ctx.missedDaysCount > 0
highSoreness      = lastFeedback.soreness >= 4
lowEnergy         = lastFeedback.energy <= 2
highEnergy        = lastFeedback.energy >= 4
```

**13b. Build `contextBlock` (adaptive instructions):**

- IF `isFirstDay`:
  - → *"Design a welcoming, balanced Full Body introductory session..."*

- IF `hasMissedDays`:
  - → *"The user missed N day(s). Reduce total volume by ~20%..."*

- IF `lastWorkout` exists:
  - → *"PREVIOUS SESSION: 'Push Day' targeting [Chest, Triceps]. CRITICAL RULE: DO NOT repeat these muscle groups..."*

- IF `lastFeedback` exists:
  - → *"PREVIOUS FEEDBACK: Energy 2/5, Soreness 4/5, Mood 3/5. User notes: 'shoulder tight'..."*

- IF `isOneWeekAdapt`:
  - → *"1-WEEK ESCALATION: Auto-increase +2.5kg or +1 set..."*

- IF `highSoreness`:
  - → *"HIGH SORENESS: Lower sets (2-3 max), extend rest (75-90s), no heavy axial loading..."*

- IF `lowEnergy`:
  - → *"LOW ENERGY: Keep session concise, 3-4 exercises max, moderate effort only..."*

- IF `highEnergy AND NOT highSoreness`:
  - → *"HIGH ENERGY: Apply progressive overload (+1 set or higher intensity)..."*

**13c. Build `prevSummaryBlock` (recovery data):**
```
PREVIOUS DAY RECOVERY SUMMARY (2026-07-26):
- Logged Sleep: 7.2 hrs (88% efficiency)
- Wearable HRV: 58 ms
- Muscle Soreness: Low
- Calculated Bio-Readiness: 74%
ADAPTATION DIRECTIVE: If readiness < 75% or sleep < 6.5h → lower volume 15-20%
```

**13d. Build `logsBlock` (progressive overload data):**
```
USER RECORDED EXERCISE LOGS & PERFORMANCE:
- "Bench Press": 80kg total weight (40kg bar + 40kg plates) × 8 reps
- "Pull-up": 15 bodyweight reps max
PROGRESSIVE OVERLOAD DIRECTIVE: Scale working weight/rep ranges based on these!
```

**13e. Determine equipment category + allowed exercise list:**
- `bodyweight` → Only from `VERIFIED_BODYWEIGHT_EXERCISES` (20 exercises)
- `dumbbell` → From `VERIFIED_DUMBBELL_EXERCISES` (30 exercises)
- `full` → From `VERIFIED_FULL_GYM_EXERCISES` (all exercises)

**13f. Build injury block:**
```
INJURY RESTRICTIONS: User has [knee, lower_back]. AVOID exercises stressing these areas!
```

**13g. Assemble final prompt string — this is literally the text sent to Groq:**
```
You are FitAI Pro, an elite strength & conditioning AI coach. Generate a dynamic 
JSON workout plan based strictly on these parameters:

User: Alex
Goal: Muscle Gain & Hypertrophy
Weight: 78kg
Equipment: Commercial Gym
EQUIPMENT MANDATE: Commercial Gym access — barbells, dumbbells, machines, and bodyweight exercises.
Time Selection (Onboarding): 45 mins -> Target Duration: 45 mins
Session #15

ALLOWED VERIFIED EXERCISES (Select ONLY from this list):
"Push-up", "Pull-up", "Squat", "Bench Press", "Arnold Press", "Lateral Raise", 
"Hammer Curl", "Romanian Deadlift", ...

USER RECORDED EXERCISE LOGS & PERFORMANCE:
- "Bench Press": 80kg × 8 reps
- "Pull-up": 12 bodyweight reps max
PROGRESSIVE OVERLOAD DIRECTIVE: Scale based on these!

ADAPTIVE CONTEXT & FEEDBACK:
PREVIOUS SESSION: "Push Day" targeting [Chest, Triceps]. CRITICAL RULE: DO NOT repeat [Chest, Triceps].
PREVIOUS FEEDBACK: Energy 3/5, Soreness 2/5, Mood 4/5.
HIGH ENERGY (4/5): Optimize progressive overload for maximum growth.

CRITICAL MANDATES:
1. EXERCISE COUNT: Generate EXACTLY 5 exercises (no more, no less).
2. EQUIPMENT MATCHING: Select ONLY from ALLOWED list above.

Return ONLY valid JSON: { "title": ..., "exercises": [...] }
```

---

**Step 14 — Groq AI API is called**
- **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — L288–307
- **File:** [`backend/core/config.ts`](file:///d:/Fitai%20X/backend/core/config.ts) — L22–33 (key rotation)
- **What happens:**

  - **14a.** `getNextGroqClient()` picks the next key from the rotation pool (`GROQ_API_KEY_1` through `GROQ_API_KEY_4`).
  - **14b.** `client.chat.completions.create()` is called with:
    ```
    model:       "llama-3.3-70b-versatile"
    temperature: 0.3        ← low = consistent, deterministic
    response_format: { type: "json_object" }   ← forces pure JSON output
    messages: [
      { role: "system", content: "You are FitAI Pro engine. Generate adaptive workout plans in valid JSON format only." },
      { role: "user",   content: <the full prompt from Step 13> }
    ]
    ```
  - **14c.** Groq returns a raw JSON string. It is parsed with `JSON.parse(content)` into `resultPlan`.

**Example Groq response:**
```json
{
  "title": "Back & Biceps Power Session",
  "durationMinutes": 45,
  "estimatedCalories": 382,
  "targetMuscles": ["Back", "Biceps"],
  "whyRecommendation": "Previous push day targeted chest/triceps; rotating to back & biceps for balanced hypertrophy.",
  "aiReasoning": "High energy reported — adding 1 extra set per exercise for progressive overload...",
  "readinessScore": 84,
  "commitMessage": "feat: adaptive Commercial Gym session (45m)",
  "adaptations": ["Rotated from push to pull muscle groups", "Added progressive overload set"],
  "analysisSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ..."],
  "exercises": [
    { "name": "Pull-up", "sets": 4, "reps": "8-10", "restSec": 60, "icon": "activity", "tip": "...", "targetMuscle": "Back" },
    { "name": "Dumbbell One Arm Bent-over Row", "sets": 4, "reps": "10-12", "restSec": 60, "icon": "dumbbell", "tip": "...", "targetMuscle": "Back" },
    { "name": "Hammer Curl", "sets": 3, "reps": "12-15", "restSec": 45, "icon": "zap", "tip": "...", "targetMuscle": "Biceps" },
    { "name": "Chin-ups", "sets": 3, "reps": "8-10", "restSec": 60, "icon": "target", "tip": "...", "targetMuscle": "Biceps" },
    { "name": "Romanian Deadlift", "sets": 3, "reps": "10-12", "restSec": 75, "icon": "flame", "tip": "...", "targetMuscle": "Hamstrings" }
  ]
}
```

---

**Step 15 — Equipment filter: Remove exercises that don't match user's gear**
- **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — L316–332
- **What happens:** Each exercise name from Groq is checked against the `allowedSet` (the `VERIFIED_*` list for the user's equipment category). If Groq hallucinated an exercise not in the list AND the equipment is not `full`, it is **skipped with a warning log**.

---

**Step 16 — ExerciseDB video enrichment loop (per exercise)**
- **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — L334–350
- **File:** [`backend/services/exerciseDbService.ts`](file:///d:/Fitai%20X/backend/services/exerciseDbService.ts) — L71–208

For **each** exercise that passed the equipment filter:

  - **16a.** `sanitizeSearchQuery("Pull-up")` → `"Pull up"` (strip AI words, punctuation)
  - **16b.** `getNextExerciseDbKey()` → picks next RapidAPI key from pool
  - **16c.** `GET https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/search?search=Pull+up`
  - **16d.** Response array is scored with `scoreCandidate()` — best match selected
  - **16e.** If `topMatch.score < 250` → exercise **rejected** (wrong video risk)
  - **16f.** If `bestCandidate` is missing `videoUrl`: `GET /api/v1/exercises/{exerciseId}` to fetch full detail
  - **16g.** Extract `videoUrl`, `imageUrl`, `steps[]`, `targetMuscle`, `tip` from detail response
  - **16h.** Exercise is added to `enrichedExercises[]` with all video data merged in

---

**Step 17 — Fallback: Fill remaining exercises from VERIFIED list**
- **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — L352–374
- **What happens:** If after the enrichment loop, `enrichedExercises.length < targetExercises` (e.g. Groq gave 5 but 2 had no video), the system walks through the `VERIFIED_*` allowed list and fetches any exercises not already included until the count is met.

---

**Step 18 — Final exercise list is sliced to exact target count**
- **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — L380
- **What happens:** `enrichedExercises.slice(0, targetExercises)` — ensures exactly 3 / 4 / 5 / 6 exercises are returned, no more.

---

**Step 19 — `AdaptiveWorkoutPlan` is returned to the route**
- **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts) — L382–388
- **What happens:** The complete plan object is returned with `durationMinutes` and `estimatedCalories` overridden by `getTimeBasedConfig()` values (not Groq's values — this ensures they always match the user's onboarding selection).

---

**Step 20 — Workout is saved to PostgreSQL**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L139–160
- **File:** [`backend/core/database.ts`](file:///d:/Fitai%20X/backend/core/database.ts) — L399–492
- **What happens:**
  - **20a.** `INSERT INTO workouts (user_id, title, duration_minutes, estimated_calories, target_muscles, why_recommendation, ai_reasoning, readiness_score, session_date)` — one row.
  - **20b.** For each exercise: `INSERT INTO exercises (workout_id, name, sets, reps, rest_sec, icon, tip, target_muscle, video_url, steps, completed_sets)` — one row per exercise.
  - **20c.** Returns `{ ...workout, exercises: savedExercises }` with all DB-assigned `id` values.

---

**Step 21 — Git-style commit saved to Version Control**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L162–189
- **File:** [`backend/services/versionControlService.ts`](file:///d:/Fitai%20X/backend/services/versionControlService.ts) — L30–73
- **What happens:** `versionControlService.commitNewVersion()` creates a new `WorkoutCommit` in the in-memory store with:
  - A version ID like `v1.15.0`
  - `parentVersionId` pointing to the previous commit
  - A diff summary: how many exercises were added/removed vs. last commit
  - `author: 'FitAI Engine'`
  - `commitMessage: "feat: adaptive Commercial Gym session (45m)"`

---

**Step 22 — Route responds to frontend**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L191–194
- **What happens:** Response sent:
```json
{
  "success": true,
  "data": {
    "id": 47,
    "title": "Back & Biceps Power Session",
    "duration_minutes": 45,
    "estimated_calories": 382,
    "readiness_score": 84,
    "ai_reasoning": "High energy reported — adding 1 extra set...",
    "adaptations": ["Rotated from push to pull...", "Added overload set"],
    "exercises": [
      { "id": 231, "name": "Pull-up", "sets": 4, "reps": "8-10", "rest_sec": 60, "video_url": "https://cdn.exercisedb.dev/video/pull-up.mp4", "steps": ["..."], ... },
      ...
    ]
  }
}
```

---

**Step 23 — Frontend receives the generated workout**
- **File:** [`frontend/services/workoutService.ts`](file:///d:/Fitai%20X/frontend/services/workoutService.ts) — L109–118
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L687–692
- **What happens:** `workoutService.generate()` returns `{ success: true, data: WorkoutRecord }`. `handleGenerate()` then calls `load()` again — re-fetching `GET /today` which now returns `scenario: 'HAS_WORKOUT_TODAY'` with the full workout. `setGenerating(false)` hides the `AIGenerationModal`.

---

### PHASE 3 — User Performs the Workout

---

**Step 24 — Workout plan is displayed on screen**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L845–950
- **What happens:** The screen renders:
  - **Hero card** — Title, target muscles, readiness badge, duration/calories/exercise count stats
  - **AI Reasoning box** — `workout.ai_reasoning` text in gold
  - **Adaptation tags** — `workout.adaptations[]` as pill badges
  - **Progress bar** — `completedExercises / totalExercises` percentage
  - **Exercise list** — One `ExerciseCard` per exercise

---

**Step 25 — User taps "▶ Video & Steps" on an exercise card**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L628–632, L914–916
- **What happens:** `setSelectedExercise(exercise)` is called. This triggers `ExerciseVideoModal` to become visible with the selected exercise's data.

---

**Step 26 — Video modal opens and plays**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L332–600
- **What happens (in order):**
  - **26a.** `cleanMediaUrl(exercise.video_url)` strips any proxy wrappers — returns raw CDN URL.
  - **26b.** `cleanMediaUrl(exercise.image_url)` resolves the muscle bodymap image URL.
  - **26c.** `loadingVideo = true` — gold spinner shown.
  - **26d.** A 10-second timeout timer starts (safety net against infinite loading).
  - **26e.** On **native** (iOS/Android): `expo-av <Video>` component mounts with `source={{ uri: videoUrl }}`, `shouldPlay=true`, `isMuted=true`, `isLooping=true`. Video starts streaming from the ExerciseDB CDN.
  - **26f.** On **web**: HTML5 `<video src={videoUrl} autoPlay muted loop>` renders — browser handles playback.
  - **26g.** `onLoad` / `onLoadedData` event fires → `setLoadingVideo(false)`, spinner disappears.
  - **26h.** Below the video: Sets × Reps × Rest meta bar is shown.
  - **26i.** Muscle bodymap `<Image>` is rendered (from `imageUrl`).
  - **26j.** PRO FORM TIP section shows `exercise.tip`.
  - **26k.** STEP-BY-STEP INSTRUCTIONS section shows numbered `exercise.steps[]`.

---

**Step 27 — User marks exercise as complete**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L695–709
- **File:** [`frontend/services/workoutService.ts`](file:///d:/Fitai%20X/frontend/services/workoutService.ts) — L134–144
- **What happens:**
  - User taps the checkbox on an `ExerciseCard`.
  - `handleToggleExercise(exId, isDone)` fires.
  - **Optimistic UI update**: `setState(prev => ...)` immediately updates `exercise.is_completed` and `exercise.completed_sets` in local state — **no loading delay for the user**.
  - **Background API call**: `workoutService.toggleExercise(exId, true)` fires `PUT /api/workout/exercise/:id/toggle`.

---

**Step 28 — Backend toggles exercise completion in DB**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L228–238
- **File:** [`backend/core/database.ts`](file:///d:/Fitai%20X/backend/core/database.ts) — L536–548
- **What happens:**
  ```sql
  UPDATE exercises
  SET is_completed = true,
      completed_sets = CASE WHEN true THEN sets ELSE 0 END
  WHERE id = $1
  RETURNING *
  ```

---

**Step 29 — Progress bar updates in real time**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L882–892
- **What happens:**
  ```tsx
  const completedExercises = workout.exercises.filter(e => e.is_completed).length;
  const totalExercises = workout.exercises.length;
  // Progress bar width = (completedExercises / totalExercises) * 100 + '%'
  ```
  The gold progress bar stretches in real time as each exercise is checked off.

---

**Step 30 (Optional) — User logs weight & reps for progressive overload**
- **File:** [`frontend/services/workoutService.ts`](file:///d:/Fitai%20X/frontend/services/workoutService.ts) — L182–192
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L310–329
- **What happens:** `POST /api/workout/exercise-log` inserts a row into `exercise_logs` table with `exercise_name, weight_kg, bar_weight_kg, plate_weight_kg, reps_achieved, is_bodyweight`. This data feeds back into `Step 10e` on the next generation.

---

### PHASE 4 — User Finishes the Workout

---

**Step 31 — User taps "Finish Session" button**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L920–934
- **What happens:** `setShowFeedback(true)` — slides up the `FeedbackModal` from the bottom.

---

**Step 32 — User fills in the Feedback Modal**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L102–161
- **What happens:** User rates:
  - **Energy Level** (1–5) — gold button row
  - **Muscle Soreness** (1–5) — red button row
  - **Mood** (1–5) — green button row
  - **Notes** (optional text input)

  Taps "Save Feedback" → `handleFeedbackSubmit({ energy, soreness, mood, notes })` fires.  
  Taps "Skip for now" → `handleFeedbackSkip()` fires with default values `{ energy:3, soreness:3, mood:3, notes:'' }`.

---

**Step 33 — `workoutService.completeWorkout()` is called**
- **File:** [`frontend/services/workoutService.ts`](file:///d:/Fitai%20X/frontend/services/workoutService.ts) — L120–126
- **What happens:** `POST /api/workout/:id/complete` with body `{ energy, soreness, mood, notes }`.

---

**Step 34 — Backend marks workout complete, saves feedback, awards XP**
- **File:** [`backend/routes/workoutRoutes.ts`](file:///d:/Fitai%20X/backend/routes/workoutRoutes.ts) — L201–213
- **File:** [`backend/core/database.ts`](file:///d:/Fitai%20X/backend/core/database.ts) — L582–600
- **What happens (in order):**

  - **34a.** `db.markWorkoutComplete(workoutId, feedback)`:
    ```sql
    UPDATE workouts
    SET status = 'completed',
        completed_at = NOW(),
        feedback_energy = 4,
        feedback_soreness = 2,
        feedback_mood = 4,
        feedback_notes = 'felt strong today'
    WHERE id = 47
    RETURNING *
    ```
  - **34b.** `db.awardXp(userId, 5)` — adds +5 XP to user:
    ```sql
    UPDATE users SET xp = xp + 5, level = ..., level_title = ... WHERE id = 3
    ```
  - **34c.** Returns `{ ...completedWorkout, xpEarned: 5, levelData: { level, levelTitle, progressPct, ... } }`.

> [!NOTE]
> An additional `+20 XP` is awarded inside `markWorkoutComplete()` itself (database.ts L598–600), so completing one workout actually awards **+25 XP total**.

---

**Step 35 — Frontend reloads state**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L711–727
- **What happens:** `setShowFeedback(false)`, `setCompleting(true)` → calls `load()` again → `GET /today` returns `scenario: 'COMPLETED_TODAY'`.

---

**Step 36 — Completed state is rendered**
- **File:** [`frontend/app/(tabs)/workout.tsx`](file:///d:/Fitai%20X/frontend/app/(tabs)/workout.tsx) — L937–950
- **What happens:**
  - The exercise list becomes **read-only** (toggle handler is `() => {}`).
  - A green "Session Complete!" banner appears with the award icon.
  - Feedback ratings are shown as chips: `Energy 4/5` · `Soreness 2/5` · `Mood 4/5`.
  - Message: *"Great work. Tomorrow's workout adapts to today's performance."*

---

### PHASE 5 — Next Day: The Feedback Loop Closes

---

**Step 37 — Next day: user opens Workout tab again**
- Scenario: `READY_TO_GENERATE`
- The screen shows the **previous session card** with the feedback data ingested:
  - *"PREVIOUS SESSION FEEDBACK INGESTED"*
  - `"Back & Biceps Power Session"` — target muscles shown
  - `Energy 4/5 · Soreness 2/5 · Mood 4/5` chips

---

**Step 38 — User generates again → the full feedback loop is complete**
- When `POST /generate` is called, **Step 10c** now picks up `lastFeedback = { energy: 4, soreness: 2, mood: 4, notes: "felt strong today" }`.
- In **Step 13b**, the Groq prompt includes:
  - `"HIGH ENERGY (4/5): Optimize progressive overload (+1 set or higher intensity)"`
  - `"CRITICAL RULE: DO NOT repeat [Back, Biceps]"` → forces new muscle group selection
- Groq generates a new session targeting different muscles at higher intensity.

---

### Complete Flow Summary (One-Liner Per Step)

```
01  User opens Workout tab → workout.tsx fires load()
02  workoutService.getToday() → GET /api/workout/today
03  authMiddleware validates JWT or x-user-id header
04  Route auto-marks past pending workouts as missed
05  Route determines scenario (FIRST_DAY / READY / HAS_WORKOUT / COMPLETED)
05a If today's workout exists: live video re-enrichment check per exercise
06  JSON response with scenario + workout + streak + counts
07  Frontend renders scenario-specific UI (4 different views)
08  User taps Generate → AIGenerationModal appears (4-step animation)
09  workoutService.generate() → POST /api/workout/generate
10  Route collects: user profile, history, streak, exercise logs, recovery data
11  WorkoutGenerationContext object assembled with all data
12  getTimeBasedConfig() → calculates exact exercise count (3/4/5/6)
13  buildAdaptivePrompt(ctx) → builds the Groq prompt  ← FILE: workoutAiService.ts L138
14  Groq API called (llama-3.3-70b, temp=0.3, json_object mode)
15  Groq returns JSON workout plan → parsed + validated
16  Equipment filter: AI exercises not in VERIFIED list are skipped
17  ExerciseDB enrichment loop per exercise → video + image + steps + tip
17a  sanitizeSearchQuery() → clean exercise name for search
17b  GET /search on ExerciseDB → array of candidates
17c  scoreCandidate() → best match ranked, score ≥ 250 threshold
17d  GET /exercises/{id} → fetch video URL + full detail
17e  Exercise enriched with videoUrl, imageUrl, steps, targetMuscle
18  Fallback: fill remaining slots from VERIFIED list if needed
19  Slice to exact targetExercises count → return AdaptiveWorkoutPlan
20  db.saveWorkout() → INSERT workouts + exercises rows to PostgreSQL
21  versionControlService.commitNewVersion() → git-style commit stored
22  Route responds with saved workout including all IDs + video URLs
23  Frontend hides AIGenerationModal, re-fetches today, renders workout
24  Hero card + exercises list + progress bar displayed
25  User taps "▶ Video & Steps" on exercise card
26  ExerciseVideoModal opens → cleanMediaUrl() → expo-av Video plays
27  User taps exercise checkbox → optimistic UI update + PUT /toggle
28  DB UPDATE exercises SET is_completed=true, completed_sets=sets
29  Progress bar updates in real time as exercises completed
30  (Optional) User logs weight × reps → POST /exercise-log → exercise_logs table
31  User taps "Finish Session" → FeedbackModal slides up
32  User rates energy/soreness/mood/notes → taps "Save Feedback"
33  workoutService.completeWorkout() → POST /api/workout/:id/complete
34  DB UPDATE workouts SET status='completed', feedback_* = ..., XP awarded
35  Frontend reloads → scenario becomes COMPLETED_TODAY
36  Green "Session Complete!" banner + read-only exercise list
37  Next day: READY_TO_GENERATE shows previous session feedback card
38  Generate again → lastFeedback flows into Groq prompt → adapted workout
```

---

> [!IMPORTANT]
> **The Groq prompt is located in one specific function in one specific file:**  
> **Function:** `buildAdaptivePrompt(ctx: WorkoutGenerationContext)`  
> **File:** [`backend/services/workoutAiService.ts`](file:///d:/Fitai%20X/backend/services/workoutAiService.ts)  
> **Lines:** 138–270  
> This single function is responsible for translating ALL user data (profile, feedback, recovery, exercise logs, streak) into the natural language instructions that Groq uses to generate the workout. Every adaptive behaviour — muscle rotation, progressive overload, soreness reduction, 1-week escalation — is encoded here as text injected into this prompt.

---

## 18. Simple Explanation — How Onboarding + Previous Day Data Generates the Next Workout

> This section explains everything in plain language. No code. No jargon. Just what actually happens.

---

### Think of it like this

FitAI X is like a **personal trainer who has a notebook about you**. Every time you finish a workout, your trainer writes down what you said and how you felt. The next day, before writing your new workout, they open that notebook and read everything — then they design the session specifically around what's in it.

That notebook is your **database**. The trainer reading it is the **Groq AI prompt**. The new workout plan is what gets generated.

---

### Step 1 — What you told us during Onboarding

When you first set up the app, you answered a few questions. Those answers are stored in the `users` table and **never change** unless you update your profile. They always feed into every workout generation:

| What you answered | How it's used |
|-------------------|---------------|
| **Goal** (e.g. "Muscle Gain") | AI prioritizes hypertrophy rep ranges (8–12), compound lifts |
| **Equipment** (e.g. "Commercial Gym") | AI only picks exercises valid for a gym. Bodyweight-only users never see barbell exercises |
| **Time Available** (e.g. "45 mins") | Directly controls how many exercises are generated (45 mins = 5 exercises) |
| **Injuries** (e.g. "knee") | AI receives a hard rule: "AVOID exercises stressing knee". Leg press and squats may be swapped |
| **Weight** (e.g. 78kg) | Used in AI reasoning for calorie estimates and load calculations |
| **Gender** | Minor tone adjustments in AI reasoning |

**These 6 things are the foundation of every single workout, every single day.** They never get ignored.

---

### Step 2 — What happened in your last workout

After your onboarding data, the AI reads your **most recent completed workout**. This gives it two critical pieces of information:

**A) Which muscles were already worked**

If yesterday you did *"Push Day"* targeting Chest and Triceps, the AI receives this instruction:

> *"CRITICAL RULE: DO NOT repeat muscle groups trained in the previous session (Chest, Triceps). Select complementary muscle groups — e.g. if previous was Push, pick Back/Pull or Legs."*

This is why your workouts automatically rotate. You'll never get chest two days in a row. The AI is **forced** to pick a different muscle group each time.

**B) What exercises you actually did**

The AI sees the exercise names from your last session. This helps it understand your training history — what compound patterns you've been doing — so it doesn't just repeat the same session in a different wrapper.

---

### Step 3 — How you FELT after your last workout (Feedback)

This is the most powerful part. When you finish a session and submit the feedback form — rating energy, soreness, and mood — those 3 numbers directly change what the AI generates the next day.

Here's exactly what each rating does:

---

**Energy Rating (1–5)**

This tells the AI how recovered you were going into that session.

| Your rating | What the AI does next day |
|-------------|--------------------------|
| **1–2 (Low)** | Generates a shorter session. Reduces exercise count by 1. Tells you "moderate effort only" |
| **3 (Normal)** | No change — generates a standard session |
| **4–5 (High)** | Tells the AI: "Apply progressive overload. Add +1 set or increase intensity for maximum growth" |

---

**Soreness Rating (1–5)**

This tells the AI how beat up your muscles are.

| Your rating | What the AI does next day |
|-------------|--------------------------|
| **1–3 (Low/None)** | No change |
| **4–5 (High)** | Reduces sets per exercise to 2–3 max. Extends rest between sets to 75–90 seconds. Avoids heavy compound lifts that load the spine (like squats, deadlifts). Also removes 1 exercise from the session |

So if you say you're really sore, the AI literally gives you a deload-style session — lighter, shorter, safer.

---

**Mood Rating (1–5)**

This is a secondary signal. It doesn't change the workout structure as dramatically, but the AI uses it to adjust the **tone of its reasoning**. Low mood sessions get gentler language and less pressure-focused instructions.

---

**Notes (optional text)**

If you type something in the notes box like *"shoulders felt tight"* or *"left knee clicking"*, the AI reads your exact words and addresses them:

> *"User Feedback Notes: 'shoulders felt tight'. Address this note directly in exercise selection and reasoning!"*

So the AI might swap overhead press for lateral raises, or avoid exercises that directly load the shoulder joint. **Your text note is injected word-for-word into the AI prompt.**

---

### Step 4 — How many days you missed

The system counts how many consecutive days you missed before today. If it finds missed days in your streak, it adds a volume reduction:

> *"The user missed 2 day(s). Reduce total volume by ~20% for smooth re-engagement."*

This means if you take a 3-day break and come back, you won't get hammered with a 6-exercise high-intensity session. You get a gentler re-entry session that won't destroy you.

---

### Step 5 — Your weight and rep logs (Progressive Overload)

Every time you log a weight during a session (e.g. "Bench Press: 80kg × 8 reps"), that record is saved in the `exercise_logs` table. The next time the AI generates a workout, it reads your last 20 logs and includes them:

> *"USER RECORDED EXERCISE LOGS:*  
> *– Bench Press: 80kg (40kg bar + 40kg plates) × 8 reps*  
> *– Pull-up: 15 bodyweight reps max*  
> *PROGRESSIVE OVERLOAD DIRECTIVE: Automatically scale working weight or target rep ranges based on these!"*

This means the AI knows your actual strength baseline. It won't tell a strong person to "do 3 sets of 10 with 20kg" if your logs show you've been doing 80kg.

---

### Step 6 — Your sleep and recovery data

If you've logged a recovery entry (sleep hours, HRV, soreness level), that feeds in as a separate block:

> *"PREVIOUS DAY RECOVERY SUMMARY:*  
> *– Sleep: 6.1 hrs (72% efficiency)*  
> *– HRV: 42 ms*  
> *– Muscle Soreness: High*  
> *– Bio-Readiness: 58%*  
> *DIRECTIVE: If readiness < 75% or sleep < 6.5h → lower total volume by 15–20%."*

So if you slept badly and your HRV is low, even if you felt fine during the workout, the AI still reduces the session volume as a protection measure.

---

### Step 7 — The 1-Week Escalation

After 7 completed sessions, the AI automatically escalates intensity:

> *"1-WEEK AUTOMATIC INTENSITY ESCALATION: User completed a 1-week training block baseline. Auto-increase working intensity (+2.5kg or +1 set) and document this adaptation in reasoning!"*

This is the app's built-in progressive overload on a weekly cycle — even if you forgot to log your weights, after a week the AI bumps things up.

---

### How It All Comes Together

Here's the simplest way to picture what happens every time you tap "Generate Today's Workout":

```
YOUR ONBOARDING          YOUR LAST SESSION        YOUR FEEDBACK RATINGS
─────────────────        ────────────────────     ─────────────────────────
Goal = Muscle Gain   +   Muscles = [Chest,     +   Energy = 4/5 (HIGH)
Equipment = Gym          Triceps]                   Soreness = 2/5 (low)
Time = 45 mins           Exercises = [Bench         Mood = 4/5
Injuries = [knee]        Press, Dips, ...]          Notes = "felt great"

          │                        │                        │
          └────────────────────────┴────────────────────────┘
                                   │
                                   ▼
                    GROQ AI READS ALL OF THIS AT ONCE
                    ───────────────────────────────────
                    "Alex wants muscle gain, has a gym,
                     45 min session, no knee exercises.
                     Yesterday: chest/triceps worked.
                     DO NOT repeat those muscles.
                     High energy + low soreness reported.
                     ADD progressive overload (+1 set).
                     Generate EXACTLY 5 exercises."
                                   │
                                   ▼
                     BACK & BICEPS POWER SESSION
                     ─────────────────────────────
                     1. Pull-up          4×8-10
                     2. Barbell Row      4×8-10  ← progressive overload
                     3. Hammer Curl      3×12-15
                     4. Chin-ups         3×8-10
                     5. Romanian Deadlift 3×10-12
                     [All with HD video + form tips]
```

---

### What Happens If You Skip Feedback?

If you tap "Skip for now" on the feedback form, the system uses defaults:
- Energy: 3/5
- Soreness: 3/5
- Mood: 3/5

The AI treats this as a neutral session — no volume reduction, no intensity boost, no special notes. The only thing it still knows is which muscles you trained (from the workout record itself), so muscle rotation still works correctly.

---

### Summary — Everything That Feeds Into Your Next Workout

| Data Source | Where it's stored | What the AI does with it |
|-------------|------------------|--------------------------|
| Goal, equipment, injuries, time | `users` table | Foundation rules that never change |
| Last workout's target muscles | `workouts` table | Forces rotation to different muscles |
| Last workout's exercises | `workouts.exercises` | Avoids repeating same session |
| Energy feedback | `workouts.feedback_energy` | Low → shorter session. High → progressive overload |
| Soreness feedback | `workouts.feedback_soreness` | High → deload (fewer sets, more rest, lighter lifts) |
| Mood feedback | `workouts.feedback_mood` | Adjusts tone of AI reasoning |
| Text notes | `workouts.feedback_notes` | Injected word-for-word into AI prompt |
| Missed days count | Computed from streak | High → reduce volume by ~20% |
| Weight × rep logs | `exercise_logs` table | AI knows your strength, gives correct weights |
| Sleep / HRV / readiness | `recovery_logs` table | Low sleep/HRV → lower session volume |
| Session number (>7) | `history.length` | 1-week mark → auto-escalate intensity |

---

*Documentation generated from source code analysis of FitAI X workspace. All file references are clickable links to the actual source.*
