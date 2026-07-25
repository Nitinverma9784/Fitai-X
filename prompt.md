# FitAI X — Master Build Prompt & Specification

> **AI-Powered Adaptive Fitness Intelligence Platform**
> This is not a fitness tracker. It is an AI-driven ecosystem that learns from the user and continuously evolves — rethinking the entire fitness journey every single day.

This document is the single source of truth for building FitAI X. It is written to be used as a prompt/spec for AI-assisted development (Claude Code, Cursor, etc.) and as a reference for the team. Every engineer should be able to read a single feature section and start building without needing outside context.

---

## 1. Tech Stack

### Mobile App
- **Framework:** Expo (Expo Go / EAS Build) + React Native
- **Language:** TypeScript (strict mode, no `any` unless justified)
- **Navigation:** Expo Router (file-based routing, matches `app/` folder convention)
- **State Management:**
  - Server state: **TanStack Query (React Query)** — caching, refetching, optimistic updates
  - Client/UI state: **Zustand** — theme, sidebar, modals, ephemeral UI state
- **Styling:** NativeWind (Tailwind for React Native) + custom design tokens for dark/light theming
- **Forms & Validation:** React Hook Form + Zod
- **Charts:** `react-native-gifted-charts` or `victory-native` (heatmaps, radar, line, ring progress)
- **Realtime:** `socket.io-client`
- **Animations:** React Native Reanimated 3 + Moti
- **Drag & Drop:** `react-native-draggable-flatlist` (calendar/workout builder)
- **Offline Storage:** WatermelonDB or SQLite (via `expo-sqlite`) for offline-first sync + AsyncStorage for lightweight key-value (theme, tokens)
- **Push Notifications:** Expo Notifications
- **Media/Video:** `expo-av` for exercise demonstration videos
- **Auth Session Storage:** `expo-secure-store`

### Backend
- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js or Fastify (Fastify preferred for performance + schema validation)
- **Database:** PostgreSQL
- **ORM:** Prisma (schema-first, migrations, type-safe queries)
- **Queue / Background Jobs:** BullMQ + Redis
- **Realtime:** Socket.IO server
- **AI Orchestration:** LLM calls via Gemini / Groq / OpenRouter (configurable provider layer, streaming responses)
- **Validation:** Zod (shared schema package between backend and mobile where possible)
- **Auth:** JWT (access + refresh tokens) + Google OAuth 2.0
- **File/Document Storage:** AWS S3 or Cloudflare R2 (for medical reports, progress photos, DEXA scans)
- **API Versioning:** `/api/v1/...`
- **Testing:** Vitest / Jest + Supertest

### Infra / DevOps
- **Monorepo:** Turborepo or Nx (shared types between backend & mobile)
- **Containerization:** Docker + docker-compose (Postgres, Redis, backend, worker)
- **CI/CD:** GitHub Actions
- **Env Management:** `.env` per app, validated with Zod at boot
- **Version Control:** GitHub — trunk-based with feature branches (see §7 Team Workflow)

