import { getNextGroqClient, getGroqKeysCount, config } from '../../core/config';

export async function processCoachChat(
  message: string,
  userProfileOrModel?: any,
  modelArg: string = config.defaultModel
): Promise<string> {
  let userProfile: any = null;
  let model = modelArg;

  if (typeof userProfileOrModel === 'string') {
    model = userProfileOrModel;
  } else if (userProfileOrModel && typeof userProfileOrModel === 'object') {
    userProfile = userProfileOrModel;
  }

  let userContextText = '';
  if (userProfile) {
    const name = userProfile.name || 'Athlete';
    const age = userProfile.age ? `${userProfile.age} yrs` : 'Not specified';
    const gender = userProfile.gender || 'Not specified';
    const weight = userProfile.weight_kg || userProfile.weightKg ? `${userProfile.weight_kg || userProfile.weightKg} kg` : 'Not specified';
    const height = userProfile.height_cm || userProfile.heightCm ? `${userProfile.height_cm || userProfile.heightCm} cm` : 'Not specified';
    const bodyFat = userProfile.body_fat_pct || userProfile.bodyFatPct ? `${userProfile.body_fat_pct || userProfile.bodyFatPct}%` : 'Not specified';
    const goal = userProfile.goal || 'General Fitness & Muscle Building';
    const diet = userProfile.diet_preference || userProfile.dietPref || 'Balanced High-Protein';
    const equipment = userProfile.equipment || 'Commercial Gym';
    const time = userProfile.time_commitment || userProfile.timeCommitment || '45-60 mins';
    const exp = userProfile.experience_level || userProfile.experienceLevel || 'Intermediate';
    const injuries = Array.isArray(userProfile.injuries) ? userProfile.injuries.join(', ') : (userProfile.injuries || 'None');
    const calories = userProfile.daily_calories_target || userProfile.dailyCaloriesTarget || 'Calculated per goal';
    const protein = userProfile.protein_target_g || userProfile.proteinTargetG ? `${userProfile.protein_target_g || userProfile.proteinTargetG}g` : 'Calculated per body weight';

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

  const systemPrompt = `You are FitGuru, a warm, highly encouraging master fitness & nutrition coach. Provide concise, actionable advice strictly tailored to the user's fitness, diet, recovery goals, and personal onboarding profile. Keep responses formatted nicely with clean bullet points and emojis. Never mention code, APIs, algorithms, or technical infrastructure.${userContextText ? `\nAlways reference and adapt your recommendations specifically to the user's profile details provided below:\n${userContextText}` : ''}`;
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
  const dietPref = userProfile?.diet_preference || userProfile?.dietPref || 'High Protein';
  const userGoal = userProfile?.goal || 'Fitness';
  const equipment = userProfile?.equipment || 'Gym / Dumbbells';
  const injuries = Array.isArray(userProfile?.injuries) ? userProfile.injuries.join(', ') : (userProfile?.injuries || 'None');

  if (lower.includes('diet') || lower.includes('meal') || lower.includes('food') || lower.includes('nutrition') || lower.includes('eating')) {
    const proteinG = Math.round(weightKg * 2.0);
    const calories = Math.round(weightKg * 32);

    return `🥗 **Personalized ${dietPref} Diet Plan (${weightKg} kg Target - ${userGoal})**\n\n` +
      `• **Daily Targets**: ~${calories} kcal | ${proteinG}g Protein\n` +
      `• **Diet Preference**: ${dietPref}\n` +
      `• **Breakfast**: Oats with 1 scoop Whey/Plant Protein, 10g Chia Seeds & Berries\n` +
      `• **Lunch**: Lean Protein Source matching ${dietPref} with Brown Rice & Steamed Veggies\n` +
      `• **Post-Workout**: Protein Shake / Greek Yogurt with Honey & Almonds\n` +
      `• **Dinner**: High protein dinner aligned with ${userGoal} targets & salad\n\n` +
      `💡 *Tip*: Stay hydrated with 3L of water daily to support digestion and muscle recovery!`;
  }

  if (lower.includes('workout') || lower.includes('exercise') || lower.includes('training') || lower.includes('routine')) {
    return `🏋️ **Today's Custom Workout Plan (${userGoal})**\n\n` +
      `• **Available Equipment**: ${equipment}\n` +
      `• **Injuries & Constraints**: ${injuries}\n` +
      `• **Warm-Up**: 5 mins dynamic mobility (arm circles, leg swings)\n` +
      `• **Main Movements**:\n` +
      `  1. Primary Compound Press/Squat matching ${equipment} (4 Sets x 10-12 Reps, 60s Rest)\n` +
      `  2. Accessory Push/Pull (3 Sets x 12-15 Reps, 45s Rest)\n` +
      `  3. Core / Secondary Focus (3 Sets x 10-12 Reps, 60s Rest)\n` +
      `• **Cool-Down**: 5 mins static stretching for target muscles\n\n` +
      `💡 *Tip*: Focus on controlled 3-second eccentric motion on every rep!`;
  }

  if (lower.includes('joint') || lower.includes('pain') || lower.includes('sore') || lower.includes('injury')) {
    return `🩹 **Joint & Recovery Guidance for ${injuries}**\n\n` +
      `• **Active Recovery**: Swap high joint-impact lifts for machine press or bodyweight variations to protect ${injuries}.\n` +
      `• **Mobility Focus**: Spend 10-12 minutes on gentle joint warm-ups and foam rolling.\n` +
      `• **Listen to Your Body**: Prioritize 8 hours of quality sleep and recovery!`;
  }

  return `⚡ **Daily Progress Tip for ${userProfile?.name || 'Athlete'}**\n\n` +
    `Tailored for your ${userGoal} goal (${weightKg} kg): aim for 7.5+ hours of sleep nightly, hit your protein target (${Math.round(weightKg * 2)}g), and maintain steady progressive overload!`;
}

