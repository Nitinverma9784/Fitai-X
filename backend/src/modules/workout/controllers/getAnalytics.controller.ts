import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { workoutService } from '../services/workout.service';
import { recoveryService } from '../../recovery/services/recovery.service';

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || 1;

    const [streak, history, latestRecovery, recoveryHistory] = await Promise.all([
      workoutService.getWorkoutStreak(userId, 7),
      workoutService.getWorkoutHistory(userId, 30),
      recoveryService.getLatestRecovery(userId),
      recoveryService.getRecoveryHistory(userId, 7),
    ]);

    const completedWorkouts = streak.filter(s => s.status === 'completed');
    const completedCount = completedWorkouts.length;
    const currentStreak = completedCount;

    const defaultDuration = history.length > 0 && history[0].duration_minutes ? history[0].duration_minutes : 45;

    const weeklyActivity = streak.map(s => {
      const d = new Date(s.date + 'T00:00:00');
      const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayLabel = isNaN(d.getTime()) ? 'Day' : daysMap[d.getDay()];
      const isDone = s.status === 'completed';
      const mins = isDone ? defaultDuration : 0;
      const pct = isDone ? Math.min(100, Math.max(15, Math.round((mins / 60) * 100))) : 8;
      return { day: dayLabel, date: s.date, mins, height: `${pct}%`, isDone };
    });

    const totalActiveMins = weeklyActivity.reduce((acc, curr) => acc + curr.mins, 0);

    const recoveryPct = latestRecovery?.readiness_percentage
      ? latestRecovery.readiness_percentage
      : (recoveryHistory.length > 0 ? recoveryHistory[0].readiness_percentage : 75);

    const consistencyPct = streak.length > 0 ? Math.round((completedCount / streak.length) * 100) : (completedCount > 0 ? 80 : 50);
    const powerOutputPct = completedCount > 0 ? Math.min(98, 75 + currentStreak * 3) : 60;

    const overallFitnessScore = Math.min(100, Math.max(30, Math.round(
      (recoveryPct * 0.40) + (consistencyPct * 0.35) + (powerOutputPct * 0.25)
    )));

    const fitnessRatingLabel = overallFitnessScore >= 85 ? 'EXCELLENT' : overallFitnessScore >= 70 ? 'OPTIMAL' : overallFitnessScore >= 50 ? 'BUILDING' : 'STARTER';

    const soreness = latestRecovery?.muscle_soreness || 'Low';
    const fatigueMap: Record<string, { chest: number; back: number; legs: number }> = {
      High:     { chest: 45, back: 55, legs: 35 },
      Moderate: { chest: 75, back: 80, legs: 65 },
      Low:      { chest: 100, back: 92, legs: 85 },
    };
    const fatigue = fatigueMap[soreness] || fatigueMap.Low;

    res.json({
      success: true,
      data: {
        weeklyActivity,
        totalActiveMins,
        completedCount,
        currentStreak,
        overallFitnessScore,
        fitnessRatingLabel,
        subMetrics: {
          powerOutputPct,
          recoveryPct,
          consistencyPct,
        },
        muscleFatigue: [
          { name: 'Chest & Triceps', pct: fatigue.chest },
          { name: 'Legs & Quads', pct: fatigue.legs },
          { name: 'Back & Biceps', pct: fatigue.back },
        ],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
