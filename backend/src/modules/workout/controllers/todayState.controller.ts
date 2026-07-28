import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { workoutService } from '../services/workout.service';
import { fetchExerciseDbDetails } from '../services/exerciseDb.service';

export async function getTodayState(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId !== undefined ? req.user.userId : 1;

    // Auto-mark any pending workouts from past days as missed
    await workoutService.markMissedWorkoutsBeforeToday(userId);

    const history = await workoutService.getWorkoutHistory(userId);
    const streak = await workoutService.getWorkoutStreak(userId, 7);
    const todayWorkout = await workoutService.getTodayWorkout(userId);

    const totalWorkouts = history.length;
    const missedDays = streak.filter(d => d.status === 'missed').length;

    if (totalWorkouts === 0) {
      return res.json({
        success: true,
        scenario: 'FIRST_DAY',
        workout: null,
        streak,
        totalWorkouts: 0,
        missedCount: 0,
      });
    }

    if (todayWorkout) {
      if (Array.isArray(todayWorkout.exercises)) {
        for (const ex of todayWorkout.exercises) {
          if (!ex.video_url || !ex.video_url.includes('exercisedb.dev')) {
            const edbData = await fetchExerciseDbDetails(ex.name);
            if (edbData.videoUrl) {
              ex.video_url = edbData.videoUrl;
              ex.videoUrl = edbData.videoUrl;
              ex.image_url = edbData.imageUrl;
              ex.imageUrl = edbData.imageUrl;
              ex.steps = (edbData.steps && edbData.steps.length > 0) ? edbData.steps : ex.steps;
              ex.target_muscle = edbData.targetMuscle;
              ex.targetMuscle = edbData.targetMuscle;
              ex.tip = edbData.tip || ex.tip;
            }
          }
        }
      }

      const scenario = todayWorkout.status === 'completed' ? 'COMPLETED_TODAY' : 'HAS_WORKOUT_TODAY';
      return res.json({ success: true, scenario, workout: todayWorkout, streak, totalWorkouts, missedCount: missedDays });
    }

    // No workout for today yet — ready to generate
    const lastWorkout = history[0] || null;
    return res.json({
      success: true,
      scenario: 'READY_TO_GENERATE',
      workout: null,
      lastWorkout,
      streak,
      totalWorkouts,
      missedCount: missedDays,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
