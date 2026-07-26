import { Router, Response } from 'express';
import { db } from '../core/database';
import { generateAdaptiveWorkoutWithGroq, WorkoutGenerationContext } from '../services/workoutAiService';
import { versionControlService } from '../services/versionControlService';
import { authenticateToken, AuthenticatedRequest } from '../core/authMiddleware';

const router = Router();

// ─── GET TODAY'S STATE ───────────────────────────────────────────────────────
// Returns: { scenario, workout, streak, totalWorkouts, missedCount }
// Scenarios: 'FIRST_DAY' | 'HAS_WORKOUT_TODAY' | 'COMPLETED_TODAY' | 'READY_TO_GENERATE'
router.get('/today', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;

    // Auto-mark any pending workouts from past days as missed
    await db.markMissedWorkoutsBeforeToday(userId);

    const history = await db.getWorkoutHistory(userId);
    const streak = await db.getWorkoutStreak(userId, 7);
    const todayWorkout = await db.getTodayWorkout(userId);

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
});

// ─── GENERATE ADAPTIVE WORKOUT ───────────────────────────────────────────────
router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const userProfile = await db.getUser(userId);
    const history = await db.getWorkoutHistory(userId, 20);

    // Build last workout context
    const lastWorkout = history.length > 0 ? history[0] : null;
    const lastFeedback = lastWorkout ? {
      energy: lastWorkout.feedback_energy || 3,
      soreness: lastWorkout.feedback_soreness || 3,
      mood: lastWorkout.feedback_mood || 3,
      notes: lastWorkout.feedback_notes || '',
    } : undefined;

    // Count consecutive missed days
    const streak = await db.getWorkoutStreak(userId, 7);
    const today = new Date().toISOString().split('T')[0];
    let missedDaysCount = 0;
    for (let i = streak.length - 2; i >= 0; i--) {
      if (streak[i].status === 'missed') missedDaysCount++;
      else if (streak[i].status === 'completed') break;
    }

    const ctx: WorkoutGenerationContext = {
      userName: userProfile?.name || 'Athlete',
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
    };

    const plan = await generateAdaptiveWorkoutWithGroq(ctx);

    // Save to DB with session_date = today
    const savedWorkout = await db.saveWorkout(userId, {
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
});

// ─── MARK WORKOUT COMPLETE ───────────────────────────────────────────────────
router.post('/:id/complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const workoutId = parseInt(String(rawId), 10);
    const { energy = 3, soreness = 3, mood = 3, notes = '' } = req.body;
    const result = await db.markWorkoutComplete(workoutId, { energy, soreness, mood, notes });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── MARK WORKOUT MISSED ─────────────────────────────────────────────────────
router.post('/:id/miss', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const workoutId = parseInt(String(rawId), 10);
    const result = await db.markWorkoutMissed(workoutId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── TOGGLE EXERCISE COMPLETION ──────────────────────────────────────────────
router.put('/exercise/:id/toggle', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const exerciseId = parseInt(String(rawId), 10);
    const { isCompleted } = req.body;
    const result = await db.toggleExerciseCompletion(exerciseId, !!isCompleted);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET STREAK (7 DAYS) ─────────────────────────────────────────────────────
router.get('/streak', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const days = parseInt(String(req.query.days || '7'), 10);
    const streak = await db.getWorkoutStreak(userId, days);
    res.json({ success: true, data: streak });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET WORKOUT HISTORY ─────────────────────────────────────────────────────
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const history = await db.getWorkoutHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET LATEST WORKOUT ──────────────────────────────────────────────────────
router.get('/latest', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const workout = await db.getLatestWorkout(userId);
    res.json({ success: true, data: workout });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── VERSION CONTROL: GET HISTORY ───────────────────────────────────────────
router.get('/version-control/history', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const history = versionControlService.getHistory(userId);
    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── VERSION CONTROL: ROLLBACK ───────────────────────────────────────────────
router.post('/version-control/rollback', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const { targetVersionId } = req.body;
    const result = versionControlService.rollbackToVersion(userId, targetVersionId);
    if (!result) return res.status(404).json({ success: false, error: 'Target commit version not found.' });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── LEGACY SET COMPLETE ─────────────────────────────────────────────────────
router.post('/set-complete', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exerciseId, completedSets } = req.body;
    const result = await db.updateExerciseSets(exerciseId, completedSets);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
