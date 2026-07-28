import { getNextGroqClient, getGroqKeysCount } from '../../../config/groq';
import { envConfig } from '../../../config/env';

export async function processCoachChat(
  message: string,
  userProfileOrModel?: any,
  modelArg: string = envConfig.defaultModel
): Promise<string> {
  let userProfile: any = null;
  let model = modelArg;

  if (typeof userProfileOrModel === 'string') {
    model = userProfileOrModel;
  } else if (userProfileOrModel && typeof userProfileOrModel === 'object') {
    userProfile = userProfileOrModel;
  }

  let userContextText = '';
  const name = userProfile?.name || 'Athlete';
  const age = userProfile?.age ? `${userProfile.age} yrs` : 'Not specified';
  const gender = userProfile?.gender || 'Not specified';
  const weight = userProfile?.weight_kg || userProfile?.weightKg ? `${userProfile.weight_kg || userProfile.weightKg} kg` : 'Not specified';
  const height = userProfile?.height_cm || userProfile?.heightCm ? `${userProfile.height_cm || userProfile.heightCm} cm` : 'Not specified';
  const bodyFat = userProfile?.body_fat_pct || userProfile?.bodyFatPct ? `${userProfile.body_fat_pct || userProfile.bodyFatPct}%` : 'Not specified';
  const goal = userProfile?.goal || 'General Fitness & Muscle Building';
  const diet = userProfile?.diet_preference || userProfile?.dietPref || 'Balanced High-Protein';
  const equipment = userProfile?.equipment || 'Commercial Gym';
  const time = userProfile?.time_commitment || userProfile?.timeCommitment || '45-60 mins';
  const exp = userProfile?.experience_level || userProfile?.experienceLevel || 'Intermediate';
  const injuries = Array.isArray(userProfile?.injuries) ? userProfile.injuries.join(', ') : (userProfile?.injuries || 'None');
  const calories = userProfile?.daily_calories_target || userProfile?.dailyCaloriesTarget || 'Calculated per goal';
  const protein = userProfile?.protein_target_g || userProfile?.proteinTargetG ? `${userProfile.protein_target_g || userProfile.proteinTargetG}g` : 'Calculated per body weight';

  if (userProfile) {
    userContextText = `
ATHLETE PROFILE & ONBOARDING DATA:
- Athlete Name: ${name}
- Age & Gender: ${age}, ${gender}
- Body Metrics: Weight=${weight}, Height=${height}, Body Fat=${bodyFat}
- Primary Goal: ${goal}
- Experience Level: ${exp}
- Diet & Eating Habits: ${diet}
- Equipment Access: ${equipment}
- Time Commitment: ${time}
- Known Injuries / Pain Constraints: ${injuries}
- Macro Targets: Daily Calories=${calories}, Protein Target=${protein}
`;
  }

  const systemPrompt = `You are FitGuru, a warm, highly encouraging master fitness & nutrition coach.

MANDATORY INSTRUCTION: You MUST explicitly mention and acknowledge the user's personal onboarding metrics directly in your response text.
Always include an opening statement acknowledging their specific profile (e.g., "Since your weight is ${weight}, height is ${height}, and diet preference is ${diet}..." or "Based on your onboarding profile (${weight}, ${height}, ${diet}, Goal: ${goal})...").

Provide concise, actionable advice strictly tailored to these exact physical dimensions, diet preferences (Veg/Non-Veg/Vegan), equipment, and injury constraints. Keep responses formatted nicely with clean bullet points and emojis. Never mention code, APIs, algorithms, or technical infrastructure.${userContextText ? `\n\nUSER ONBOARDING DATA:\n${userContextText}` : ''}`;

  const userPrompt = message || "Give me a quick tip for maximum progress today.";

  const totalKeys = getGroqKeysCount();
  if (totalKeys > 0) {
    let attempts = 0;
    while (attempts < totalKeys) {
      const { client, keyIndex } = getNextGroqClient();
      if (client) {
        try {
          console.log(`🚀 Calling Groq LLM API Key #${keyIndex + 1} (Model: ${model})...`);
          const res = await client.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            model: model,
            temperature: 0.7,
            max_tokens: 1500,
          });
          const response = res.choices[0]?.message?.content;
          if (response && response.trim()) {
            return response;
          }
        } catch (err: any) {
          console.error(`⚠️ Groq API Key #${keyIndex + 1} call error:`, err.message);
        }
      }
      attempts++;
    }
  }

  // Smart Dynamic Fallback based on user query & profile metrics
  const lower = message.toLowerCase();
  const weightMatch = message.match(/(\d{2,3})\s*kg/i);
  const weightKg = userProfile?.weight_kg || userProfile?.weightKg || (weightMatch ? parseInt(weightMatch[1], 10) : 75);
  const heightCm = userProfile?.height_cm || userProfile?.heightCm || 175;
  const dietPref = userProfile?.diet_preference || userProfile?.dietPref || 'High Protein';
  const userGoal = userProfile?.goal || 'Fitness';
  const userEquipment = userProfile?.equipment || 'Gym / Dumbbells';
  const userInjuries = Array.isArray(userProfile?.injuries) ? userProfile.injuries.join(', ') : (userProfile?.injuries || 'None');

  const profileAcknowledgement = `📋 **Onboarding Profile**: Since your weight is **${weightKg} kg**, height is **${heightCm} cm**, diet is **${dietPref}**, and goal is **${userGoal}**:\n\n`;

  if (lower.includes('diet') || lower.includes('meal') || lower.includes('food') || lower.includes('nutrition') || lower.includes('eating')) {
    const proteinG = Math.round(weightKg * 2.0);
    const caloriesVal = Math.round(weightKg * 32);

    return `${profileAcknowledgement}🥗 **Personalized ${dietPref} Diet Plan**\n\n` +
      `• **Daily Targets**: ~${caloriesVal} kcal | ${proteinG}g Protein\n` +
      `• **Diet Preference**: ${dietPref}\n` +
      `• **Breakfast**: Oats with 1 scoop Protein Powder, Chia Seeds & Fruit\n` +
      `• **Lunch**: ${dietPref.toLowerCase().includes('veg') && !dietPref.toLowerCase().includes('non') ? 'Paneer / Tofu / Lentil Bowl' : 'Lean Protein Source (Chicken/Fish/Tofu)'} with Rice & Veggies\n` +
      `• **Post-Workout**: Protein Shake / Greek Yogurt with Nuts\n` +
      `• **Dinner**: ${dietPref} dinner aligned with ${userGoal} targets & salad\n\n` +
      `💡 *Tip*: Custom calculated for your ${weightKg} kg frame — drink at least 3.5L of water daily!`;
  }

  if (lower.includes('workout') || lower.includes('exercise') || lower.includes('training') || lower.includes('routine')) {
    return `${profileAcknowledgement}🏋️ **Custom Workout Plan (${userGoal})**\n\n` +
      `• **Available Equipment**: ${userEquipment}\n` +
      `• **Injuries & Constraints**: ${userInjuries}\n` +
      `• **Warm-Up**: 5 mins dynamic mobility\n` +
      `• **Main Movements**:\n` +
      `  1. Primary Compound Press/Squat using ${userEquipment} (4 Sets x 10-12 Reps, 60s Rest)\n` +
      `  2. Accessory Movement (3 Sets x 12-15 Reps, 45s Rest)\n` +
      `  3. Core Focus (3 Sets x 10-12 Reps, 60s Rest)\n` +
      `• **Cool-Down**: 5 mins static stretching\n\n` +
      `💡 *Tip*: Tailored for your ${heightCm} cm height and ${weightKg} kg weight — focus on controlled motion!`;
  }

  if (lower.includes('joint') || lower.includes('pain') || lower.includes('sore') || lower.includes('injury')) {
    return `${profileAcknowledgement}🩹 **Joint & Recovery Guidance**\n\n` +
      `• **Injuries / Constraints**: ${userInjuries}\n` +
      `• **Active Recovery**: Swap high joint-impact lifts for machine press or bodyweight variations to protect ${userInjuries}.\n` +
      `• **Mobility Focus**: Spend 10-12 minutes on gentle joint warm-ups and foam rolling.\n` +
      `• **Listen to Your Body**: Prioritize 8 hours of quality sleep and recovery!`;
  }

  return `${profileAcknowledgement}⚡ **Daily Progress Tip for ${name}**\n\n` +
    `Tailored for your weight (${weightKg} kg), height (${heightCm} cm), and ${dietPref} diet: aim for 7.5+ hours of sleep nightly, hit your protein target (~${Math.round(weightKg * 2)}g), and train using ${userEquipment}!`;
}

