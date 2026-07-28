# Coach Module

## Purpose
Manages conversational interaction with the AI Fitness Coach chatbot (FitGuru).

## Routes
Mapped in `src/modules/coach/routes/coach.routes.ts`:
- `GET /history`: Fetch chat logs timeline
- `POST /chat`: Submit user query and get AI coach reply

## Structure
- **Controllers**:
  - `getHistory.controller.ts`
  - `postChat.controller.ts`
- **Services**:
  - `coach.service.ts`
  - `coachAi.service.ts`
- **Repositories**:
  - `coach.repository.ts`

## Flow
1. User sends message; `postChat.controller.ts` writes message to `coach.repository.ts`.
2. `coachAi.service.ts` queries the rotation client pool with custom master prompts.
3. If Groq fails, smart local patterns check keys (e.g., diet, pain, workout) and provide an immediate tailored fallback.
4. AI reply is saved in database and returned to the client.
