export function processSleepSignal(hours: number): { intensityMultiplier: number; recommendation: string } {
  if (hours < 6) {
    return { intensityMultiplier: 0.8, recommendation: "Reduce volume by 20% due to sleep debt." };
  } else if (hours > 8) {
    return { intensityMultiplier: 1.1, recommendation: "Optimal rest logged. Ready for heavy overload." };
  }
  return { intensityMultiplier: 1.0, recommendation: "Normal volume targets." };
}
