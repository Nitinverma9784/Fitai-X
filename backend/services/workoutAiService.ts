import { getNextGroqClient, config } from '../core/config';

export interface WorkoutGenerationContext {
  userName: string;
  goal: string;
  weightKg: number;
  equipment: string;
  injuries: string[];
  timeCommitment: string;
  dayNumber: number;
  missedDaysCount: number;
  lastWorkout?: {
    title: string;
    targetMuscles: string[];
    exercises: string[];
    durationMinutes: number;
  };
  lastFeedback?: {
    energy: number;
    soreness: number;
    mood: number;
    notes?: string;
  };
  recoveryScore?: number;
}

export interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  icon: string;
  tip: string;
  targetMuscle: string;
}

export interface AdaptiveWorkoutPlan {
  title: string;
  durationMinutes: number;
  estimatedCalories: number;
  targetMuscles: string[];
  whyRecommendation: string;
  aiReasoning: string;
  readinessScore: number;
  exercises: GeneratedExercise[];
  commitMessage: string;
  adaptations: string[];
}

function buildAdaptivePrompt(ctx: WorkoutGenerationContext): string {
  const isFirstDay = ctx.dayNumber === 0;
  const hasMissedDays = ctx.missedDaysCount > 0;
  const hasFeedback = !!ctx.lastFeedback;
  const highSoreness = hasFeedback && ctx.lastFeedback!.soreness >= 4;
  const lowEnergy = hasFeedback && ctx.lastFeedback!.energy <= 2;

  let contextBlock = '';

  if (isFirstDay) {
    contextBlock = `This is ${ctx.userName}'s FIRST EVER workout. Design a welcoming, full-body beginner session. Keep intensity moderate, focus on form, and be encouraging.`;
  } else {
    if (hasMissedDays) contextBlock += `The user missed ${ctx.missedDaysCount} day(s). Reduce volume by ~20% and start with a re-engagement plan. `;
    if (ctx.lastWorkout) {
      contextBlock += `Last session: "${ctx.lastWorkout.title}" targeting [${ctx.lastWorkout.targetMuscles.join(', ')}] with exercises: ${ctx.lastWorkout.exercises.slice(0, 4).join(', ')}. `;
      contextBlock += `DO NOT repeat the same muscle groups as last session (${ctx.lastWorkout.targetMuscles.join(', ')}) — pick complementary muscle groups. `;
    }
    if (hasFeedback) {
      contextBlock += `Post-workout feedback: Energy ${ctx.lastFeedback!.energy}/5, Soreness ${ctx.lastFeedback!.soreness}/5, Mood ${ctx.lastFeedback!.mood}/5. `;
      if (ctx.lastFeedback!.notes) contextBlock += `User note: "${ctx.lastFeedback!.notes}". `;
    }
    if (highSoreness) contextBlock += `HIGH SORENESS reported — reduce intensity, add extra rest, avoid sore muscles. `;
    if (lowEnergy) contextBlock += `LOW ENERGY reported — shorter session (30 min max), moderate intensity only. `;
  }

  const equipmentMap: Record<string, string> = {
    'Commercial Gym': 'Full gym equipment: barbells, dumbbells, cables, machines',
    'Home Gym': 'Dumbbells, resistance bands, pull-up bar',
    'Bodyweight Only': 'No equipment — bodyweight only',
    'Hotel Room': 'Bodyweight only, limited space',
  };
  const equipmentDesc = equipmentMap[ctx.equipment] || ctx.equipment;
  const injuryBlock = ctx.injuries && ctx.injuries.length > 0 && ctx.injuries[0] !== 'None'
    ? `Avoid exercises stressing: ${ctx.injuries.join(', ')}. ` : '';

  return `You are an expert personal trainer generating an adaptive workout plan. Generate a JSON workout plan based on these parameters:

User: ${ctx.userName}
Goal: ${ctx.goal}
Weight: ${ctx.weightKg}kg
Equipment: ${equipmentDesc}
${injuryBlock}Time Available: ${ctx.timeCommitment || '45 mins'}
Session #${ctx.dayNumber + 1}

ADAPTIVE CONTEXT:
${contextBlock}

Return ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{
  "title": "Short workout title",
  "durationMinutes": 45,
  "estimatedCalories": 380,
  "targetMuscles": ["Back", "Biceps"],
  "whyRecommendation": "One sentence explaining why this workout fits today",
  "aiReasoning": "2-3 sentences explaining the adaptive logic",
  "readinessScore": 75,
  "commitMessage": "feat: back+bicep session after chest day",
  "adaptations": ["Switched from chest to back for recovery"],
  "exercises": [
    {
      "name": "Lat Pulldown",
      "sets": 4,
      "reps": "10-12",
      "restSec": 60,
      "icon": "dumbbell",
      "tip": "Pull through the elbows, not the hands.",
      "targetMuscle": "Back"
    }
  ]
}

Generate 4-6 exercises. Icon must be one of: dumbbell, activity, zap, target, heart, flame, shield, clock.`;
}

