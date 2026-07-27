export type ExerciseEquipmentCategory = 'barbell' | 'dumbbell' | 'cable_machine' | 'bodyweight';

export function detectEquipmentCategory(name: string = ''): ExerciseEquipmentCategory {
  const n = name.toLowerCase();
  if (
    n.includes('dumbbell') ||
    n.includes('db ') ||
    n.includes('hammer curl') ||
    n.includes('lateral raise') ||
    n.includes('goblet') ||
    n.includes('arnold press')
  ) {
    return 'dumbbell';
  }
  if (
    n.includes('barbell') ||
    n.includes('bench press') ||
    n.includes('squat') ||
    n.includes('deadlift') ||
    n.includes('overhead press') ||
    n.includes('t-bar') ||
    n.includes('clean and press')
  ) {
    return 'barbell';
  }
  if (
    n.includes('push-up') ||
    n.includes('pushup') ||
    n.includes('pull-up') ||
    n.includes('pullup') ||
    n.includes('chin-up') ||
    n.includes('dip') ||
    n.includes('leg raise') ||
    n.includes('crunch') ||
    n.includes('plank') ||
    n.includes('bodyweight')
  ) {
    return 'bodyweight';
  }
  return 'cable_machine';
}

export function formatWeightBreakdown(item: {
  weight_kg?: number;
  weightKg?: number;
  bar_weight_kg?: number;
  barWeightKg?: number;
  plate_weight_kg?: number;
  plateWeightKg?: number;
  is_bodyweight?: boolean;
  isBodyweight?: boolean;
  exercise_name?: string;
  exerciseName?: string;
}): string {
  const total = item.weight_kg ?? item.weightKg ?? 0;
  const bar = item.bar_weight_kg ?? item.barWeightKg ?? 0;
  const plate = item.plate_weight_kg ?? item.plateWeightKg ?? 0;
  const isBw = !!(item.is_bodyweight ?? item.isBodyweight);
  const name = item.exercise_name ?? item.exerciseName ?? '';
  const category = detectEquipmentCategory(name);

  if (isBw || category === 'bodyweight') {
    return total > 0 ? `Bodyweight + ${total}kg` : `Bodyweight`;
  }
  if (category === 'barbell' && bar > 0 && plate > 0) {
    return `${total}kg (${bar}kg bar + ${plate}kg/side)`;
  }
  if (category === 'dumbbell') {
    return `${total}kg per DB`;
  }
  return `${total}kg`;
}
