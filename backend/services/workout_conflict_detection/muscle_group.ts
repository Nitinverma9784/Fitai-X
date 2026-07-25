export function detectMuscleConflict(primaryGroup: string, recentGroups: string[]): { conflict: boolean; warning?: string } {
  if (recentGroups.includes(primaryGroup)) {
    return { conflict: true, warning: `High fatigue detected: ${primaryGroup} was trained within 24h.` };
  }
  return { conflict: false };
}
