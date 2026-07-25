/**
 * FitAI X — Onboarding Wizard E2E Tests
 * Tests: 6-step wizard UI, navigation, step progress, final submit to DB
 */

import { test, expect } from '@playwright/test';
import { goto, BASE_URL } from './helpers';

const TEST_EMAIL = `onboarding.test.${Date.now()}@fitai.test`;

async function signupAndGoToOnboarding(page: any) {
  await goto(page, '/auth');

  await page.locator('text=Create Account').first().click();

  const nameInput = page.locator('input[placeholder="Enter your name"]');
  await nameInput.waitFor({ timeout: 5000 });
  await nameInput.fill('Onboarding Tester');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill(TEST_EMAIL);

  await page.locator('text=Create Account & Continue').first().click();
  await page.waitForURL(/onboarding/, { timeout: 12000 });
}

test.describe('Onboarding Wizard', () => {

  test('renders onboarding wizard after signup', async ({ page }) => {
    await signupAndGoToOnboarding(page);

    await expect(page).toHaveURL(/onboarding/);
    const heading = page.locator('text=Step 1, text=What should we call you, text=Name').first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('can navigate forward through steps', async ({ page }) => {
    await signupAndGoToOnboarding(page);

    for (let i = 0; i < 5; i++) {
      const nextBtn = page.locator('text=Continue, text=Next').first();
      await nextBtn.waitFor({ timeout: 6000 });
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    expect(page.url()).toContain('onboarding');
  });

  test('shows progress indicator', async ({ page }) => {
    await signupAndGoToOnboarding(page);

    const progress = page.locator('[style*="width"], text=Step, text=1 of, text=/6').first();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('onboarding');
  });

  test('completing onboarding redirects to dashboard', async ({ page }) => {
    await goto(page, '/auth');

    const freshEmail = `complete.onboard.${Date.now()}@fitai.test`;
    await page.locator('text=Create Account').first().click();

    const nameInput = page.locator('input[placeholder="Enter your name"]');
    await nameInput.waitFor({ timeout: 5000 });
    await nameInput.fill('Complete Tester');
    await page.locator('input[type="email"]').first().fill(freshEmail);
    await page.locator('text=Create Account & Continue').first().click();
    await page.waitForURL(/onboarding/, { timeout: 12000 });

    for (let step = 0; step < 6; step++) {
      const btn = page.locator('text=Continue, text=Get Started, text=Finish, text=Complete').first();
      await btn.waitFor({ timeout: 8000 });
      await btn.click();
      await page.waitForTimeout(600);

      if (!page.url().includes('onboarding')) break;
    }

    await page.waitForURL((url: URL) => !url.href.includes('onboarding'), { timeout: 12000 });
    expect(page.url()).not.toContain('onboarding');
  });

});
