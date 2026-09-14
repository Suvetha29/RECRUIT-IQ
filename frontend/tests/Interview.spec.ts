import { test, expect } from '@playwright/test';
import path from 'path';
import { BASE_URL, registerUser, createJob, applyToJob } from './helpers';

const TEST_RESUME = path.join(__dirname, 'fixtures', 'test-resume.pdf');

test.describe('Interview Scheduling', () => {

  async function applyAndReachApplicantsTable(
    recruiterPage: import('@playwright/test').Page,
    candidatePage: import('@playwright/test').Page,
    jobTitle: string
  ) {
    await applyToJob(candidatePage, jobTitle, TEST_RESUME);
    await expect(candidatePage.getByText(/application submitted/i))
      .toBeVisible({ timeout: 20000 });

    // Dismiss the ATS modal so it doesn't interfere
    const viewAppsBtn = candidatePage.getByRole('button', { name: /view my applications/i });
    if (await viewAppsBtn.isVisible().catch(() => false)) {
      await viewAppsBtn.click();
      await candidatePage.waitForTimeout(500);
    }

    // HR side: reload /jobs and open applicants table
    await recruiterPage.goto(`${BASE_URL}/jobs`);
    const jobCard = recruiterPage.locator('.job-card', { hasText: jobTitle });
    await expect(jobCard).toBeVisible({ timeout: 20000 });

    const applicantsBtn = jobCard.getByRole('button', { name: /applicants/i });
    await expect(applicantsBtn).toBeVisible({ timeout: 15000 });
    await applicantsBtn.click();

    await expect(recruiterPage).toHaveURL(/\/hr\/applications\//, { timeout: 15000 });
    await expect(recruiterPage.locator('select.status-select').first())
      .toBeVisible({ timeout: 15000 });
  }

  async function fillInterviewModal(
    page: import('@playwright/test').Page,
    opts: { date?: string; time?: string } = {}
  ) {
    const date = opts.date ?? new Date().toISOString().split('T')[0];
    const time = opts.time ?? '14:00';

    await expect(page.getByRole('heading', { name: /schedule interview/i }))
      .toBeVisible({ timeout: 10000 });

    const dateInput = page.locator(
      'input[type="date"], input[placeholder*="dd-mm-yyyy" i], input[placeholder*="dd/mm/yyyy" i]'
    ).first();
    await expect(dateInput).toBeVisible({ timeout: 5000 });
    await dateInput.fill(date);
    await dateInput.press('Tab');

    const timeInput = page.locator(
      'input[type="time"], input[placeholder*="--:--" i]'
    ).first();
    await expect(timeInput).toBeVisible({ timeout: 5000 });
    await timeInput.fill(time);
    await timeInput.press('Tab');
  }

  test('HR can schedule an interview via the status dropdown',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      // HR side
      await registerUser(page, 'hr');
      const job = await createJob(page);

      // Candidate side — SEPARATE browser context (isolated cookies)
      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');

      await applyAndReachApplicantsTable(page, candidatePage, job.title);

      // HR opens the Schedule Interview modal by choosing "interview"
      await page.locator('select.status-select').first().selectOption('interview');

      await fillInterviewModal(page);
      await page.getByRole('button', { name: /confirm & send/i }).click();

      await expect(page.getByRole('heading', { name: /schedule interview/i }))
        .not.toBeVisible({ timeout: 15000 });

      const statusValue = await page.locator('select.status-select').first().inputValue();
      expect(statusValue).toBe('interview');

      await candidateContext.close();
    });

  test('interview date/time are required before confirming',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      await registerUser(page, 'hr');
      const job = await createJob(page);

      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');

      await applyAndReachApplicantsTable(page, candidatePage, job.title);

      await page.locator('select.status-select').first().selectOption('interview');
      await expect(page.getByRole('heading', { name: /schedule interview/i }))
        .toBeVisible({ timeout: 10000 });

      // Click Confirm WITHOUT filling date/time
      await page.getByRole('button', { name: /confirm & send/i }).click();

      const error = page.getByText(/please select|required|must.*date|date.*required/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });

      await candidateContext.close();
    });

  test('candidate sees a "Join Now" action once interview status is set',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      await registerUser(page, 'hr');
      const job = await createJob(page);

      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');

      await applyAndReachApplicantsTable(page, candidatePage, job.title);

      await page.locator('select.status-select').first().selectOption('interview');
      await fillInterviewModal(page);
      await page.getByRole('button', { name: /confirm & send/i }).click();
      await expect(page.getByRole('heading', { name: /schedule interview/i }))
        .not.toBeVisible({ timeout: 15000 });

      // Candidate navigates to their apps
      await candidatePage.goto(`${BASE_URL}/my-applications`);
      await candidatePage.waitForLoadState('networkidle');

      const viewDetails = candidatePage.getByRole('button', { name: /view details/i }).first();
      if (await viewDetails.isVisible().catch(() => false)) {
        await viewDetails.click();
        await candidatePage.waitForTimeout(800);
      }

      await expect(
        candidatePage.getByRole('button', { name: /join now|join interview|join/i }).first()
      ).toBeVisible({ timeout: 15000 });

      await candidateContext.close();
    });

  test('HR can upload an interview recording for AI evaluation',
    async ({ page, browser }) => {
      test.setTimeout(180000);

      await registerUser(page, 'hr');
      const job = await createJob(page);

      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');

      await applyAndReachApplicantsTable(page, candidatePage, job.title);

      // Click "🎙️ Recording"
      const recordingBtn = page.getByRole('button', { name: /recording/i }).first();
      await expect(recordingBtn).toBeVisible({ timeout: 15000 });
      await recordingBtn.click();
      await page.waitForTimeout(1500);

      // Then the big "Upload Recording" button
      const uploadBtn = page.getByRole('button', { name: /upload recording/i }).first();
      await expect(uploadBtn).toBeVisible({ timeout: 10000 });
      await uploadBtn.click();

      // File picker
      const fileInput = page.locator('input[type="file"]').last();
      await fileInput.setInputFiles(
        path.join(__dirname, 'fixtures', 'sample-interview.mp3')
      );

      const confirmUpload = page.getByRole('button', { name: /upload & evaluate|upload/i }).last();
      await confirmUpload.click();

      await expect(page.getByText(/transcribing|evaluating|processing/i).first())
        .toBeVisible({ timeout: 15000 });

      await candidateContext.close();
    });
});