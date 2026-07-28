import dotenv from 'dotenv';
dotenv.config();

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