function generateFallbackWorkout(ctx: WorkoutGenerationContext): AdaptiveWorkoutPlan {
  const isFirstDay = ctx.dayNumber === 0;
  const hasMissedDays = ctx.missedDaysCount > 0;
  const highSoreness = !!(ctx.lastFeedback?.soreness && ctx.lastFeedback.soreness >= 4);
  const lastMuscles = ctx.lastWorkout?.targetMuscles || [];

  const allGroups = ['Chest & Triceps', 'Back & Biceps', 'Legs & Glutes', 'Shoulders & Arms', 'Full Body'];
  const usedGroup = lastMuscles[0]?.toLowerCase().split(' ')[0] || '';
  const available = allGroups.filter(g => !g.toLowerCase().startsWith(usedGroup));
  const targetGroup = isFirstDay ? 'Full Body' : (available[0] || 'Full Body');

  const exerciseSets: Record<string, GeneratedExercise[]> = {
    'Full Body': [
      { name: 'Goblet Squat', sets: 3, reps: '12', restSec: 60, icon: 'dumbbell', tip: 'Keep chest up and knees tracking over toes.', targetMuscle: 'Legs' },
      { name: 'Push-Ups', sets: 3, reps: '15', restSec: 45, icon: 'activity', tip: 'Control the descent for 3 seconds each rep.', targetMuscle: 'Chest' },
      { name: 'Dumbbell Row', sets: 3, reps: '12', restSec: 60, icon: 'dumbbell', tip: 'Drive the elbow back, not the hand.', targetMuscle: 'Back' },
      { name: 'Shoulder Press', sets: 3, reps: '10', restSec: 60, icon: 'zap', tip: 'Press straight up, keep core braced.', targetMuscle: 'Shoulders' },
    ],
    'Chest & Triceps': [
      { name: 'Incline Dumbbell Press', sets: 4, reps: '10-12', restSec: 60, icon: 'dumbbell', tip: 'Keep elbows at 45 degrees for upper chest activation.', targetMuscle: 'Chest' },
      { name: 'Cable Chest Flyes', sets: 3, reps: '12-15', restSec: 45, icon: 'activity', tip: 'Squeeze at peak contraction.', targetMuscle: 'Chest' },
      { name: 'Triceps Dip Machine', sets: 3, reps: '10-12', restSec: 60, icon: 'zap', tip: 'Control the eccentric for 3 seconds per rep.', targetMuscle: 'Triceps' },
      { name: 'Overhead Tricep Extension', sets: 3, reps: '12', restSec: 45, icon: 'dumbbell', tip: 'Keep elbows pointing forward throughout.', targetMuscle: 'Triceps' },
    ],
    'Back & Biceps': [
      { name: 'Lat Pulldown', sets: 4, reps: '10-12', restSec: 60, icon: 'dumbbell', tip: 'Pull through the elbows, not the hands.', targetMuscle: 'Back' },
      { name: 'Seated Cable Row', sets: 3, reps: '10-12', restSec: 60, icon: 'activity', tip: 'Keep chest up, squeeze shoulder blades together.', targetMuscle: 'Back' },
      { name: 'Dumbbell Curl', sets: 3, reps: '12', restSec: 45, icon: 'dumbbell', tip: 'Avoid swinging — use full range of motion.', targetMuscle: 'Biceps' },
      { name: 'Hammer Curl', sets: 3, reps: '12', restSec: 45, icon: 'zap', tip: 'Neutral grip targets the brachialis for arm thickness.', targetMuscle: 'Biceps' },
    ],
    'Legs & Glutes': [
      { name: 'Barbell Squat', sets: 4, reps: '8-10', restSec: 90, icon: 'dumbbell', tip: 'Break parallel for full glute activation.', targetMuscle: 'Legs' },
      { name: 'Romanian Deadlift', sets: 3, reps: '10', restSec: 75, icon: 'activity', tip: 'Hinge at the hip, not the lower back.', targetMuscle: 'Hamstrings' },
      { name: 'Leg Press', sets: 3, reps: '12-15', restSec: 60, icon: 'zap', tip: 'Keep lower back pressed firmly into the pad.', targetMuscle: 'Quads' },
      { name: 'Calf Raise', sets: 4, reps: '20', restSec: 30, icon: 'target', tip: 'Full stretch at bottom, full contraction at top.', targetMuscle: 'Calves' },
    ],
    'Shoulders & Arms': [
      { name: 'Overhead Press', sets: 4, reps: '8-10', restSec: 75, icon: 'dumbbell', tip: 'Brace core and avoid arching your lower back.', targetMuscle: 'Shoulders' },
      { name: 'Lateral Raise', sets: 3, reps: '15', restSec: 45, icon: 'activity', tip: 'Lead with the elbow, not the wrist.', targetMuscle: 'Shoulders' },
      { name: 'EZ Bar Curl', sets: 3, reps: '10', restSec: 60, icon: 'dumbbell', tip: 'Controlled negative builds more muscle.', targetMuscle: 'Biceps' },
      { name: 'Skull Crusher', sets: 3, reps: '12', restSec: 60, icon: 'zap', tip: 'Keep elbows locked in position throughout.', targetMuscle: 'Triceps' },
    ],
  };

  const baseExercises = exerciseSets[targetGroup] || exerciseSets['Full Body'];
  const exercises = baseExercises.map(ex => ({
    ...ex,
    sets: highSoreness ? Math.max(2, ex.sets - 1) : hasMissedDays ? Math.max(2, ex.sets - 1) : ex.sets,
    restSec: highSoreness ? ex.restSec + 30 : ex.restSec,
  }));

  const targetMuscles = [...new Set(exercises.map(e => e.targetMuscle))];
  const cal = isFirstDay ? 280 : highSoreness ? 320 : hasMissedDays ? 350 : 420;
  const dur = isFirstDay ? 35 : highSoreness ? 30 : 45;

  const adaptations: string[] = [];
  if (isFirstDay) adaptations.push('First session — full body with moderate intensity');
  if (hasMissedDays) adaptations.push(`Volume reduced after ${ctx.missedDaysCount} missed day(s)`);
  if (highSoreness) adaptations.push('Intensity lowered due to high soreness reported');
  if (lastMuscles.length > 0) adaptations.push(`Switched from ${lastMuscles.join('/')} to allow full recovery`);

  return {
    title: isFirstDay ? 'Welcome — Full Body Intro Session' : `${targetGroup} Session`,
    durationMinutes: dur,
    estimatedCalories: cal,
    targetMuscles,
    whyRecommendation: isFirstDay
      ? 'Your first session! Full body workout to activate all major muscle groups safely.'
      : `Targeting ${targetGroup} while ${lastMuscles.join('/')} muscles recover from last session.`,
    aiReasoning: adaptations.join('. ') || 'Standard progressive session based on your profile.',
    readinessScore: highSoreness ? 55 : hasMissedDays ? 65 : 78,
    exercises,
    commitMessage: isFirstDay ? 'init: first workout session' : `feat: ${targetGroup.toLowerCase().replace(' & ', '-').replace(' ', '-')} session`,
    adaptations,
  };
}

