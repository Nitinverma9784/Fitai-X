export interface DecisionExplanationInput {
  action: string;
  primaryReason: string;
  readinessScore?: number;
  sorenessLevel?: number | string;
  sleepHours?: number;
  progressiveOverloadDetails?: string;
}

export function generateDecisionExplanation(input: DecisionExplanationInput): string {
  const { action, primaryReason, readinessScore, sorenessLevel, sleepHours, progressiveOverloadDetails } = input;
  let explanation = `💡 AI Decision: ${action} because ${primaryReason}.`;

  if (readinessScore !== undefined) {
    explanation += ` Bio-readiness score calculated at ${readinessScore}%.`;
  }
  if (sleepHours !== undefined) {
    explanation += ` Recovery factored from ${sleepHours}h sleep.`;
  }
  if (sorenessLevel) {
    explanation += ` Soreness level: ${sorenessLevel}.`;
  }
  if (progressiveOverloadDetails) {
    explanation += ` ⚡ Progressive Overload: ${progressiveOverloadDetails}.`;
  }

  explanation += ` Session structured for optimal hypertrophy & joint protection.`;
  return explanation;
}
