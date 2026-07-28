import { Response } from 'express';
import { AuthenticatedRequest } from '../../../core/middleware/auth.middleware';
import { userService } from '../../user/services/user.service';
import { workoutService } from '../services/workout.service';
import { versionControlService } from '../services/versionControl.service';
import { analyticsService } from '../services/analytics.service';
import { recoveryService } from '../../recovery/services/recovery.service';
import { generateAdaptiveWorkoutWithGroq, WorkoutGenerationContext } from '../services/workoutAi.service';

export async function generateWorkout(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId !== undefined ? req.user.userId : 1;
    const userProfile = await userService.getUser(userId);
    const history = await workoutService.getWorkoutHistory(userId, 20);

    // Build last workout context
    const lastWorkout = history.length > 0 ? history[0] : null;
    const lastFeedback = lastWorkout ? {
      energy: lastWorkout.feedback_energy || 3,
      soreness: lastWorkout.feedback_soreness || 3,
      mood: lastWorkout.feedback_mood || 3,
      notes: lastWorkout.feedback_notes || '',
    } : undefined;

    // Count consecutive missed days
    const streak = await workoutService.getWorkoutStreak(userId, 7);
    let missedDaysCount = 0;
    for (let i = streak.length - 2; i >= 0; i--) {
      if (streak[i].status === 'missed') missedDaysCount++;
      else if (streak[i].status === 'completed') break;
    }

    const userExerciseLogs = await analyticsService.getUserExerciseLogs(userId, 20);
    const latestRecovery = await recoveryService.getLatestRecovery(userId);

    const previousDaySummary = latestRecovery ? {
      date: latestRecovery.log_date || 'Yesterday',
      sleepHours: parseFloat(latestRecovery.sleep_hours) || 7.5,
      sleepEfficiency: latestRecovery.sleep_efficiency || 90,
      hrvMs: latestRecovery.hrv_ms || 65,
      soreness: latestRecovery.muscle_soreness || 'Low',
      readinessPercentage: latestRecovery.readiness_percentage || 85,
      workoutTitle: lastWorkout?.title || 'None',
    } : undefined;

    const ctx: WorkoutGenerationContext = {
      userName: userProfile?.name || 'Athlete',
      gender: userProfile?.gender || 'male',
      goal: userProfile?.goal || 'Muscle Gain & Hypertrophy',
      weightKg: parseFloat(userProfile?.weight_kg) || 75,
      equipment: userProfile?.equipment || 'Commercial Gym',
      injuries: userProfile?.injuries || ['None'],
      timeCommitment: userProfile?.time_commitment || '45 mins',
      dayNumber: history.length,
      missedDaysCount,
      lastWorkout: lastWorkout ? {
        title: lastWorkout.title,
        targetMuscles: lastWorkout.target_muscles || [],
        exercises: (lastWorkout.exercises || []).map((e: any) => e.name),
        durationMinutes: lastWorkout.duration_minutes || 45,
      } : undefined,
      lastFeedback: lastFeedback && lastWorkout?.status === 'completed' ? lastFeedback : undefined,
      userExerciseLogs,
      previousDaySummary,
    };

    const plan = await generateAdaptiveWorkoutWithGroq(ctx);

    // Save to DB
    const savedWorkout = await workoutService.saveWorkout(userId, {
      title: plan.title,
      durationMinutes: plan.durationMinutes,
      estimatedCalories: plan.estimatedCalories,
      targetMuscles: plan.targetMuscles,
      whyRecommendation: plan.whyRecommendation,
      aiReasoning: plan.aiReasoning,
      readinessScore: plan.readinessScore,
      adaptations: plan.adaptations,
      analysisSteps: plan.analysisSteps,
      exercises: plan.exercises.map(e => ({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        restSec: e.restSec,
        icon: e.icon,
        tip: e.tip,
        targetMuscle: e.targetMuscle,
        videoUrl: e.videoUrl,
        steps: e.steps,
      })),
    });

    // Commit to version control
    const exercises = plan.exercises.map((e, i) => ({
      id: String(savedWorkout?.exercises?.[i]?.id || i),
      name: e.name,
      targetMuscle: e.targetMuscle,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.restSec,
      rpeTarget: 7,
    }));

    versionControlService.commitNewVersion(
      userId,
      {
        versionId: '',
        title: plan.title,
        estimatedMinutes: plan.durationMinutes,
        readinessScore: plan.readinessScore,
        aiExplanation: plan.aiReasoning,
        exercises,
        conflictsDetected: [],
        fatigueWarning: plan.readinessScore < 55 ? 'Low readiness — reduced volume protocol' : undefined,
        adaptations: plan.adaptations,
        commitMessage: plan.commitMessage,
      } as any,
      'FitAI Engine',
      plan.commitMessage
    );

    res.json({
      success: true,
      data: { ...savedWorkout, ai_reasoning: plan.aiReasoning, readiness_score: plan.readinessScore, adaptations: plan.adaptations },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
