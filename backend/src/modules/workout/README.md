# Workout Module

## Purpose
Manages adaptive workout generation, exercise tracking, progressive overload, media proxy, and workout structure version control.

## Routes
Mapped in `src/modules/workout/routes/workout.routes.ts`:
- `GET /today`: Determine today's scenario state
- `POST /generate`: Execute Groq AI session engine
- `POST /:id/complete`: Submit feedback and complete session
- `POST /:id/miss`: Set status = missed
- `PUT /exercise/:id/toggle`: Toggle single exercise checkmark
- `GET /streak`: Fetch streak history
- `GET /history`: Get historical workouts list
- `GET /latest`: Fetch latest workout layout
- `GET /version-control/history`: Fetch list of version control commits
- `POST /version-control/rollback` / `POST /rollback`: Restore layout to previous commit
- `POST /set-complete`: Legacy completed sets update
- `POST /exercise-log`: Log reps, weight, RPE details
- `GET /exercise-logs`: Fetch historical log list
- `GET /video-proxy` / `GET /media-proxy`: Video streaming pipe proxy

## Structure
- **Controllers**:
  - `todayState.controller.ts`, `generateWorkout.controller.ts`, `completeWorkout.controller.ts`, `missWorkout.controller.ts`
  - `toggleExercise.controller.ts`, `getStreak.controller.ts`, `getHistory.controller.ts`, `getLatest.controller.ts`
  - `getVersionControlHistory.controller.ts`, `rollbackVersionControl.controller.ts`
  - `legacySetComplete.controller.ts`, `logExercise.controller.ts`, `getExerciseLogs.controller.ts`, `mediaProxy.controller.ts`
- **Services**:
  - `workout.service.ts`
  - `workoutAi.service.ts` (LLM prompt builder and verification wrapper)
  - `exerciseDb.service.ts` (Fuzzy matching search to ExerciseDB V2)
  - `versionControl.service.ts` (Version Control Commits history / rollback engine)
  - `adaptivePlanning.service.ts` (Calculates bio-readiness and substitutes joint conflicts)
  - `progressiveOverload.service.ts` (Calculates next weights from RPE)
  - `decisionExplanation.service.ts` (Generates reasoning sentences)
  - `analytics.service.ts` (Wrapping exercise log repositories)
- **Repositories**:
  - `workout.repository.ts`
  - `exerciseLog.repository.ts`

## Flow
1. User requests daily generation; `generateWorkout.controller.ts` calculates active streak, past metrics, and logs context.
2. `workoutAi.service.ts` requests a JSON routine structure from Groq.
3. Workout exercises are matched against ExerciseDB V2 endpoints via `exerciseDb.service.ts`.
4. Layout commits to history (`versionControl.service.ts`) and is saved in the database (`workout.repository.ts`).
