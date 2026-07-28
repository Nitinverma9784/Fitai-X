# User Module

## Purpose
Manages user profiles, onboarding, levels, calendar timelines, and game mechanics (XP gains).

## Routes
Mapped in `src/modules/user/routes/user.routes.ts`:
- `GET /profile`: Fetch profile properties
- `PUT /profile`: Update profile parameters
- `POST /onboarding`: Save initial physical dimensions and commitment target
- `GET /stats`: Fetch streaks and completed workout count
- `GET /calendar`: Fetch timeline calendar summary
- `POST /award-xp`: Manually increment user experience points

## Structure
- **Controllers**:
  - `getProfile.controller.ts`
  - `updateProfile.controller.ts`
  - `onboarding.controller.ts`
  - `stats.controller.ts`
  - `calendar.controller.ts`
  - `awardXp.controller.ts`
- **Services**:
  - `user.service.ts`
- **Repositories**:
  - `user.repository.ts`
- **Utils**:
  - `level.utils.ts`

## Flow
1. Athlete calls endpoint with authorization credentials.
2. UserService processes level mappings (`level.utils.ts`) and retrieves profile values from `user.repository.ts`.
3. `calendar.controller.ts` aggregates data points from multiple tables to build a synchronized feed.
