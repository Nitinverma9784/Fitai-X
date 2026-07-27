import { getNextGroqClient, config } from '../../core/config';
import { fetchExerciseDbDetails } from './exerciseDbService';
import { generateDecisionExplanation } from '../ai_decision_explanation/generator';

export interface WorkoutGenerationContext {
  userName: string;
  gender?: string;
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
  userExerciseLogs?: Array<{
    exercise_name: string;
    weight_kg: number;
    bar_weight_kg?: number;
    plate_weight_kg?: number;
    reps_achieved: number;
    is_bodyweight: boolean;
  }>;
  previousDaySummary?: {
    date: string;
    sleepHours: number;
    sleepEfficiency: number;
    hrvMs: number;
    soreness: string;
    readinessPercentage: number;
    workoutTitle?: string;
  };
}

export interface GeneratedExercise {
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  icon: string;
  tip: string;
  targetMuscle: string;
  videoUrl?: string;
  imageUrl?: string;
  steps?: string[];
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

// 100% VERIFIED EXERCISES CATEGORIZED BY EQUIPMENT
const VERIFIED_BODYWEIGHT_EXERCISES = [
  'Push-up', 'Clap Push Up', 'Diamond Push up', 'Wide Hand Push up', 'Incline Push-up',
  'Pull-up', 'Chin-ups', 'Suspended Row',
  'Squat', 'Bulgarian Split Squat', 'Single Leg Squat', 'Jump Squat', 'Reverse Lunge', 'Walking Lunge', 'Standing Calf Raise',
  'Triceps Dip', 'Triceps Press',
  'Elbow Up and Down Dynamic Plank', 'Side Lunge'
];

const VERIFIED_DUMBBELL_EXERCISES = [
  ...VERIFIED_BODYWEIGHT_EXERCISES,
  'Bench Press', 'Palms In Incline Bench Press',
  'Dumbbell One Arm Bent-over Row', 'Romanian Deadlift',
  'Seated Shoulder Press', 'Arnold Press', 'Lateral Raise', 'Dumbbell Clean and Press',
  'Goblet Squat', 'Dumbbell Single Leg Calf Raise',
  'Hammer Curl', 'Biceps Leg Concentration Curl',
  'Dumbbell Lying Floor Skull Crusher'
];

const VERIFIED_FULL_GYM_EXERCISES = [
  ...VERIFIED_DUMBBELL_EXERCISES
];

function getEquipmentCategory(equipmentStr: string): 'bodyweight' | 'dumbbell' | 'full' {
  const eq = (equipmentStr || '').toLowerCase();
  if (eq.includes('bodyweight') || eq.includes('no equipment') || eq.includes('hotel')) {
    return 'bodyweight';
  }
  if (eq.includes('home') || eq.includes('dumbbell') || eq.includes('band')) {
    return 'dumbbell';
  }
  return 'full';
}

function getTimeBasedConfig(timeStr: string, lowEnergy = false, highSoreness = false): { targetExercises: number; durationMinutes: number; estimatedCalories: number } {
  const digits = timeStr ? timeStr.match(/\d+/) : null;
  const mins = digits ? parseInt(digits[0], 10) : 45;

  let targetExercises = 5;
  let durationMinutes = mins;

  if (mins <= 20) {
    targetExercises = 3;
    durationMinutes = Math.min(mins, 20);
  } else if (mins <= 35) {
    targetExercises = 4;
    durationMinutes = Math.min(mins, 30);
  } else if (mins <= 50) {
    targetExercises = 5;
    durationMinutes = Math.min(mins, 45);
  } else {
    targetExercises = 6;
    durationMinutes = Math.min(mins, 60);
  }

  if (lowEnergy || highSoreness) {
    targetExercises = Math.max(3, targetExercises - 1);
    durationMinutes = Math.max(20, durationMinutes - 10);
  }

  const estimatedCalories = Math.round(durationMinutes * 8.5);

  return { targetExercises, durationMinutes, estimatedCalories };
}

function buildAdaptivePrompt(ctx: WorkoutGenerationContext): string {
  const isFirstDay = ctx.dayNumber === 0;
  const isOneWeekAdaptation = ctx.dayNumber >= 7;
  const hasMissedDays = ctx.missedDaysCount > 0;
  const hasFeedback = !!ctx.lastFeedback;
  const highSoreness = hasFeedback && ctx.lastFeedback!.soreness >= 4;
  const lowEnergy = hasFeedback && ctx.lastFeedback!.energy <= 2;
  const highEnergy = hasFeedback && ctx.lastFeedback!.energy >= 4;

  const { targetExercises, durationMinutes } = getTimeBasedConfig(ctx.timeCommitment, lowEnergy, highSoreness);

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
    if (isOneWeekAdaptation) {
      contextBlock += `1-WEEK AUTOMATIC INTENSITY ESCALATION: User completed a 1-week training block baseline. Auto-increase working intensity (+2.5kg or +1 set) and document this 1-week progressive overload adaptation explicitly in aiReasoning! `;
    }
    if (highSoreness) {
      contextBlock += `HIGH SORENESS (${ctx.lastFeedback!.soreness}/5) REPORTED: Lower total sets per exercise (2-3 max), extend rest periods to 75-90s, avoid heavy axial loading. `;
    }
    if (lowEnergy) {
      contextBlock += `LOW ENERGY (${ctx.lastFeedback!.energy}/5) REPORTED: Keep session concise (${durationMinutes} mins), 3-4 exercises max, moderate effort only. `;
    }
    if (highEnergy && !highSoreness) {
      contextBlock += `HIGH ENERGY (${ctx.lastFeedback!.energy}/5) REPORTED: Optimize progressive overload (+1 set or higher intensity) for maximum growth. `;
    }
  }

