import { getLocalDateString } from '../../../shared/utils/date';

export function calculateLevelData(xp: number = 0) {
  const safeXp = Math.max(0, xp || 0);

  let level = Math.floor((1 + Math.sqrt(1 + (8 * safeXp) / 50)) / 2);
  level = Math.max(1, Math.min(100, level));

  const xpCurrentLevelStart = 50 * level * (level - 1);
  const xpNextLevelStart = 50 * (level + 1) * level;

  const xpForCurrentLevel = safeXp - xpCurrentLevelStart;
  const xpRequiredForNextLevel = xpNextLevelStart - xpCurrentLevelStart;

  const progressPct = Math.min(
    100,
    Math.max(0, Math.round((xpForCurrentLevel / xpRequiredForNextLevel) * 100))
  );

  return {
    level,
    xp: safeXp,
    xpForCurrentLevel,
    xpRequiredForNextLevel,
    progressPct,
  };
}

export function parseDbDateString(dbDate: any, fallbackCreatedAt?: any): string {
  if (!dbDate) {
    return fallbackCreatedAt ? parseDbDateString(fallbackCreatedAt) : getLocalDateString();
  }
  if (typeof dbDate === 'string') {
    return dbDate.split('T')[0];
  }
  if (dbDate instanceof Date) {
    return dbDate.toISOString().split('T')[0];
  }
  return String(dbDate).split('T')[0];
}