export async function generateAdaptiveWorkoutWithGroq(ctx: WorkoutGenerationContext): Promise<AdaptiveWorkoutPlan> {
  const { client, keyIndex } = getNextGroqClient();

  if (client) {
    try {
      console.log(`🏋️ Generating adaptive workout via Groq key #${keyIndex + 1}`);
      const prompt = buildAdaptivePrompt(ctx);

      const res = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: config.defaultModel,
        temperature: 0.7,
        max_tokens: 1800,
      });

      const content = res.choices[0]?.message?.content?.trim();
      if (content) {
        const clean = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        const parsed = JSON.parse(clean);
        return {
          title: parsed.title || 'Adaptive Workout Session',
          durationMinutes: parsed.durationMinutes || 45,
          estimatedCalories: parsed.estimatedCalories || 380,
          targetMuscles: parsed.targetMuscles || ['Full Body'],
          whyRecommendation: parsed.whyRecommendation || '',
          aiReasoning: parsed.aiReasoning || '',
          readinessScore: parsed.readinessScore || 70,
          exercises: (parsed.exercises || []).map((e: any) => ({
            name: e.name,
            sets: e.sets || 3,
            reps: e.reps || '10-12',
            restSec: e.restSec || 60,
            icon: e.icon || 'dumbbell',
            tip: e.tip || '',
            targetMuscle: e.targetMuscle || '',
          })),
          commitMessage: parsed.commitMessage || `feat: adaptive session day ${ctx.dayNumber + 1}`,
          adaptations: parsed.adaptations || [],
        };
      }
    } catch (err: any) {
      console.error('Groq workout generation error:', err.message);
    }
  }

  console.log('⚡ Using fallback adaptive workout generator');
  return generateFallbackWorkout(ctx);
}
