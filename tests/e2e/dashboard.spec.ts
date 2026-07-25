/**
 * FitAI X — Dashboard E2E Tests
 * Tests: new user empty state, returning user data state, navigation tabs, FAB chat button
 */

import { test, expect } from '@playwright/test';
import { goto, clearSession, BASE_URL } from './helpers';

async function loginAsNewUser(page: any) {
  const email = `dashboard.test.${Date.now()}@fitai.test`;
  await goto(page, '/auth');
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ timeout: 8000 });
  await emailInput.fill(email);
  await page.locator('text=Sign In & Continue').first().click();
  try {
    await page.waitForURL(/onboarding/, { timeout: 8000 });
    for (let i = 0; i < 6; i++) {
      const btn = page.locator('text=Continue, text=Get Started, text=Finish').first();
      await btn.waitFor({ timeout: 5000 });
      await btn.click();
      await page.waitForTimeout(400);
      if (!page.url().includes('onboarding')) break;
    }
  } catch {
    // Already on dashboard
  }
  await page.waitForURL((url: URL) => !url.href.includes('onboarding') && !url.href.includes('/auth'), { timeout: 12000 });
}

test.describe('Dashboard Screen', () => {

  test('shows username from user profile', async ({ page }) => {
    await loginAsNewUser(page);
    const username = page.locator('[testid="dashboard-username"], text=Athlete, text=Tester').first();
    await expect(username).toBeVisible({ timeout: 10000 });
  });

  test('shows empty workout card for new user', async ({ page }) => {
    await loginAsNewUser(page);
    const generateBtn = page.locator('[testid="generate-workout-btn"], text=Generate Custom AI Workout').first();
    await generateBtn.waitFor({ timeout: 12000 });
    await expect(generateBtn).toBeVisible();
  });

  test('shows Daily Overview stats section', async ({ page }) => {
    await loginAsNewUser(page);
    await expect(page.locator('text=Daily Overview').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Body Weight').first()).toBeVisible();
    await expect(page.locator('text=BMI').first()).toBeVisible();
  });

  test('FAB AI chat button is visible', async ({ page }) => {
    await loginAsNewUser(page);
    const fab = page.locator('[testid="fab-chat"]').first();
    await expect(fab).toBeVisible({ timeout: 10000 });
  });

  test('avatar button navigates to profile', async ({ page }) => {
    await loginAsNewUser(page);
    const avatarBtn = page.locator('[testid="avatar-btn"]').first();
    await avatarBtn.waitFor({ timeout: 10000 });
    await avatarBtn.click();
    await page.waitForURL(/profile/, { timeout: 8000 });
  });

  test('profile screen shows real user data', async ({ page }) => {
    await loginAsNewUser(page);
    await goto(page, '/(tabs)/profile');
    const name = page.locator('[testid="profile-name"]').first();
    await expect(name).toBeVisible({ timeout: 8000 });
    const email = page.locator('[testid="profile-email"]').first();
    await expect(email).toBeVisible();
  });

  test('logout button clears session and returns to auth', async ({ page }) => {
    await loginAsNewUser(page);
    await goto(page, '/(tabs)/profile');
    const logoutBtn = page.locator('[testid="btn-logout"], text=Log Out Account').first();
    await logoutBtn.waitFor({ timeout: 8000 });
    await logoutBtn.click();
    await page.waitForURL(/auth/, { timeout: 10000 });
    await expect(page).toHaveURL(/auth/);
  });

  test('session cleared on logout — re-open sends to auth', async ({ page }) => {
    await loginAsNewUser(page);
    await clearSession(page);
    await goto(page, '/');
    await page.waitForURL(/auth/, { timeout: 10000 });
  });

});
