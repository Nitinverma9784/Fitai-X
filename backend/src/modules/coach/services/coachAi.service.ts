import { getNextGroqClient, getGroqKeysCount } from '../../../config/groq';
import { envConfig } from '../../../config/env';

export async function processCoachChat(message: string, model: string = envConfig.defaultModel): Promise<string> {
  const systemPrompt = `You are FitGuru, a warm, highly encouraging master fitness & nutrition coach. Provide concise, actionable advice tailored to the user's fitness, diet, and recovery goals. Keep responses formatted nicely with clean bullet points and emojis. Never mention code, APIs, algorithms, or technical infrastructure.`;
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

  // Smart Dynamic Fallback based on user query
  const lower = message.toLowerCase();

  if (lower.includes('diet') || lower.includes('meal') || lower.includes('food') || lower.includes('nutrition')) {
    const weightMatch = message.match(/(\d{2,3})\s*kg/i);
    const weightKg = weightMatch ? parseInt(weightMatch[1], 10) : 75;
    const proteinG = Math.round(weightKg * 2.0);
    const calories = Math.round(weightKg * 32);

    return `🥗 **Personalized High-Protein Diet Plan (${weightKg} kg Target)**\n\n` +
      `• **Daily Targets**: ~${calories} kcal | ${proteinG}g Protein\n` +
      `• **Breakfast**: Oats with 1 scoop Whey Protein, 10g Chia Seeds & Berries\n` +
      `• **Lunch**: Grilled Chicken Breast (or Tofu) with Brown Rice & Steamed Broccoli\n` +
      `• **Post-Workout**: Greek Yogurt with Honey & Almonds\n` +
      `• **Dinner**: Lean Egg Whites / Salmon with Sweet Potato & Salad\n\n` +
      `💡 *Tip*: Stay hydrated with 3L of water daily to support digestion and muscle recovery!`;
  }

  if (lower.includes('workout') || lower.includes('exercise') || lower.includes('training') || lower.includes('routine')) {
    return `🏋️ **Today's Custom Workout Plan**\n\n` +
      `• **Warm-Up**: 5 mins dynamic mobility (arm circles, leg swings)\n` +
      `• **Main Movements**:\n` +
      `  1. Incline Dumbbell Press (4 Sets x 10-12 Reps, 60s Rest)\n` +
      `  2. Cable Flyes / Push-Ups (3 Sets x 12-15 Reps, 45s Rest)\n` +
      `  3. Triceps Dip Machine (3 Sets x 10-12 Reps, 60s Rest)\n` +
      `• **Cool-Down**: 5 mins static stretching for chest & shoulders\n\n` +
      `💡 *Tip*: Focus on controlled 3-second eccentric motion on every rep!`;
  }

  if (lower.includes('joint') || lower.includes('pain') || lower.includes('sore') || lower.includes('injury')) {
    return `🩹 **Joint & Recovery Guidance**\n\n` +
      `• **Light Active Recovery**: Swap high joint-impact lifts (like heavy Barbell Squats) for machine Leg Press or Goblet Squats.\n` +
      `• **Mobility Focus**: Spend 10-12 minutes on foam rolling and gentle joint warm-ups.\n` +
      `• **Listen to Your Body**: If soreness level is 7+, take an active recovery walk and prioritize 8 hours of quality sleep!`;
  }

  return `⚡ **Daily Progress Tip**\n\n` +
    `Focus on consistent daily habits: aim for 7.5+ hours of sleep nightly, hit your daily protein goal, and maintain steady progression in your workouts for peak energy!`;
}
