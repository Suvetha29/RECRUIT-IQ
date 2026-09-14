import { test, expect } from '@playwright/test';
import path from 'path';
import {
  BASE_URL,
  registerUser,
  login,
  createJob,
  applyToJob,
  TEST_PASSWORD,
  logResult,
} from './helpers';

const TEST_RESUME = path.join(__dirname, 'fixtures', 'test-resume.pdf');

/**
 * NotificationBell.jsx is a dropdown in the navbar (🔔 button), NOT a page —
 * there is no /notifications route anywhere in App.js.
 *
 * Bell locator note: the emoji's byte encoding can vary depending on how the
 * source file is saved. We match on the aria-label OR the bell glyph, whichever
 * is present.
 */
function bellButton(page: import('@playwright/test').Page) {
  return page
    .locator(
      'button[aria-label*="notification" i], button[title*="notification" i], button:has-text("🔔")'
    )
    .first();
}

test.describe('Notifications (bell dropdown)', () => {

  test('bell shows "No notifications yet!" for a brand-new user',
    async ({ page }) => {
      test.setTimeout(60000);

      await registerUser(page, 'candidate');

      const bell = bellButton(page);
      await expect(bell).toBeVisible({ timeout: 10000 });
      await bell.click();

      await expect(page.getByText(/no notifications yet/i))
        .toBeVisible({ timeout: 10000 });
    });

  test('candidate gets a notification when shortlisted, and it links to My Applications',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      // --- HR: register + create job ---
      await registerUser(page, 'hr');
      const job = await createJob(page);

      // --- Candidate in ISOLATED context ---
      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');

      await applyToJob(candidatePage, job.title, TEST_RESUME);
      await expect(candidatePage.getByText(/application submitted/i))
        .toBeVisible({ timeout: 20000 });

      // Dismiss the ATS modal so it doesn't block further interaction
      const viewApps = candidatePage.getByRole('button', { name: /view my applications/i });
      if (await viewApps.isVisible().catch(() => false)) {
        await viewApps.click();
        await candidatePage.waitForTimeout(500);
      }

      // --- HR: navigate to applicants + shortlist ---
      await page.goto(`${BASE_URL}/jobs`);
      const jobCard = page.locator('.job-card', { hasText: job.title });
      await expect(jobCard).toBeVisible({ timeout: 20000 });

      const applicantsBtn = jobCard.getByRole('button', { name: /applicants/i });
      await expect(applicantsBtn).toBeVisible({ timeout: 15000 });
      await applicantsBtn.click();

      await expect(page).toHaveURL(/\/hr\/applications\//, { timeout: 15000 });

      const statusSelect = page.locator('select.status-select').first();
      await expect(statusSelect).toBeVisible({ timeout: 15000 });

      const statusUpdate = page.waitForResponse(
        (r) =>
          r.url().includes('/api/applications/') &&
          r.request().method() === 'PATCH' &&
          r.ok(),
        { timeout: 15000 }
      );
      await statusSelect.selectOption('shortlisted');
      await statusUpdate;

      // --- Candidate: refresh + check bell ---
      await candidatePage.bringToFront();
      await candidatePage.goto(`${BASE_URL}/jobs`);
      await candidatePage.reload({ waitUntil: 'networkidle' });
      await candidatePage.waitForTimeout(1500);

      const bell = bellButton(candidatePage);
      await expect(bell).toBeVisible({ timeout: 10000 });
      await bell.click();

      // Bell polls every 30s — give the notification a moment to appear
      const shortlistedNotif = candidatePage.getByText(/shortlisted/i).first();
      await expect(shortlistedNotif).toBeVisible({ timeout: 20000 });

      // Clicking the notification navigates to /my-applications
      await shortlistedNotif.click();
      await expect(candidatePage).toHaveURL(/my-applications/, { timeout: 10000 });

      logResult('notification click navigation', candidatePage.url());
      await candidateContext.close();
    });
});

test.describe('Settings', () => {

  test('user can update their profile name', async ({ page }) => {
    test.setTimeout(60000);

    await registerUser(page, 'candidate');
    await page.goto(`${BASE_URL}/settings`);

    await page.getByPlaceholder('Your full name').fill('Updated Name');
    await page.locator('button.btn-save').click();

    await expect(page.getByText(/profile updated successfully!/i))
      .toBeVisible({ timeout: 10000 });
  });

  test('user can change password with the correct current password',
    async ({ page }) => {
      test.setTimeout(90000);

      const user = await registerUser(page, 'candidate');
      await page.goto(`${BASE_URL}/settings`);

      await page.locator('.tabs-row').getByRole('button', { name: /change password/i }).click();

      const newPassword = 'NewTest@5678';
      await page.getByPlaceholder('Enter your current password').fill(user.password);
      await page.getByPlaceholder('Enter new password').fill(newPassword);
      await page.getByPlaceholder('Confirm new password').fill(newPassword);
      await page.locator('button.btn-save').click();

      await expect(page.getByText(/password changed successfully!/i))
        .toBeVisible({ timeout: 10000 });

      // JWT is in localStorage, not cookies — clear it so login starts fresh
      await page.evaluate(() => localStorage.clear());

      await login(page, user.email, newPassword);
      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    });

  test('mismatched new/confirm passwords are rejected client-side',
    async ({ page }) => {
      test.setTimeout(60000);

      await registerUser(page, 'candidate');
      await page.goto(`${BASE_URL}/settings`);
      await page.locator('.tabs-row').getByRole('button', { name: /change password/i }).click();

      await page.getByPlaceholder('Enter your current password').fill(TEST_PASSWORD);
      await page.getByPlaceholder('Enter new password').fill('NewOne@123');
      await page.getByPlaceholder('Confirm new password').fill('Different@456');
      await page.locator('button.btn-save').click();

      await expect(page.getByText(/new passwords do not match/i))
        .toBeVisible({ timeout: 5000 });
    });

  test('new password under 6 characters is rejected client-side',
    async ({ page }) => {
      test.setTimeout(60000);

      await registerUser(page, 'candidate');
      await page.goto(`${BASE_URL}/settings`);
      await page.locator('.tabs-row').getByRole('button', { name: /change password/i }).click();

      await page.getByPlaceholder('Enter your current password').fill(TEST_PASSWORD);
      await page.getByPlaceholder('Enter new password').fill('abc');
      await page.getByPlaceholder('Confirm new password').fill('abc');
      await page.locator('button.btn-save').click();

      await expect(page.getByText(/password must be at least 6 characters/i))
        .toBeVisible({ timeout: 5000 });
    });

  test('wrong current password shows backend error "Current password is incorrect"',
    async ({ page }) => {
      test.setTimeout(60000);

      await registerUser(page, 'candidate');
      await page.goto(`${BASE_URL}/settings`);
      await page.locator('.tabs-row').getByRole('button', { name: /change password/i }).click();

      await page.getByPlaceholder('Enter your current password').fill('TotallyWrongPassword1');
      await page.getByPlaceholder('Enter new password').fill('NewOne@123');
      await page.getByPlaceholder('Confirm new password').fill('NewOne@123');
      await page.locator('button.btn-save').click();

      await expect(page.getByText(/current password is incorrect/i))
        .toBeVisible({ timeout: 10000 });
    });
});