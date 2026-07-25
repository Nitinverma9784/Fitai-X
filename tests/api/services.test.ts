/**
 * FitAI X — Backend API Tests: Services (User Profile, Workout, Recovery, AI Coach)
 *
 * Covers:
 *   GET  /api/user/profile
 *   PUT  /api/user/profile
 *   POST /api/user/onboarding
 *   GET  /api/workout/latest
 *   GET  /api/workout/history
 *   POST /api/workout/generate
 *   POST /api/workout/set-complete
 *   POST /api/recovery/insights
 *   GET  /api/recovery/latest
 *   POST /api/coach/chat
 *
 * Requires backend running on http://localhost:5000
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5000/api';

test.describe('User Profile & Onboarding API', () => {

  const testUserId = Math.floor(Math.random() * 899999) + 100000;
  const headers = { 'x-user-id': String(testUserId), 'Content-Type': 'application/json' };

  test('GET /api/user/profile returns user profile', async ({ request }) => {
    const res = await request.get(`${BASE}/user/profile`, { headers });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('id');
  });

  test('PUT /api/user/profile updates metrics', async ({ request }) => {
    const res = await request.put(`${BASE}/user/profile`, {
      headers,
      data: {
        name: 'API Updated Athlete',
        weight_kg: 78,
        height_cm: 180,
        goal: 'Muscle Gain & Hypertrophy',
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Number(json.data.weight_kg)).toBe(78);
    expect(Number(json.data.height_cm)).toBe(180);
  });

  test('POST /api/user/onboarding saves full onboarding wizard data', async ({ request }) => {
    const res = await request.post(`${BASE}/user/onboarding`, {
      headers,
      data: {
        name: 'Onboarded User',
        age: '28',
        heightCm: '182',
        weightKg: '75',
        goal: 'Powerlifting & Peak Strength',
        equipment: 'Commercial Gym',
        injuries: ['Knee Joint Pain'],
        dietPref: 'High Protein Non-Veg',
        timeCommitment: '60 mins',
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.onboarding_completed).toBe(true);
  });

});

test.describe('Workout Engine API', () => {

  const testUserId = Math.floor(Math.random() * 899999) + 100000;
  const headers = { 'x-user-id': String(testUserId), 'Content-Type': 'application/json' };

  test('GET /api/workout/latest returns workout plan or null', async ({ request }) => {
    const res = await request.get(`${BASE}/workout/latest`, { headers });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test('GET /api/workout/history returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/workout/history`, { headers });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('POST /api/workout/generate creates structured workout plan', async ({ request }) => {
    const res = await request.post(`${BASE}/workout/generate`, {
      headers,
      data: {
        targetGroup: 'Chest & Triceps',
        duration: 45,
        fitnessLevel: 'Intermediate',
        equipment: 'Commercial Gym',
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('title');
    expect(Array.isArray(json.data.exercises)).toBe(true);
    expect(json.data.exercises.length).toBeGreaterThan(0);
  });

  test('POST /api/workout/set-complete logs set progress', async ({ request }) => {
    const res = await request.post(`${BASE}/workout/set-complete`, {
      headers,
      data: {
        exerciseId: 1,
        completedSets: 3,
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

});

test.describe('Recovery Engine & AI Coach API', () => {

  const testUserId = Math.floor(Math.random() * 899999) + 100000;
  const headers = { 'x-user-id': String(testUserId), 'Content-Type': 'application/json' };

  test('POST /api/recovery/insights calculates readiness score & advice', async ({ request }) => {
    const res = await request.post(`${BASE}/recovery/insights`, {
      headers,
      data: {
        sleepHours: 7.5,
        hrv: 65,
        soreness: 'Low',
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('readinessPercentage');
    expect(json.data).toHaveProperty('statusLabel');
  });

  test('GET /api/recovery/latest returns latest recovery log', async ({ request }) => {
    const res = await request.get(`${BASE}/recovery/latest`, { headers });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test('POST /api/coach/chat responds to fitness query', async ({ request }) => {
    const res = await request.post(`${BASE}/coach/chat`, {
      headers,
      data: {
        message: 'How many reps for hypertrophy?',
        model: 'llama-3.3-70b-versatile',
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(typeof json.response).toBe('string');
    expect(json.response.length).toBeGreaterThan(10);
  });

});
