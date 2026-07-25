/**
 * FitAI X — Auth Screen E2E Tests
 * Tests: redirect to /auth, sign in tab UI, sign up tab UI, Google button, error state
 */

import { test, expect } from '@playwright/test';
import { goto, clearSession, BASE_URL, TEST_USER } from './helpers';

test.describe('Auth Screen', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await clearSession(page);
  });

  test('redirects unauthenticated users to /auth', async ({ page }) => {
    await goto(page, '/');
    await expect(page).toHaveURL(/auth/, { timeout: 10000 });
  });

  test('shows Sign In tab by default', async ({ page }) => {
    await goto(page, '/auth');
    await expect(page.locator('text=Sign In').first()).toBeVisible();
    await expect(page.locator('text=Create Account').first()).toBeVisible();
  });

  test('shows FitAI Pro branding', async ({ page }) => {
    await goto(page, '/auth');
    await expect(page.locator('text=FitAI Pro').first()).toBeVisible({ timeout: 8000 });
  });

  test('shows name field only in Create Account tab', async ({ page }) => {
    await goto(page, '/auth');

    const nameInput = page.locator('input[placeholder="Enter your name"]');
    await expect(nameInput).not.toBeVisible();

    await page.locator('text=Create Account').first().click();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
  });

  test('shows error when submitting empty email', async ({ page }) => {
    await goto(page, '/auth');

    const submitBtn = page.locator('text=Sign In & Continue').first();
    await submitBtn.waitFor({ timeout: 8000 });
    await submitBtn.click();

    await expect(page.locator('text=Please enter your email address.').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows Continue with Google button', async ({ page }) => {
    await goto(page, '/auth');
    const googleBtn = page.locator('text=Continue with Google').first();
    await expect(googleBtn).toBeVisible({ timeout: 8000 });
  });

  test('email sign in navigates away from auth page', async ({ page }) => {
    await goto(page, '/auth');

    const email = `test.signin.${Date.now()}@fitai.test`;
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 8000 });
    await emailInput.fill(email);

    const submitBtn = page.locator('text=Sign In & Continue').first();
    await submitBtn.click();

    await page.waitForURL((url: URL) => !url.href.endsWith('/auth'), { timeout: 12000 });
    expect(page.url()).not.toContain('/auth');
  });

  test('sign up with new account navigates to onboarding', async ({ page }) => {
    await goto(page, '/auth');

    await page.locator('text=Create Account').first().click();

    const email = `test.signup.${Date.now()}@fitai.test`;
    const nameInput = page.locator('input[placeholder="Enter your name"]');
    await nameInput.waitFor({ timeout: 5000 });
    await nameInput.fill('Test User');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(email);

    await page.locator('text=Create Account & Continue').first().click();
    await page.waitForURL((url: URL) => url.href.includes('onboarding') || !url.href.includes('/auth'), { timeout: 12000 });
  });

});
