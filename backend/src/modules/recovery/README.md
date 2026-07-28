# Recovery Module

## Purpose
Collects user recovery parameters (sleep metrics, soreness level, HRV) and calculates daily neuromuscular readiness.

## Routes
Mapped in `src/modules/recovery/routes/recovery.routes.ts`:
- `GET /latest`: Fetch latest recovery logs
- `GET /history`: Fetch previous recovery scores list
- `POST /insights`: Estimate Bio-readiness and save insights log

## Structure
- **Controllers**:
  - `getLatest.controller.ts`
  - `getHistory.controller.ts`
  - `postInsights.controller.ts`
- **Services**:
  - `recovery.service.ts`
  - `recoveryScore.service.ts`
- **Repositories**:
  - `recovery.repository.ts`

## Flow
1. User logs recovery parameters in the morning check-in.
2. `recoveryScore.service.ts` queries the Groq API using a structured system prompt, extracting recommendations and respiratory cycles.
3. Score is written to `recovery.repository.ts` and returned to client.
