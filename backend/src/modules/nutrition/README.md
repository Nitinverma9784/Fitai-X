# Nutrition Module

## Purpose
Manages weekly high-protein Indian & Global meal plans, instant macro estimations, meal logging, and weekly grocery cost optimization.

## Routes
Mapped in `src/modules/nutrition/routes/nutrition.routes.ts`:
- `GET /plan`: Fetch weekly meal plan and daily targets status
- `POST /plan/regenerate`: Request a fresh meal schedule layout
- `POST /calculate-macros`: Estimate carbs/fats/protein for any food query
- `POST /log-meal`: Confirm macros and log meal (+3 XP)
- `POST /grocery-optimize`: Generate budget shopping list

## Structure
- **Controllers**:
  - `getPlan.controller.ts`
  - `regeneratePlan.controller.ts`
  - `calculateMacros.controller.ts`
  - `logMeal.controller.ts`
  - `groceryOptimize.controller.ts`
- **Services**:
  - `nutrition.service.ts`
  - `groceryOptimizer.service.ts`
- **Repositories**:
  - `nutrition.repository.ts`

## Flow
1. User queries diet properties; `getPlan.controller.ts` pulls targets status from logged meals.
2. Meal plans and instant estimates query LLM parsers via Groq client rotation.
3. Meal logging writes directly to `nutrition.repository.ts` which awards XP to the user.