  const prevSummaryBlock = ctx.previousDaySummary
    ? `PREVIOUS DAY RECOVERY & PERFORMANCE SUMMARY (${ctx.previousDaySummary.date}):
- Logged Sleep: ${ctx.previousDaySummary.sleepHours} hrs (${ctx.previousDaySummary.sleepEfficiency}% efficiency)
- Wearable HRV: ${ctx.previousDaySummary.hrvMs} ms
- Muscle Soreness: ${ctx.previousDaySummary.soreness}
- Calculated Bio-Readiness: ${ctx.previousDaySummary.readinessPercentage}%
- Previous Workout: ${ctx.previousDaySummary.workoutTitle || 'None'}
ADAPTATION DIRECTIVE: Calculate today's workload based on this exact summary! If previous day readiness < 75% or sleep < 6.5h, lower total volume by 15-20% and prioritize recovery.`
    : '';

  const logsBlock = ctx.userExerciseLogs && ctx.userExerciseLogs.length > 0
    ? `USER RECORDED EXERCISE LOGS & PERFORMANCE:
${ctx.userExerciseLogs.map(l => l.is_bodyweight ? `- "${l.exercise_name}": ${l.reps_achieved} bodyweight reps max` : `- "${l.exercise_name}": ${l.weight_kg}kg total weight (${l.bar_weight_kg ? l.bar_weight_kg + 'kg bar + ' + l.plate_weight_kg + 'kg plates' : 'weight'}) × ${l.reps_achieved} reps`).join('\n')}
PROGRESSIVE OVERLOAD DIRECTIVE: Automatically scale working weight or target rep ranges based on these recorded numbers!`
    : '';

  const eqCat = getEquipmentCategory(ctx.equipment);
  let allowedList = VERIFIED_FULL_GYM_EXERCISES;
  let equipmentConstraintNote = '';

  if (eqCat === 'bodyweight') {
    allowedList = VERIFIED_BODYWEIGHT_EXERCISES;
    equipmentConstraintNote = `STRICT EQUIPMENT MANDATE: User selected BODYWEIGHT ONLY. You MUST select ONLY bodyweight exercises (Push-up, Pull-up, Squat, Triceps Dip, Bulgarian Split Squat, Plank, etc.). Absolutely NO barbells, dumbbells, or heavy gym equipment!`;
  } else if (eqCat === 'dumbbell') {
    allowedList = VERIFIED_DUMBBELL_EXERCISES;
    equipmentConstraintNote = `EQUIPMENT MANDATE: User selected HOME GYM / DUMBBELLS. Select dumbbells or bodyweight exercises (Dumbbell Row, Seated Shoulder Press, Goblet Squat, Push-up, Hammer Curl, etc.).`;
  } else {
    equipmentConstraintNote = `EQUIPMENT MANDATE: Commercial Gym access — barbells, dumbbells, machines, and bodyweight exercises.`;
  }

  const injuryBlock = ctx.injuries && ctx.injuries.length > 0 && ctx.injuries[0] !== 'None'
    ? `INJURY RESTRICTIONS: User has injuries/limitations: [${ctx.injuries.join(', ')}]. AVOID any exercises stressing these joint/muscle areas! ` : '';

