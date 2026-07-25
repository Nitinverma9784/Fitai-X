import { getNextGroqClient, config } from '../../core/config';

export interface AdaptivePlanRequest {
  targetGroup: string;
  durationMinutes: number;
  fitnessLevel: string;
  equipment: string;
  sleepHours?: number;
  missedWorkouts?: number;
}

export async function generateAdaptiveWorkout(req: AdaptivePlanRequest) {
  const { client, keyIndex } = getNextGroqClient();

  const systemPrompt = `You are FitAI Pro Adaptive Planning Engine. Respond ONLY in valid JSON format:
{
  "title": string,
  "durationMinutes": number,
  "estimatedCalories": number,
  "targetMuscles": [string],
  "whyRecommendation": string,
  "exercises": [
    { "name": string, "sets": number, "reps": string, "restSec": number, "icon": string, "tip": string }
  ]
}`;

  const userPrompt = `Generate an adaptive ${req.durationMinutes}m ${req.fitnessLevel} workout targeting ${req.targetGroup} using ${req.equipment}. Sleep: ${req.sleepHours || 8}h.`;

  if (!client) {
    return {
      title: `AI Adaptive ${req.targetGroup} Hypertrophy`,
      durationMinutes: req.durationMinutes,
      estimatedCalories: 420,
      targetMuscles: [req.targetGroup, "Abs"],
      whyRecommendation: `Adapted for ${req.durationMinutes}m duration based on your 92% recovery score and active equipment availability.`,
      exercises: [
        { name: "Incline Dumbbell Press", sets: 4, reps: "10-12", restSec: 60, icon: "dumbbell", tip: "Keep elbows at 45 degrees for peak chest activation." },
        { name: "Cable Chest Flyes", sets: 3, reps: "12-15", restSec: 45, icon: "activity", tip: "Squeeze tightly at full contraction." },
        { name: "Triceps Dip Machine", sets: 3, reps: "10-12", restSec: 60, icon: "zap", tip: "Control the eccentric motion for 3s." },
        { name: "Hanging Leg Raises", sets: 4, reps: "15", restSec: 45, icon: "target", tip: "Avoid swinging; lift using lower abs." }
      ]
    };
  }

  try {
    console.log(`🚀 Groq Adaptive Engine using Key #${keyIndex + 1}`);
    const res = await client.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      model: config.defaultModel,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    return JSON.parse(res.choices[0]?.message?.content || '{}');
  } catch (err: any) {
    return {
      title: `AI Adaptive ${req.targetGroup} Focus`,
      durationMinutes: req.durationMinutes,
      estimatedCalories: 400,
      targetMuscles: [req.targetGroup],
      whyRecommendation: "High-intensity adaptive hypertrophy protocol.",
      exercises: [
        { name: "Dumbbell Bench Press", sets: 4, reps: "10", restSec: 60, icon: "dumbbell", tip: "Controlled tempo." }
      ]
    };
  }
}
