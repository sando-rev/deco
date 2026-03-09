import { test as setup, expect, Page } from '@playwright/test';

const TEST_ATHLETE_EMAIL = 'test-playwright@deco.app';
const TEST_ATHLETE_PASSWORD = 'TestPass123!';
const TEST_COACH_EMAIL = 'test-coach@deco.app';
const TEST_COACH_PASSWORD = 'TestPass123!';

export { TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD, TEST_COACH_EMAIL, TEST_COACH_PASSWORD };

export async function loginAsAthlete(page: Page) {
  await page.goto('/');
  // Wait for the app to load
  await page.waitForTimeout(2000);

  // If already on athlete pages, we're logged in
  const url = page.url();
  if (url.includes('athlete') || url.includes('development') || url.includes('profile')) {
    return;
  }

  // Fill sign in form
  const emailInput = page.getByPlaceholder('jouw@email.com').or(page.getByPlaceholder('your@email.com'));
  const passwordInput = page.getByPlaceholder('Voer je wachtwoord in').or(page.getByPlaceholder('Enter your password'));

  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill(TEST_ATHLETE_EMAIL);
  await passwordInput.fill(TEST_ATHLETE_PASSWORD);

  // Click sign in
  const signInButton = page.getByRole('button', { name: /inloggen|sign in/i });
  await signInButton.click();

  // Wait for navigation to athlete area
  await page.waitForTimeout(3000);
}

export async function loginAsCoach(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(2000);

  const url = page.url();
  if (url.includes('coach') || url.includes('players') || url.includes('team')) {
    return;
  }

  const emailInput = page.getByPlaceholder('jouw@email.com').or(page.getByPlaceholder('your@email.com'));
  const passwordInput = page.getByPlaceholder('Voer je wachtwoord in').or(page.getByPlaceholder('Enter your password'));

  await emailInput.waitFor({ timeout: 10000 });
  await emailInput.fill(TEST_COACH_EMAIL);
  await passwordInput.fill(TEST_COACH_PASSWORD);

  const signInButton = page.getByRole('button', { name: /inloggen|sign in/i });
  await signInButton.click();

  await page.waitForTimeout(3000);
}
