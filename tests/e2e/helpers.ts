/**
 * FitAI X — Playwright E2E Test Helpers
 * Shared utilities for auth setup, navigation waits, and common assertions.
 */

import { Page, expect } from '@playwright/test';

export const BASE_URL = 'http://localhost:8081';
export const BACKEND_URL = 'http://localhost:5000';

export const TEST_USER = {
  email: `playwright.test.${Date.now()}@fitai.test`,
  password: 'TestPass123!',
  name: 'Playwright Tester',
};

/**
 * Navigate to a path and wait for network idle
 */
export async function goto(page: Page, path: string = '/') {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
}

/**
 * Wait for the auth screen to appear
 */
export async function waitForAuthScreen(page: Page) {
  await page.waitForSelector('[data-testid="tab-signin"], [testid="tab-signin"]', { timeout: 10000 })
    .catch(() => page.waitForSelector('text=Sign In', { timeout: 10000 }));
}

/**
 * Login with email using the auth form
 */
export async function loginWithEmail(page: Page, email: string, password: string = '') {
  await goto(page, '/auth');

  const emailInput = page.locator('input[type="email"], [data-testid="input-email"]').first();
  await emailInput.waitFor({ timeout: 8000 });
  await emailInput.fill(email);

  if (password) {
    const pwInput = page.locator('input[type="password"], [data-testid="input-password"]').first();
    await pwInput.fill(password);
  }

  const submitBtn = page.locator('[data-testid="btn-submit"], text=Sign In & Continue').first();
  await submitBtn.click();

  await page.waitForURL((url: URL) => !url.href.includes('/auth'), { timeout: 10000 });
}

/**
 * Sign up with email using the auth form
 */
export async function signupWithEmail(page: Page, name: string, email: string, password: string = '') {
  await goto(page, '/auth');

  const signupTab = page.locator('[data-testid="tab-signup"], text=Create Account').first();
  await signupTab.waitFor({ timeout: 8000 });
  await signupTab.click();

  const nameInput = page.locator('[data-testid="input-name"]').first();
  await nameInput.waitFor({ timeout: 5000 });
  await nameInput.fill(name);

  const emailInput = page.locator('input[type="email"], [data-testid="input-email"]').first();
  await emailInput.fill(email);

  if (password) {
    const pwInput = page.locator('input[type="password"], [data-testid="input-password"]').first();
    await pwInput.fill(password);
  }

  const submitBtn = page.locator('[data-testid="btn-submit"], text=Create Account & Continue').first();
  await submitBtn.click();

  await page.waitForURL((url: URL) => !url.href.includes('/auth'), { timeout: 10000 });
}

/**
 * Complete the onboarding wizard with default values
 */
export async function completeOnboarding(page: Page) {
  await page.waitForURL(/onboarding/, { timeout: 8000 });

  for (let i = 0; i < 6; i++) {
    const nextBtn = page.locator('text=Continue, text=Get Started, text=Finish').first();
    await nextBtn.waitFor({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(400);
  }

  await page.waitForURL(/\/\(tabs\)|tabs/, { timeout: 10000 });
}

/**
 * Assert that an element with testID is visible
 */
export async function assertVisible(page: Page, testId: string, text?: string) {
  const el = page.locator(`[testid="${testId}"], [data-testid="${testId}"]`).first();
  await expect(el).toBeVisible({ timeout: 8000 });
  if (text) await expect(el).toContainText(text);
}

/**
 * Clear session storage (simulate fresh app open)
 */
export async function clearSession(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('fitai_session');
  });
}