  return `You are FitAI Pro, an elite strength & conditioning AI coach. Generate a dynamic JSON workout plan based strictly on these parameters:

User: ${ctx.userName}
Goal: ${ctx.goal}
Weight: ${ctx.weightKg}kg
Equipment: ${ctx.equipment}
${equipmentConstraintNote}
${injuryBlock}Time Selection (Onboarding): ${ctx.timeCommitment || '45 mins'} -> Target Duration: ${durationMinutes} mins
Session #${ctx.dayNumber + 1}

ALLOWED VERIFIED EXERCISES (Select ONLY from this list to guarantee 100% video demo matching):
${allowedList.map(e => `"${e}"`).join(', ')}

${logsBlock}

ADAPTIVE CONTEXT & FEEDBACK:
${contextBlock}

CRITICAL MANDATES:
1. EXERCISE COUNT: User selected ${ctx.timeCommitment} in onboarding (${durationMinutes} mins target duration). Generate EXACTLY ${targetExercises} exercises in the exercises array (no more, no less).
2. EQUIPMENT MATCHING: Select exercise names ONLY from the ALLOWED VERIFIED EXERCISES list above matching ${ctx.equipment}.

Return ONLY valid JSON in this exact structure (no markdown fences, no text outside JSON):
{
  "title": "Short descriptive workout title",
  "durationMinutes": ${durationMinutes},
  "estimatedCalories": 380,
  "targetMuscles": ["Chest", "Triceps"],
  "whyRecommendation": "One clear sentence explaining why this ${durationMinutes}-minute workout is assigned today based on onboarding time (${ctx.timeCommitment}) and equipment (${ctx.equipment})",
  "aiReasoning": "2-3 sentences detailing how onboarding time (${ctx.timeCommitment}), recorded weight/rep logs, and 1-week adaptation shaped today's ${targetExercises}-exercise routine",
  "readinessScore": 82,
  "commitMessage": "feat: adaptive ${ctx.equipment} session (${durationMinutes}m)",
  "adaptations": [
    "Matched exercises strictly to onboarding equipment (${ctx.equipment})",
    "Set exercise count (${targetExercises} exercises) based on onboarding time selection (${ctx.timeCommitment})"
  ],
  "analysisSteps": [
    "Step 1: Analyzed onboarding parameters (equipment: ${ctx.equipment}, time: ${ctx.timeCommitment})",
    "Step 2: Calculated target exercise count (${targetExercises} exercises for ${durationMinutes}m duration)",
    "Step 3: Applied recorded weight/rep performance logs for progressive overload",
    "Step 4: Filtered exercises matching exact equipment availability"
  ],
  "exercises": [
    {
      "name": "${allowedList[0]}",
      "sets": 4,
      "reps": "10-12",
      "restSec": 60,
      "icon": "dumbbell",
      "tip": "Proper posture and controlled tempo.",
      "targetMuscle": "Chest"
    }
  ]
}

Generate EXACTLY ${targetExercises} tailored exercises. Icon choices: dumbbell, activity, zap, target, heart, flame, shield, clock.`;
}

