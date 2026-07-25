/**
 * FitAI X — Backend API Tests: Auth Endpoints
 *
 * Covers:
 *   GET  /api/status
 *   POST /api/auth/signup
 *   POST /api/auth/login
 *   GET  /api/auth/google/url
 *
 * Requires backend running on http://localhost:5000
 */

import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5000/api';

// ── /api/status ───────────────────────────────────────────────────────────────
test.describe('GET /api/status', () => {

  test('returns 200 with status field', async ({ request }) => {
    const res = await request.get(`${BASE}/status`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('status');
  });

  test('returns activeKeysCount as a number', async ({ request }) => {
    const res = await request.get(`${BASE}/status`);
    const json = await res.json();
    expect(typeof json.activeKeysCount).toBe('number');
  });

});

// ── /api/auth/signup ──────────────────────────────────────────────────────────
test.describe('POST /api/auth/signup', () => {

  test('creates a new user and returns token', async ({ request }) => {
    const email = `api.signup.${Date.now()}@fitai.test`;
    const res = await request.post(`${BASE}/auth/signup`, {
      data: { email, name: 'API Tester', password: 'TestPass123!' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user).toBeDefined();
    expect(json.user.email).toBe(email);
    expect(json.token).toBeDefined();
  });

  test('returns isOnboarded: false for new user', async ({ request }) => {
    const email = `api.new.${Date.now()}@fitai.test`;
    const res = await request.post(`${BASE}/auth/signup`, {
      data: { email, name: 'New Tester' },
    });
    const json = await res.json();
    expect(json.isOnboarded).toBe(false);
  });

  test('signup with existing email returns the same user (upsert)', async ({ request }) => {
    const email = `api.dupe.${Date.now()}@fitai.test`;

    await request.post(`${BASE}/auth/signup`, { data: { email, name: 'First' } });
    const res2 = await request.post(`${BASE}/auth/signup`, { data: { email, name: 'Second' } });
    expect(res2.status()).toBe(200);
    const json = await res2.json();
    expect(json.success).toBe(true);
  });

  test('missing email returns error response', async ({ request }) => {
    const res = await request.post(`${BASE}/auth/signup`, {
      data: { name: 'No Email' },
    });
    // Expect 400 or an error in body
    const json = await res.json();
    expect(json.success).toBeFalsy();
  });

});

// ── /api/auth/login ───────────────────────────────────────────────────────────
test.describe('POST /api/auth/login', () => {

  test('login with registered email returns token', async ({ request }) => {
    const email = `api.login.${Date.now()}@fitai.test`;
    // First signup
    await request.post(`${BASE}/auth/signup`, { data: { email, name: 'Login Tester' } });

    // Then login
    const res = await request.post(`${BASE}/auth/login`, {
      data: { email, password: '' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.token).toBeDefined();
    expect(json.user.email).toBe(email);
  });

  test('login with unknown email creates the user (upsert auth)', async ({ request }) => {
    const email = `api.unknown.${Date.now()}@fitai.test`;
    const res = await request.post(`${BASE}/auth/login`, {
      data: { email },
    });
    const json = await res.json();
    expect(json.success).toBe(true);
  });

});

// ── /api/auth/google/url ──────────────────────────────────────────────────────
test.describe('GET /api/auth/google/url', () => {

  test('returns a Google OAuth URL', async ({ request }) => {
    const res = await request.get(`${BASE}/auth/google/url`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.url).toContain('accounts.google.com');
  });

});
