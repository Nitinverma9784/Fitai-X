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

// RapidAPI ExerciseDB V2 5-Key Rotation Manager
const exerciseDbKeys = [
  process.env.RAPIDAPI_EXERCISEDB_KEY_1,
  process.env.RAPIDAPI_EXERCISEDB_KEY_2,
  process.env.RAPIDAPI_EXERCISEDB_KEY_3,
  process.env.RAPIDAPI_EXERCISEDB_KEY_4,
  process.env.RAPIDAPI_EXERCISEDB_KEY_5,
  process.env.EXERCISEDB_API_KEY,
  process.env.RAPIDAPI_KEY,
].filter((k): k is string => Boolean(k && k.trim() !== '' && !k.includes('placeholder')));

export const rapidApiHost = process.env.RAPIDAPI_EXERCISEDB_HOST || 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com';

let edbRotationIndex = 0;

export function getNextExerciseDbKey(): { apiKey: string | null; keyIndex: number; totalKeys: number } {
  if (exerciseDbKeys.length === 0) {
    return { apiKey: null, keyIndex: -1, totalKeys: 0 };
  }
  const keyIndex = edbRotationIndex % exerciseDbKeys.length;
  const apiKey = exerciseDbKeys[keyIndex];
  edbRotationIndex++;
  return { apiKey, keyIndex, totalKeys: exerciseDbKeys.length };
}

export function getExerciseDbKeysCount(): number {
  return exerciseDbKeys.length;
}

