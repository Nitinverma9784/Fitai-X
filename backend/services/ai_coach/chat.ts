import { getNextGroqClient, config } from '../../core/config';

export async function processCoachChat(message: string, model: string = config.defaultModel): Promise<string> {
  const { client, keyIndex } = getNextGroqClient();

  const systemPrompt = `You are FitAI Pro AI Coach, an encouraging, highly knowledgeable master strength & recovery coach. Provide concise, actionable, and inspiring advice tailored to fitness, nutrition, and exercise science. Keep responses formatted nicely with emojis.`;
  const userPrompt = message || "Give me a quick tip for maximum hypertrophy today.";

  if (!client) {
    return "⚡ Great question! Maintain consistent progressive overload, sleep 7.5+ hours nightly, and fuel your body with 1.6-2.2g of protein per kg of bodyweight for peak muscular gains!";
  }

  try {
    console.log(`🚀 Groq AI Coach Chat using Key #${keyIndex + 1} (Model: ${model})`);
    const res = await client.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      model: model,
      temperature: 0.7,
      max_tokens: 1500,
    });
    return res.choices[0]?.message?.content || "Keep pushing your limits!";
  } catch (err: any) {
    return "⚡ Remember that consistency and proper recovery are the true pillars of long-term strength and vitality!";
  }
}
