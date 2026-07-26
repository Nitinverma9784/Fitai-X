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
  analysisSteps: string[];
}

function buildAdaptivePrompt(ctx: WorkoutGenerationContext): string {
  const isFirstDay = ctx.dayNumber === 0;
  const hasMissedDays = ctx.missedDaysCount > 0;
  const hasFeedback = !!ctx.lastFeedback;
  const highSoreness = hasFeedback && ctx.lastFeedback!.soreness >= 4;
  const lowEnergy = hasFeedback && ctx.lastFeedback!.energy <= 2;
  const highEnergy = hasFeedback && ctx.lastFeedback!.energy >= 4;

  let contextBlock = '';

  if (isFirstDay) {
    contextBlock = `This is ${ctx.userName}'s FIRST EVER workout session. Design a welcoming, balanced Full Body introductory session. Focus on foundational movements, proper form, and moderate intensity.`;
  } else {
    if (hasMissedDays) {
      contextBlock += `The user missed ${ctx.missedDaysCount} day(s). Reduce total volume by ~20% for smooth re-engagement. `;
    }
    if (ctx.lastWorkout) {
      contextBlock += `PREVIOUS SESSION: "${ctx.lastWorkout.title}" targeting [${(ctx.lastWorkout.targetMuscles || []).join(', ')}] with exercises: ${ctx.lastWorkout.exercises.slice(0, 4).join(', ')}. `;
      contextBlock += `CRITICAL RULE: DO NOT repeat muscle groups trained in the previous session (${(ctx.lastWorkout.targetMuscles || []).join(', ')}). Select complementary muscle groups (e.g. if previous was Chest/Push, pick Back/Pull or Legs). `;
    }
    if (hasFeedback) {
      contextBlock += `PREVIOUS SESSION FEEDBACK: Energy ${ctx.lastFeedback!.energy}/5, Soreness ${ctx.lastFeedback!.soreness}/5, Mood ${ctx.lastFeedback!.mood}/5. `;
      if (ctx.lastFeedback!.notes) {
        contextBlock += `User Feedback Notes: "${ctx.lastFeedback!.notes}". Address this note directly in exercise selection and reasoning! `;
      }
    }
    if (highSoreness) {
      contextBlock += `HIGH SORENESS (${ctx.lastFeedback!.soreness}/5) REPORTED: Lower total sets per exercise (2-3 max), extend rest periods to 75-90s, avoid heavy axial loading. `;
    }
    if (lowEnergy) {
      contextBlock += `LOW ENERGY (${ctx.lastFeedback!.energy}/5) REPORTED: Keep session concise (30 mins), 3-4 exercises max, moderate effort only. `;
    }
    if (highEnergy && !highSoreness) {
      contextBlock += `HIGH ENERGY (${ctx.lastFeedback!.energy}/5) REPORTED: Optimize progressive overload (+1 set or higher intensity) for maximum growth. `;
    }
  }

  const equipmentMap: Record<string, string> = {
    'Commercial Gym': 'Full gym equipment: barbells, dumbbells, cables, machines',
    'Home Gym': 'Dumbbells, resistance bands, pull-up bar',
    'Bodyweight Only': 'No equipment — bodyweight exercises only',
    'Hotel Room': 'Bodyweight movements, dumbbells if available',
  };
  const equipmentDesc = equipmentMap[ctx.equipment] || ctx.equipment;
  const injuryBlock = ctx.injuries && ctx.injuries.length > 0 && ctx.injuries[0] !== 'None'
    ? `AVOID EXERCISES STRESSING: ${ctx.injuries.join(', ')}. ` : '';

  return `You are FitAI Pro, an elite strength & conditioning AI coach. Generate a dynamic JSON workout plan based strictly on these parameters:

User: ${ctx.userName}
Goal: ${ctx.goal}
Weight: ${ctx.weightKg}kg
Equipment: ${equipmentDesc}
${injuryBlock}Time Available: ${ctx.timeCommitment || '45 mins'}
Session #${ctx.dayNumber + 1}

ADAPTIVE CONTEXT & FEEDBACK:
${contextBlock}

Return ONLY valid JSON in this exact structure (no markdown fences, no text outside JSON):
{
  "title": "Short descriptive workout title",
  "durationMinutes": 45,
  "estimatedCalories": 380,
  "targetMuscles": ["Back", "Biceps"],
  "whyRecommendation": "One clear sentence explaining why this workout is assigned today based on yesterday's work and recovery",
  "aiReasoning": "2-3 sentences detailing how yesterday's feedback (Energy, Soreness, Notes) shaped today's exercise selection",
  "readinessScore": 82,
  "commitMessage": "feat: adaptive pull session following push day",
  "adaptations": [
    "Rotated target from Chest to Back & Biceps for 100% recovery",
    "Energy (4/5) -> Maintained 4 working sets on primary compound move"
  ],
  "analysisSteps": [
    "Step 1: Evaluated previous session history and feedback scores",
    "Step 2: Calculated target muscle readiness and recovery index",
    "Step 3: Selected optimal exercise split for available equipment",
    "Step 4: Applied volume & intensity micro-adjustments"
  ],
  "exercises": [
    {
      "name": "Lat Pulldown",
      "sets": 4,
      "reps": "10-12",
      "restSec": 60,
      "icon": "dumbbell",
      "tip": "Pull through the elbows, keep chest high.",
      "targetMuscle": "Back"
    }
  ]
}

Generate 4 to 5 tailored exercises. Icon choices: dumbbell, activity, zap, target, heart, flame, shield, clock.`;
}