export async function generateAdaptiveWorkoutWithGroq(
  ctx: WorkoutGenerationContext
): Promise<AdaptiveWorkoutPlan> {
  const prompt = buildAdaptivePrompt(ctx);
  let resultPlan: AdaptiveWorkoutPlan | null = null;
  const hasFeedback = !!ctx.lastFeedback;
  const highSoreness = hasFeedback && ctx.lastFeedback!.soreness >= 4;
  const lowEnergy = hasFeedback && ctx.lastFeedback!.energy <= 2;

  const { targetExercises, durationMinutes, estimatedCalories } = getTimeBasedConfig(ctx.timeCommitment, lowEnergy, highSoreness);

  const { client, totalKeys } = require('../core/config').getNextGroqClient();
  if (!client || totalKeys === 0) {
    throw new Error('Groq AI API key is missing or invalid in backend configuration. Please add a valid GROQ_API_KEY_1 to .env.');
  }

  try {
    console.log(`🤖 Calling Groq AI engine for dynamic adaptive workout generation (${ctx.equipment}, ${ctx.timeCommitment})...`);
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are FitAI Pro engine. Generate adaptive workout plans in valid JSON format only.' },
        { role: 'user', content: prompt },
      ],
      model: config.defaultModel,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      resultPlan = JSON.parse(content);
    }
  } catch (err: any) {
    console.error(`❌ Groq AI generation error: ${err.message}`);
    throw new Error(`FitAI Engine Error: Unable to generate your AI workout session (${err.message}). Please try again in a moment.`);
  }

  if (!resultPlan || !resultPlan.exercises || resultPlan.exercises.length === 0) {
    throw new Error('FitAI Engine Error: The AI service returned an empty workout plan. Please try again.');
  }

  // Live Enrich & Filter exercises with ExerciseDB V2 API
  console.log(`🎥 Live enriching & verifying exercises for equipment (${ctx.equipment}) and time target (${targetExercises} exercises)...`);

  const eqCat = getEquipmentCategory(ctx.equipment);
  const allowedList = eqCat === 'bodyweight'
    ? VERIFIED_BODYWEIGHT_EXERCISES
    : eqCat === 'dumbbell'
    ? VERIFIED_DUMBBELL_EXERCISES
    : VERIFIED_FULL_GYM_EXERCISES;

  const allowedSet = new Set(allowedList.map(e => e.toLowerCase()));
  const enrichedExercises: GeneratedExercise[] = [];

  for (const ex of resultPlan.exercises) {
    const isAllowedByEquipment = allowedSet.has(ex.name.toLowerCase()) || eqCat === 'full';
    
    if (!isAllowedByEquipment) {
      console.warn(`⚠️ AI generated exercise "${ex.name}" which does not match user equipment profile (${ctx.equipment}). Skipping.`);
      continue;
    }

    const edbData = await fetchExerciseDbDetails(ex.name);
    if (edbData.videoUrl) {
      enrichedExercises.push({
        ...ex,
        name: edbData.name || ex.name,
        videoUrl: edbData.videoUrl,
        imageUrl: edbData.imageUrl,
        steps: (edbData.steps && edbData.steps.length > 0) ? edbData.steps : ex.steps,
        targetMuscle: edbData.targetMuscle || ex.targetMuscle,
        tip: edbData.tip || ex.tip,
      });
    } else {
      console.warn(`⚠️ Live video verification failed for "${ex.name}". Skipping.`);
    }

    if (enrichedExercises.length >= targetExercises) break;
  }

  if (enrichedExercises.length < targetExercises) {
    console.log(`⚡ Dynamically querying ExerciseDB for equipment-matched exercises (${ctx.equipment}) to reach ${targetExercises} total...`);
    for (const candidateName of allowedList) {
      if (enrichedExercises.length >= targetExercises) break;
      if (!enrichedExercises.some(e => e.name.toLowerCase() === candidateName.toLowerCase())) {
        const edbData = await fetchExerciseDbDetails(candidateName);
        if (edbData.videoUrl) {
          enrichedExercises.push({
            name: edbData.name,
            sets: 3,
            reps: '10-12',
            restSec: 60,
            icon: 'dumbbell',
            tip: edbData.tip || `Perform ${edbData.name} under strict controlled form.`,
            targetMuscle: edbData.targetMuscle || 'Target Muscle',
            videoUrl: edbData.videoUrl,
            imageUrl: edbData.imageUrl,
            steps: edbData.steps,
          });
        }
      }
    }
  }

  if (enrichedExercises.length === 0) {
    throw new Error(`FitAI Engine Error: Could not load verified exercise videos matching your ${ctx.equipment} equipment. Please check your network or RapidAPI key setup.`);
  }

  const finalExercises = enrichedExercises.slice(0, targetExercises);

  const formattedAiReasoning = generateDecisionExplanation({
    action: resultPlan.title || 'Adaptive Session Plan',
    primaryReason: resultPlan.aiReasoning || resultPlan.whyRecommendation || 'Targeted muscular stimulus',
    readinessScore: ctx.recoveryScore || (ctx.previousDaySummary ? ctx.previousDaySummary.readinessPercentage : 85),
    sleepHours: ctx.previousDaySummary ? ctx.previousDaySummary.sleepHours : undefined,
    sorenessLevel: ctx.lastFeedback ? ctx.lastFeedback.soreness : undefined,
    progressiveOverloadDetails: ctx.userExerciseLogs && ctx.userExerciseLogs.length > 0
      ? `${ctx.userExerciseLogs.length} exercise performance logs ingested`
      : undefined,
  });

  return {
    ...resultPlan,
    aiReasoning: formattedAiReasoning,
    durationMinutes,
    estimatedCalories,
    exercises: finalExercises,
  };
}
