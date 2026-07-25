export interface OverloadInput {
  currentWeightKg: number;
  currentReps: number;
  currentSets: number;
  rpe: number; // Rate of Perceived Exertion (1-10)
}

export function calculateProgressiveOverload(input: OverloadInput) {
  const { currentWeightKg, currentReps, currentSets, rpe } = input;

  if (rpe < 7) {
    return {
      nextWeightKg: currentWeightKg + 2.5,
      nextReps: currentReps,
      nextSets: currentSets,
      recommendation: "Increase weight by +2.5kg for next session due to low RPE.",
    };
  } else if (rpe >= 9) {
    return {
      nextWeightKg: currentWeightKg,
      nextReps: currentReps,
      nextSets: currentSets,
      recommendation: "Maintain current weight and focus on form mastery.",
    };
  } else {
    return {
      nextWeightKg: currentWeightKg,
      nextReps: currentReps + 1,
      nextSets: currentSets,
      recommendation: "Target +1 rep extension on your top set.",
    };
  }
}