### Authentication (detailed)
- **Google Login:** `expo-auth-session` + Google Identity Services (native Google Sign-In on iOS/Android via Expo's `AuthSession.useAuthRequest` with Google provider, or `@react-native-google-signin/google-signin` in a dev build). Backend verifies Google ID token via `google-auth-library`, then issues its own JWT pair.
- **Email/Password:** bcrypt-hashed passwords, email verification via signed token link.
- **JWT Strategy:** Short-lived access token (15 min) + long-lived refresh token (30 days) stored in `expo-secure-store`. Refresh rotation on use.
- **Authorization:** Role-based (`user`, `admin`) + resource ownership checks in a middleware layer (`requireOwnership(resource)`).

---

## 2. High-Level Architecture

```
fitaix/
├── backend/
│   ├── services/          # one folder per domain/feature (see feature list below)
│   ├── jobs/               # BullMQ background jobs
│   ├── core/                # config, db, security, events, exceptions
│   ├── models/  schemas/  routes/  alembic|prisma/  tests/
│   └── main.ts
└── frontend/
    └── app/                 # Expo Router app (mobile, via Expo Go)
        ├── app/             # route files
        ├── components/
        │   ├── constellation/   # exercise graph visualizer
        │   ├── timeline/         # memory timeline, version history
        │   ├── charts/
        │   ├── coach_chat/
        │   └── user_switcher/
        ├── lib/
        └── package.json
```

**Design principle:** every "engine" (Adaptive Planning, Recovery Score, Goal Engine, etc.) is its own **service module** with its own signals/inputs, business logic, and output — never a monolithic controller. Each service exposes a small, testable pure-function core (`compute()`, `recommend()`, `resolve()`) wrapped by a thin route/controller layer.

---

## 3. Core Features — Full Specification

Each feature below includes: **Purpose, Inputs, Logic, Output, Data Model notes, and Engineering Challenge it demonstrates.**

### 1. Adaptive AI Planning Engine
**Purpose:** Replace static weekly splits ("Monday = Chest") with a daily-recomputed "Today's Best Workout."
**Inputs (signals):** yesterday's workout, recovery score, sleep, calories, missed-workout count, weather (outdoor users), available equipment (from user profile), user mood, injury history, workout schedule.
**Logic:** A rule engine pre-filters candidate workouts (hard constraints: injury exclusions, equipment availability, time budget) → an LLM/recommendation layer ranks and composes the final session, with a business-logic layer applying progressive overload adjustments.
**Output:** A structured `WorkoutPlan` object (exercises, sets, reps, rest, estimated duration) + natural-language reasoning.
**Data model:** `workout_plans`, `plan_signals` (snapshot of the signals used, for auditability/versioning).
**Engineering challenge:** Dynamic business logic composition.

### 2. Workout Version Control
**Purpose:** Every generated workout is **immutable** once created — new AI edits create new versions, like Git commits.
**Logic:** `create()` snapshots a new version linked to `parent_version_id`. `compare()` diffs two versions (exercise added/removed/modified, volume delta). `rollback()` creates a *new* version that copies an old one (never mutates history).
**Output:** Version timeline UI, diff view, AI explanation attached to every version transition.
**Data model:** `workout_versions(id, plan_id, parent_version_id, created_at, reason, payload_json)`.
**Engineering challenge:** Data versioning (Git-like DAG over workout plans).

### 3. AI Decision Explanation
**Purpose:** Every AI action must state *why* — no black-box changes.
**Example:** "AI removed Squats. Reason: Knee pain reported yesterday. Recovery score 48%. Replacing with Leg Press."
**Logic:** Every mutating AI call is required to return a structured `{ action, reason[], replacement? }` object via prompt-enforced schema (Zod-validated LLM output). Explanations are persisted and linked to the version/decision they justify.
**Data model:** `ai_decisions(id, entity_type, entity_id, reason_json, model_used, created_at)`.
**Engineering challenge:** Prompt engineering + explainability + LLM orchestration.

### 4. Dynamic Goal Engine
**Purpose:** Goals change mid-journey (Lose Weight → Gain Muscle → Half Marathon → Powerlifting) and the *entire system* recalculates without discarding history.
**Logic:** Goal changes are stored as an append-only `goal_history` log. On a goal switch, a recalculation job re-derives workout templates, calorie targets, macro splits, and recovery thresholds — but old plans/analytics remain queryable against the goal that was active at the time.
**Engineering challenge:** Complex business logic + temporal data modeling.

### 5. AI Memory Timeline
**Purpose:** The AI remembers the user's journey as a timeline of events (Jan: wanted weight loss → March: shoulder injury → April: changed goal → June: completed challenge), not just raw chat logs.
**Logic:** Every significant event (goal change, injury, milestone, missed streak, chat insight) is extracted into a `memory_event`. A retrieval layer selects relevant memory events as context for AI Coach conversations and planning decisions (RAG over structured + unstructured memory).
**Data model:** `memory_events(id, user_id, type, summary, occurred_at, source)`.
**Engineering challenge:** Context management (structured long-term memory for LLMs).

### 6. Smart Habit Engine
**Purpose:** Detect behavioral patterns ("Every Friday, workout missed") and proactively **change the schedule** instead of nagging with a reminder.
**Logic:** A background job scans `workout_logs` for recurring miss-patterns (day-of-week, time-of-day) using simple frequency analysis, assigns a confidence score, and if above threshold, proposes a schedule mutation via the Smart Calendar service.
**Engineering challenge:** Pattern detection + automated remediation (vs. passive reminders).

### 7. AI Recovery Score
**Purpose:** A single 0–100% score driving workout modification decisions.
**Inputs:** sleep, water, workout load, heart rate (manual entry), stress, soreness.
**Logic:** Weighted composite score (configurable weights per input); score below threshold triggers automatic workout intensity reduction via the Adaptive Planning Engine.
**Data model:** `recovery_scores(id, user_id, date, components_json, score)`.

### 8. Workout Conflict Detection
**Purpose:** Prevent invalid programming — e.g., Heavy Legs on consecutive days, or Military Press prescribed with an active shoulder injury.
**Logic:** Rule-based dependency checker runs before a plan is finalized: checks muscle-group overlap against a cooldown window, and cross-references `injury_history` against an exercise's `contraindications` list.
**Engineering challenge:** Rule-based validation engine.

### 9. AI Exercise Graph
**Purpose:** Every exercise is a node in a graph connected to the muscles/movement patterns it trains (Bench Press → Chest → Front Delts → Triceps). Changing one exercise propagates workload changes across the whole session.
**Logic:** Graph stored as `exercise_nodes` + `exercise_edges` (weighted by muscle involvement %). Swapping an exercise triggers a propagation function that recalculates total per-muscle-group volume for the session.
**Engineering challenge:** Graph algorithms (traversal + propagation).

### 10. Progressive Overload Engine
**Purpose:** Replace naive "week++, weight++" logic with AI-predicted progression across multiple levers: reps, sets, weight, rest, tempo, or a deload.
**Logic:** Given performance history (completion rate, RPE/soreness feedback, recovery trend), the engine chooses *which lever* to adjust and by how much, rather than a fixed linear increment.
**Engineering challenge:** Predictive business logic over a time series.

### 11. Fatigue Prediction
**Purpose:** Predict "User will likely fail next workout" before it happens.
**Inputs:** recovery trend, sleep trend, calorie deficit/surplus, previous session intensity.
**Logic:** Lightweight scoring/classification model (can start rule-based/heuristic, upgradeable to a trained model) outputs a risk score + top contributing factors.
**Engineering challenge:** Predictive modeling with explainable factors.

### 12. Workout Simulator
**Purpose:** Let the user preview alternate versions of today's workout before accepting — different durations (20/30/45 min) or locations (Home/Gym).
**Logic:** Calls the Adaptive Planning Engine in a "simulate" (non-persisting) mode with overridden constraints; regenerates instantly client-side-triggered, server-computed.
**Engineering challenge:** Idempotent "dry-run" execution path parallel to the real planning pipeline.

### 13. Scenario Planner
**Purpose:** Handle life scenarios like "Traveling next week" by generating a hotel-room-friendly workout block ahead of time.
**Logic:** Scenario templates (`travel`, `low_equipment`, etc.) are detected from calendar input or user declaration, and pre-generate a batch of plan versions for the affected date range.
**Engineering challenge:** Batch pre-generation + templated constraint sets.

### 14. Meal Planner with Budget
**Purpose:** Meal suggestions constrained by budget, hostel/home cooking access, country/region, dietary restriction, religion, and cooking skill — not just "eat chicken."
**Logic:** Multi-filter pipeline (budget → region/availability → dietary/religious constraint → cooking skill) narrows a food database before AI composes a day's meal plan.
**Engineering challenge:** Multi-constraint filtering pipeline.

### 15. AI Grocery Generator
**Purpose:** Convert a week of meals into an optimized shopping list.
**Logic:** Aggregate ingredient quantities across the week → deduplicate/reuse overlapping ingredients across meals to minimize waste → estimate cost per item (static price table or external pricing API) → output a grouped shopping list (by aisle/category).
**Engineering challenge:** Algorithmic optimization (aggregation + reuse minimization, a bin-packing-adjacent problem).

### 16. Streak Protection
**Purpose:** Preserve motivation on busy days by offering a 5-minute micro-workout instead of letting the streak break.
**Logic:** Detects a "busy day" signal (calendar density, or user self-report) and offers a minimum-viable workout that still counts toward the streak.
**Engineering challenge:** Graceful-degradation UX backed by a fallback content generator.

### 17. Smart Calendar
**Purpose:** Drag a workout to a new day/time and have *everything* recalculate — dependencies, recovery windows, calorie targets.
**Logic:** Calendar mutation triggers a recalculation cascade: shifts dependent recovery days, re-runs Conflict Detection, and re-times calorie/meal windows relative to the new workout slot.
**Engineering challenge:** Cascading recalculation across interdependent schedules.

### 18. AI Injury Predictor
**Purpose:** Warn the user before an injury occurs, using workload, sleep, recovery, and history.
**Logic:** Composite risk model similar to Fatigue Prediction but focused on cumulative load spikes (acute:chronic workload ratio) cross-referenced with prior injury patterns.
**Engineering challenge:** Time-series risk modeling.

### 19. Workout Dependency Graph
**Purpose:** Model downstream effects of one exercise on future recommendations (Deadlift → Lower Back Fatigue → Avoid Rows → Recommend Pull-ups).
**Logic:** Directed graph of "fatigue propagation" rules used by the Adaptive Planning Engine as a hard/soft constraint source for the *next* session, not just the current one.
**Engineering challenge:** Graph algorithms applied across time (multi-session propagation).

### 20. Real-Time Dashboard
**Purpose:** A live-updating dashboard, not static cards — current workout, calories, water, heart rate, active users, leaderboard, workout feed, AI suggestions.
**Logic:** Socket.IO pushes events (`workout:started`, `calorie:logged`, `leaderboard:updated`) to subscribed clients; the mobile app merges live events into the React Query cache (`queryClient.setQueryData`) for instant UI updates without a refetch.
**Engineering challenge:** WebSocket integration + client cache synchronization.

---

## 4. Complex Backend Systems

### Event-Driven Architecture
Flow: `Workout Completed → Event Queue → Update Analytics → Update Progress → Update Streak → Generate AI Feedback → Notify User`
Implemented via an internal event emitter (`core/events.ts`) publishing domain events consumed by independent listeners — each listener owns one side effect, so features can be added without touching the original completion handler.

### Background Jobs (BullMQ)
Scheduled jobs:
- **Midnight:** Generate tomorrow's workout → Generate grocery list → Weekly analytics rollup → Backup.
- Retry policy with exponential backoff; dead-letter queue for failed AI generation jobs.

### Optimistic UI
Mobile mutations (e.g., marking a set complete) update the local React Query cache immediately; on server rejection, the mutation is rolled back and an error toast is shown. Implemented with `onMutate` / `onError` / `onSettled` in TanStack Query.

### Offline Support
Workouts continue fully offline (data read from local SQLite/WatermelonDB). A sync engine reconciles local writes with the server on reconnect, using a last-write-wins **plus** conflict surfacing UI for cases where both local and server versions changed (e.g., a workout was edited on two devices).

### AI Queue
AI generation requests never block the request thread: `Workout Requested → Queue → Worker → AI Response → Push Notification`. The mobile client subscribes to a socket room keyed by request ID to receive the streamed/final result.

### Document Storage & Analysis
Users upload blood reports, medical reports, DEXA scans, and progress photos to S3/R2. An AI analysis job extracts structured health markers where possible (e.g., from lab report OCR) and feeds them into the Recovery Score and Injury Predictor as additional signals.

---

## 5. Mobile UI — Screens & Sections

### 1. Dashboard (Home)
**Purpose:** Central command center for the user's fitness status.
Welcome Header · Today's AI Workout · Recovery Score · Goal Progress · Workout Streak · Calories & Nutrition · Water Intake · AI Suggestions · Weekly Calendar · Recent Activity Feed · Leaderboard · Quick Actions · Live Statistics (Socket.IO) · Active Challenges · Notifications.
Widgets are draggable/resizable where feasible on mobile (or a fixed responsive grid with reorder-by-drag on larger screens/tablets).

### 2. AI Workout Planner
**Purpose:** Generate, edit, and perform today's workout.
Today's Best Workout · AI Reasoning Panel (feature 3) · Workout Builder (drag-and-drop) · Exercise List · Video Demonstrations (`expo-av`) · Muscle Group Visualization (exercise graph, feature 9) · Workout Simulator (feature 12) · Equipment Selection · Time Adjustment · Difficulty Adjustment · Conflict Warnings (feature 8) · Adaptive Recommendations · Start Workout · Finish Workout (triggers the event-driven completion flow).

### 3. Workout Version Control
**Purpose:** Git-like version management for workout plans.
Workout History Timeline · Version Cards · Current Version badge · Compare Versions · Side-by-Side Diff View · AI Change Log · Rollback (with confirmation dialog) · Version Metadata (author=AI/user, timestamp, reason) · Search · Filters.

### 4. AI Coach
**Purpose:** A conversational AI that remembers the user across time.
AI Chat (streaming, token-by-token) · Memory Timeline (feature 5) · AI Explanations · Goal Discussion · Workout Questions · Nutrition Advice · Injury Guidance · Conversation History (grouped by topic) · Suggested Prompts · Voice Input (`expo-speech` / device STT).

### 5. Progress & Analytics
**Purpose:** Visualize long-term progress.
Weight Progress · Body Measurements · Muscle Growth · Strength Progress · Workout Heatmap (calendar-style, like GitHub contributions) · Recovery Trends · Nutrition Compliance · Workout Completion Rate · Streak History · Goal Achievement · AI Insights · Export Reports (PDF/CSV).

### 6. Nutrition & Grocery
**Purpose:** AI-driven meal planning and shopping.
Meal Plan · Daily Calories · Macronutrients · Budget Planner · Grocery List · Cost Estimation · Ingredient Reuse view · Food Preferences · Water Tracking · Shopping Checklist.

### 7. Calendar & Schedule
**Purpose:** Manage workouts, meals, and recovery in one place.
Monthly Calendar · Weekly Timeline · Drag-and-Drop Workouts · Recovery Days · Meal Schedule · Habit Tracker · Travel Planner (feature 13) · Reschedule Workouts · AI Calendar Suggestions.

### 8. Recovery & Health
**Purpose:** Monitor recovery and prevent injuries.
Recovery Score · Sleep Tracking · Stress Level · Water Intake · Heart Rate (manual) · Fatigue Prediction · Injury Risk · Recovery Timeline · Health Reports · Medical Document Analysis.

### 9. Community & Challenges
**Purpose:** Social fitness engagement.
Global Leaderboard · Friends · Challenges · Achievements · Activity Feed · Workout Sharing · Challenge Creation · Team Competitions · Badges · Rankings.

### 10. Profile & Settings
**Purpose:** User account and personalization.
Personal Information · Fitness Profile · Goals · Equipment · Injury History · AI Preferences · Notifications · Theme Settings · Privacy · Security · Connected Devices · Subscription · Data Export · Logout.

### Shared/Supporting Components
Global Search · Notification Center · AI Assistant Side Panel (collapsible) · Command Palette (`Cmd/Ctrl+K` equivalent on mobile — quick-action sheet) · Floating AI Action Button · Loading & Skeleton States · Empty States · Error States · Success Toasts · Confirmation Dialogs · Bottom Sheets · Filter Drawers · Version Comparison Modal · Workout Completion Modal · AI Streaming Response Panel.

### Design Language
- Modern dark/light themes with persisted preference (`AsyncStorage` + system-theme fallback).
- Fully responsive across phone/tablet (Expo + `useWindowDimensions` breakpoints).
- Glassmorphism / minimal card-based interface.
- One consistent design system: spacing scale, type scale, color tokens, and a shared component library (`Button`, `Card`, `Badge`, `ProgressRing`, `Modal`, `BottomSheet`) — no one-off styled components.

---

## 6. Engineering Challenges Reference Table

| Challenge | Purpose |
|---|---|
| Adaptive Workout Engine | Dynamic business logic |
| Workout Version Control | Data versioning |
| Conflict Detection Engine | Rule-based validation |
| Dependency Graph | Graph algorithms |
| AI Memory Timeline | Context management |
| Offline Sync & Conflict Resolution | Distributed state handling |
| Event-Driven Notifications | Asynchronous architecture |
| Background Job Processing | Queue management |
| Real-Time Dashboard | WebSocket integration |
| Explainable AI | Prompt engineering & transparency |
| Dynamic Goal Recalculation | Complex business logic |
| Grocery Optimization | Algorithmic thinking |
| Optimistic UI Updates | Advanced frontend architecture |
| AI Recommendation Caching | Performance optimization |
| Modular & Scalable Architecture | Maintainability and extensibility |

---

## 7. Team Workflow & Build Roadmap

### Step 0 — Foundations
1. **Create the folder structure** (microservices-style backend + modular frontend). Create all files as interpretable stubs/placeholders — this is a **team project**, so every service folder should exist with clear file boundaries before logic is written, so branches don't collide.
2. **Set up GitHub** and have every contributor create their own feature branch (`feature/<area>-<name>`), branching off `main`/`develop`. No direct commits to `main`.

### Step 1 — Build Order (as sequenced by the team)
Build in this order so each layer has what it needs from the one before it:

1. **Authentication & Authorization** — Google login + email/password, JWT issuance, role/ownership middleware.
2. **User Onboarding Flow** — multi-step form capturing goals, equipment, injury history, dietary constraints.
3. **User Profile** — editable profile built from onboarding data.
4. **Workout Tracker** — Create, Past, Version History, Progress Chart for workouts (this is where Manual + AI paths first meet: manual logging feeds the same data model AI-generated plans use).
5. **Nutrition** — meal planning + grocery generation.
6. **AI Chat Coach** — conversational layer, wired to the Memory Timeline.
7. **AI Recommendation Engine** — the Adaptive Planning Engine + Progressive Overload + Conflict Detection, consuming everything built so far.
8. **Dashboard** — assembles live data from all the above into the home screen.
9. **Habit / Goal Engine** — Smart Habit Engine + Dynamic Goal Engine layered on top of accumulated usage data.
10. **Personalized AI Progress Tracking & Decision Analyst** — the top-level synthesis layer: long-horizon analytics + AI insights that reference the full Memory Timeline, Recovery history, and Goal history.

> Each numbered step should be its own milestone/PR chain — don't start step *n+1* until step *n*'s data model is stable, since later engines (Habit, Goal, Progress Tracking) depend on real historical data from the earlier ones.

---

## 8. Non-Negotiables (Team Conventions)

- TypeScript strict mode everywhere; no implicit `any`.
- Every backend service folder = signals/inputs separated from core logic (`generator.py`/`.ts`-equivalent pattern from the folder structure) — pure functions for business logic, thin controllers for I/O.
- Every AI-mutating action **must** persist a structured explanation (feature 3) — no silent AI writes.
- Every list endpoint supports pagination; every collection uses soft deletes; AI-generated plans are versioned, never overwritten.
- API is versioned from day one (`/api/v1`).
- Shared Zod schemas between backend and mobile wherever request/response shapes overlap, to keep types in sync across the monorepo.