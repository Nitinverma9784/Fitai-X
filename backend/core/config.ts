import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  defaultModel: process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile',
  dbUrl: process.env.DATABASE_URL || 'postgres://postgres:nitinverma@127.0.0.1:5433/fitaix',
};

// Groq API Key Rotation Manager
const groqKeys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
].filter((k): k is string => Boolean(k && k.trim() !== '' && !k.includes('placeholder')));

let rotationIndex = 0;

export function getNextGroqClient(): { client: Groq | null; keyIndex: number; totalKeys: number } {
  if (groqKeys.length === 0) {
    return { client: null, keyIndex: -1, totalKeys: 0 };
  }
  const key = groqKeys[rotationIndex % groqKeys.length];
  const currentIndex = rotationIndex % groqKeys.length;
  rotationIndex++;
  return {
    client: new Groq({ apiKey: key }),
    keyIndex: currentIndex,
    totalKeys: groqKeys.length,
  };
}

export function getGroqKeysCount(): number {
  return groqKeys.length;
}
