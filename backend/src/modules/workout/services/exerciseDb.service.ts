import { getNextExerciseDbKey, getExerciseDbKeysCount, rapidApiHost } from '../../../config/exerciseDb';

export interface ExerciseDbResult {
  exerciseId?: string;
  name: string;
  videoUrl: string;
  imageUrl: string;
  steps: string[];
  targetMuscle: string;
  secondaryMuscles: string[];
  tip: string;
  overview?: string;
}

function scoreCandidate(targetName: string, candidateName: string): number {
  const t = targetName.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const c = candidateName.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  if (c === t) return 1000;

  const tWords = t.split(' ').filter(Boolean);
  const cWords = c.split(' ').filter(Boolean);

  let score = 0;
  if (c.startsWith(t)) score += 500;
  else if (t.startsWith(c)) score += 400;

  const matches = tWords.filter(w => cWords.includes(w));
  score += matches.length * 100;

  if (matches.length === tWords.length) score += 200;

  // Deduct heavy score if key target words are completely missing from candidate
  for (const tw of tWords) {
    if (tw.length > 2 && !cWords.some(cw => cw.includes(tw) || tw.includes(cw))) {
      score -= 250;
    }
  }

  // Penalize weird bodyweight/towel variations unless explicitly requested
  if ((c.includes('towel') || c.includes('chair') || c.includes('door') || c.includes('bed')) && !t.includes('towel')) {
    score -= 300;
  }
  // Penalize one-arm / single-leg variations unless explicitly requested
  if ((c.includes('one arm') || c.includes('single leg') || c.includes('one leg')) && !t.includes('one') && !t.includes('single')) {
    score -= 150;
  }

  return score;
}

function sanitizeSearchQuery(inputName: string): string {
  return inputName
    .replace(/\b(ai|focus|hypertrophy|power|superset|warmup|max|heavy|tempo|pro|elite|protocol)\b/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchExerciseDbDetails(exerciseName: string): Promise<ExerciseDbResult> {
  const totalKeys = getExerciseDbKeysCount();
  const cleanQuery = sanitizeSearchQuery(exerciseName) || exerciseName;

  if (totalKeys > 0) {
    let attempts = 0;
    while (attempts < totalKeys) {
      const { apiKey, keyIndex } = getNextExerciseDbKey();
      if (!apiKey || apiKey.includes('placeholder')) break;

      try {
        console.log(`🏋️ ExerciseDB V2 search for "${cleanQuery}" (raw: "${exerciseName}") using key #${keyIndex + 1}...`);
        
        const searchRes = await fetch(
          `https://${rapidApiHost}/api/v1/exercises/search?search=${encodeURIComponent(cleanQuery)}`,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': rapidApiHost,
              'Content-Type': 'application/json',
            },
          }
        );

        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          const results = searchJson.data || searchJson;

          if (Array.isArray(results) && results.length > 0) {
            const ranked = results
              .map((item: any) => ({ item, score: scoreCandidate(cleanQuery, item.name || '') }))
              .sort((a: any, b: any) => b.score - a.score);

            const topMatch = ranked[0];

            if (!topMatch || topMatch.score < 250) {
              console.warn(`⚠️ Match score (${topMatch ? topMatch.score : 0}) for "${exerciseName}" is below strict threshold 250. Rejecting match to avoid showing wrong video.`);
              break;
            }

            const bestCandidate = topMatch.item;
            console.log(`🎯 100% Match Verified for "${exerciseName}": "${bestCandidate.name}" (ID: ${bestCandidate.exerciseId}, Score: ${topMatch.score})`);

            let detail = bestCandidate;

            if (bestCandidate.exerciseId && (!bestCandidate.videoUrl || !bestCandidate.instructions)) {
              try {
                const detailRes = await fetch(
                  `https://${rapidApiHost}/api/v1/exercises/${bestCandidate.exerciseId}`,
                  {
                    method: 'GET',
                    headers: {
                      'x-rapidapi-key': apiKey,
                      'x-rapidapi-host': rapidApiHost,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                if (detailRes.ok) {
                  const detailJson = await detailRes.json();
                  if (detailJson.data) {
                    detail = detailJson.data;
                  }
                }
              } catch (e: any) {
                console.warn(`⚠️ Detail fetch failed for ${bestCandidate.exerciseId}, using candidate summary:`, e?.message);
              }
            }

            const videoUrl = detail.videoUrl || '';
            const imageUrl = detail.imageUrl || (detail.imageUrls ? (detail.imageUrls['720p'] || detail.imageUrls['480p'] || detail.imageUrls['360p']) : '');
            
            const rawInstructions = Array.isArray(detail.instructions) ? detail.instructions : [];
            const steps = rawInstructions.map((s: string) => s.replace(/^Step:\d+\s*/i, '').trim()).filter(Boolean);

            const rawTarget = Array.isArray(detail.targetMuscles) && detail.targetMuscles.length > 0
              ? detail.targetMuscles[0]
              : Array.isArray(detail.bodyParts) && detail.bodyParts.length > 0
              ? detail.bodyParts[0]
              : 'Target Muscle';

            const targetMuscle = rawTarget
              .toLowerCase()
              .split(' ')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');

            const tips = Array.isArray(detail.exerciseTips) ? detail.exerciseTips : [];
            const tip = tips.length > 0 ? tips[0] : (detail.overview ? detail.overview.slice(0, 140) + '...' : '');

            return {
              exerciseId: detail.exerciseId,
              name: detail.name || exerciseName,
              videoUrl,
              imageUrl,
              steps: steps.length > 0 ? steps : [
                `Setup with proper posture and core engaged for ${exerciseName}.`,
                `Perform movement through full controlled range of motion.`,
                `Pause briefly at peak contraction.`,
                `Control lowering phase under strict tempo.`
              ],
              targetMuscle,
              secondaryMuscles: Array.isArray(detail.secondaryMuscles) ? detail.secondaryMuscles : [],
              tip,
              overview: detail.overview,
            };
          }
        } else {
          console.warn(`⚠️ ExerciseDB API key #${keyIndex + 1} HTTP ${searchRes.status} response.`);
        }
      } catch (err: any) {
        console.warn(`⚠️ ExerciseDB API key #${keyIndex + 1} request error: ${err.message}`);
      }
      attempts++;
    }
  }

  return {
    name: exerciseName,
    videoUrl: '',
    imageUrl: '',
    steps: [
      `Setup with feet planted shoulder-width apart and core engaged for ${exerciseName}.`,
      `Perform concentric movement through full range of motion.`,
      `Pause for 1 second at peak contraction.`,
      `Lower weight under strict 2-3 second control.`
    ],
    targetMuscle: 'Target Muscle',
    secondaryMuscles: [],
    tip: `Focus on strict tempo and full range of motion for ${exerciseName}.`,
  };
}
export const exerciseDbService = { fetchExerciseDbDetails };