function generateFallbackWorkout(ctx: WorkoutGenerationContext): AdaptiveWorkoutPlan {
  const isFirstDay = ctx.dayNumber === 0;
  const hasMissedDays = ctx.missedDaysCount > 0;
  const lastMuscles = (ctx.lastWorkout?.targetMuscles || []).map(m => m.toLowerCase());
  const energy = ctx.lastFeedback?.energy ?? 3;
  const soreness = ctx.lastFeedback?.soreness ?? 3;
  const highSoreness = soreness >= 4;
  const lowEnergy = energy <= 2;
  const highEnergy = energy >= 4;

  // Smart split rotation logic based on previous session's target muscles
  let targetGroup = 'Full Body';
  if (!isFirstDay) {
    const isLastChest = lastMuscles.some(m => m.includes('chest') || m.includes('push') || m.includes('triceps'));
    const isLastBack = lastMuscles.some(m => m.includes('back') || m.includes('pull') || m.includes('biceps'));
    const isLastLegs = lastMuscles.some(m => m.includes('leg') || m.includes('quad') || m.includes('glute') || m.includes('lower'));

    if (isLastChest) {
      targetGroup = 'Back & Biceps';
    } else if (isLastBack) {
      targetGroup = 'Legs & Glutes';
    } else if (isLastLegs) {
      targetGroup = 'Shoulders & Arms';
    } else {
      // Rotation based on day number
      const splits = ['Back & Biceps', 'Legs & Glutes', 'Shoulders & Arms', 'Chest & Triceps'];
      targetGroup = splits[ctx.dayNumber % splits.length];
    }
  }

  const exerciseCatalog: Record<string, GeneratedExercise[]> = {
    'Full Body': [
      { name: 'Goblet Squat', sets: 3, reps: '10-12', restSec: 60, icon: 'dumbbell', tip: 'Brace core, keep chest high.', targetMuscle: 'Legs' },
      { name: 'Dumbbell Incline Bench Press', sets: 3, reps: '10-12', restSec: 60, icon: 'activity', tip: 'Control the descent for 2s per rep.', targetMuscle: 'Chest' },
      { name: 'Lat Pulldown', sets: 3, reps: '10-12', restSec: 60, icon: 'dumbbell', tip: 'Drive elbows down towards hips.', targetMuscle: 'Back' },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10', restSec: 60, icon: 'zap', tip: 'Keep palms facing forward.', targetMuscle: 'Shoulders' },
    ],
    'Chest & Triceps': [
      { name: 'Incline Dumbbell Bench Press', sets: 4, reps: '10-12', restSec: 60, icon: 'dumbbell', tip: 'Focus on upper chest contraction at top.', targetMuscle: 'Chest' },
      { name: 'Cable Chest Flyes', sets: 3, reps: '12-15', restSec: 45, icon: 'activity', tip: 'Squeeze inner chest at peak contraction.', targetMuscle: 'Chest' },
      { name: 'Rope Tricep Pushdown', sets: 4, reps: '12-15', restSec: 45, icon: 'zap', tip: 'Spread the rope at bottom of movement.', targetMuscle: 'Triceps' },
      { name: 'Overhead Dumbbell Extension', sets: 3, reps: '10-12', restSec: 60, icon: 'dumbbell', tip: 'Keep elbows tucked near ears.', targetMuscle: 'Triceps' },
    ],
    'Back & Biceps': [
      { name: 'Lat Pulldown (Wide Grip)', sets: 4, reps: '10-12', restSec: 60, icon: 'dumbbell', tip: 'Pull through elbows to isolate latissimus dorsi.', targetMuscle: 'Back' },
      { name: 'Seated Cable Row', sets: 4, reps: '10-12', restSec: 60, icon: 'activity', tip: 'Squeeze shoulder blades together for 1s.', targetMuscle: 'Back' },
      { name: 'Incline Dumbbell Bicep Curl', sets: 3, reps: '10-12', restSec: 45, icon: 'dumbbell', tip: 'Strict form — full stretch at the bottom.', targetMuscle: 'Biceps' },
      { name: 'EZ-Bar Hammer Curl', sets: 3, reps: '12', restSec: 45, icon: 'zap', tip: 'Targets brachialis for thicker upper arms.', targetMuscle: 'Biceps' },
    ],
    'Legs & Glutes': [
      { name: 'Barbell / Dumbbell Squat', sets: 4, reps: '8-10', restSec: 90, icon: 'dumbbell', tip: 'Break parallel for complete quad and glute engagement.', targetMuscle: 'Legs' },
      { name: 'Romanian Deadlift (RDL)', sets: 4, reps: '10-12', restSec: 75, icon: 'activity', tip: 'Hinge at hips, maintain soft knee bend.', targetMuscle: 'Hamstrings' },
      { name: 'Leg Extension Machine', sets: 3, reps: '12-15', restSec: 60, icon: 'zap', tip: 'Hold top extension for 1s peak squeeze.', targetMuscle: 'Quads' },
      { name: 'Seated Calf Raise', sets: 4, reps: '15-20', restSec: 45, icon: 'target', tip: 'Deep stretch at bottom, explosive drive up.', targetMuscle: 'Calves' },
    ],
    'Shoulders & Arms': [
      { name: 'Overhead Dumbbell Press', sets: 4, reps: '8-10', restSec: 75, icon: 'dumbbell', tip: 'Keep core tight, press straight overhead.', targetMuscle: 'Shoulders' },
      { name: 'Dumbbell Lateral Raise', sets: 4, reps: '12-15', restSec: 45, icon: 'activity', tip: 'Slight forward lean, lead with elbows.', targetMuscle: 'Shoulders' },
      { name: 'Preacher Bicep Curl', sets: 3, reps: '10-12', restSec: 45, icon: 'dumbbell', tip: 'Avoid locking out elbows at bottom.', targetMuscle: 'Biceps' },
      { name: 'Skull Crushers (Lying Tricep)', sets: 3, reps: '10-12', restSec: 60, icon: 'zap', tip: 'Keep upper arms perpendicular to torso.', targetMuscle: 'Triceps' },
    ],
  };

  const rawExercises = exerciseCatalog[targetGroup] || exerciseCatalog['Full Body'];

  // Adjust volume & sets dynamically based on feedback
  const exercises = rawExercises.map(ex => {
    let sets = ex.sets;
    let restSec = ex.restSec;
    if (highSoreness) {
      sets = Math.max(2, sets - 1);
      restSec += 25;
    } else if (highEnergy && !highSoreness) {
      sets = Math.min(5, sets + 1);
    }
    if (lowEnergy) {
      sets = Math.max(2, sets - 1);
    }
    return { ...ex, sets, restSec };
  });

  const targetMuscles = [...new Set(exercises.map(e => e.targetMuscle))];
  const duration = isFirstDay ? 35 : lowEnergy ? 30 : 45;
  const calories = isFirstDay ? 290 : highEnergy ? 440 : 380;
  const readinessScore = highSoreness ? 58 : lowEnergy ? 62 : highEnergy ? 88 : 78;

  const adaptations: string[] = [];
  if (isFirstDay) {
    adaptations.push('First session: Balanced full-body movement patterns');
  } else if (ctx.lastWorkout) {
    adaptations.push(`Rotated target group from ${ctx.lastWorkout.targetMuscles.join('/')} to ${targetGroup} for recovery`);
  }
  if (ctx.lastFeedback) {
    if (highSoreness) adaptations.push(`Soreness ${soreness}/5 detected -> Reduced sets & added rest time`);
    if (lowEnergy) adaptations.push(`Energy ${energy}/5 reported -> Streamlined session duration to 30m`);
    if (highEnergy) adaptations.push(`Energy ${energy}/5 reported -> Progressive overload volume applied (+1 set)`);
    if (ctx.lastFeedback.notes) adaptations.push(`User Note addressed: "${ctx.lastFeedback.notes}"`);
  }
  if (hasMissedDays) {
    adaptations.push(`Re-engagement protocol active (${ctx.missedDaysCount} missed day(s))`);
  }

  const lastSessionTitle = ctx.lastWorkout?.title || 'Previous Session';
  const whyRecommendation = isFirstDay
    ? 'Welcome! This introductory session establishes your strength baseline safely.'
    : `Designed targeting ${targetGroup} while muscles from "${lastSessionTitle}" recover.`;

  const aiReasoning = isFirstDay
    ? 'First workout generated with moderate intensity and fundamental compound patterns.'
    : `Based on yesterday's feedback (Energy: ${energy}/5, Soreness: ${soreness}/5), today's focus shifts to ${targetGroup}. Volume and rest intervals have been adjusted accordingly.`;

  const analysisSteps = [
    `Analyzing Session #${ctx.dayNumber + 1} context & previous workout ("${lastSessionTitle}")`,
    `Checking feedback: Energy ${energy}/5 • Soreness ${soreness}/5 • Mood ${ctx.lastFeedback?.mood ?? 4}/5`,
    `Selecting target group: ${targetGroup} (allowing recovery for ${lastMuscles.join('/') || 'prior muscles'})`,
    `Configuring ${exercises.length} customized exercises for equipment: ${ctx.equipment}`,
  ];

  return {
    title: isFirstDay ? 'Welcome — Full Body Intro' : `${targetGroup} Hypertrophy`,
    durationMinutes: duration,
    estimatedCalories: calories,
    targetMuscles,
    whyRecommendation,
    aiReasoning,
    readinessScore,
    exercises,
    commitMessage: isFirstDay ? 'init: first workout session' : `feat: ${targetGroup.toLowerCase().replace(' & ', '-').replace(' ', '-')} session`,
    adaptations,
    analysisSteps,
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

        const fallback = generateFallbackWorkout(ctx);

        return {
          title: parsed.title || fallback.title,
          durationMinutes: parsed.durationMinutes || fallback.durationMinutes,
          estimatedCalories: parsed.estimatedCalories || fallback.estimatedCalories,
          targetMuscles: parsed.targetMuscles || fallback.targetMuscles,
          whyRecommendation: parsed.whyRecommendation || fallback.whyRecommendation,
          aiReasoning: parsed.aiReasoning || fallback.aiReasoning,
          readinessScore: parsed.readinessScore || fallback.readinessScore,
          exercises: (parsed.exercises && parsed.exercises.length > 0)
            ? parsed.exercises.map((e: any) => ({
                name: e.name,
                sets: e.sets || 3,
                reps: e.reps || '10-12',
                restSec: e.restSec || 60,
                icon: e.icon || 'dumbbell',
                tip: e.tip || '',
                targetMuscle: e.targetMuscle || '',
              }))
            : fallback.exercises,
          commitMessage: parsed.commitMessage || fallback.commitMessage,
          adaptations: parsed.adaptations || fallback.adaptations,
          analysisSteps: parsed.analysisSteps || fallback.analysisSteps,
        };
      }
    } catch (err: any) {
      console.error('Groq workout generation error:', err.message);
    }
  }

  console.log('⚡ Using dynamic adaptive fallback workout generator');
  return generateFallbackWorkout(ctx);
}

