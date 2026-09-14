import { test, expect } from '@playwright/test';
import path from 'path';
import { BASE_URL, registerUser, createJob, applyToJob, logResult } from './helpers';

const TEST_RESUME = path.join(__dirname, 'fixtures', 'test-resume.pdf');
const INVALID_FILE = path.join(__dirname, 'fixtures', 'invalid-file.txt');

test.describe('Job Application & ATS Scoring', () => {

  test('candidate can browse jobs', async ({ page }) => {
    test.setTimeout(60000);

    await registerUser(page, 'candidate');
    await page.goto(`${BASE_URL}/jobs`);
    await expect(page.locator('.job-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('candidate can apply to a job and immediately sees an ATS score',
    async ({ page, browser }) => {
      test.setTimeout(90000);

      // HR creates the job in an ISOLATED context so it never shares JWT with candidate
      const hrContext = await browser.newContext();
      const hrPage = await hrContext.newPage();
      await registerUser(hrPage, 'hr');
      const job = await createJob(hrPage, { title: `ATS Test Role ${Date.now()}` });
      await hrContext.close();

      // Candidate applies
      await registerUser(page, 'candidate');
      await applyToJob(page, job.title, TEST_RESUME);

      await expect(page.getByText(/application submitted/i))
        .toBeVisible({ timeout: 20000 });

      const scoreText = await page.getByText(/ats score/i).locator('..').textContent();
      logResult('ATS score shown to candidate on apply', scoreText);
    });

  test('non-PDF resume is rejected with "Only PDF files are accepted."',
    async ({ page }) => {
      test.setTimeout(60000);

      await registerUser(page, 'candidate');
      await page.goto(`${BASE_URL}/jobs`);
      const card = page.locator('.job-card').first();
      await expect(card).toBeVisible({ timeout: 15000 });

      await card.getByRole('button', { name: /apply now/i }).click();
      await page.locator('#resume-input').setInputFiles(INVALID_FILE);

      await expect(page.getByText(/only pdf files are accepted/i))
        .toBeVisible({ timeout: 5000 });
    });

  test('submit button stays disabled until a resume is attached',
    async ({ page }) => {
      test.setTimeout(60000);

      await registerUser(page, 'candidate');
      await page.goto(`${BASE_URL}/jobs`);
      const card = page.locator('.job-card').first();
      await expect(card).toBeVisible({ timeout: 15000 });

      await card.getByRole('button', { name: /apply now/i }).click();

      await expect(page.getByRole('button', { name: /^submit application$/i }))
        .toBeDisabled();

      await page.locator('#resume-input').setInputFiles(TEST_RESUME);

      await expect(page.getByRole('button', { name: /^submit application$/i }))
        .toBeEnabled();
    });

  test('after applying, the job card shows "Applied" instead of "Apply Now"',
    async ({ page, browser }) => {
      test.setTimeout(90000);

      const hrContext = await browser.newContext();
      const hrPage = await hrContext.newPage();
      await registerUser(hrPage, 'hr');
      const job = await createJob(hrPage);
      await hrContext.close();

      await registerUser(page, 'candidate');
      await applyToJob(page, job.title, TEST_RESUME);
      await expect(page.getByText(/application submitted/i))
        .toBeVisible({ timeout: 20000 });

      const viewApps = page.getByRole('button', { name: /view my applications/i });
      if (await viewApps.isVisible().catch(() => false)) {
        await viewApps.click();
        await page.waitForTimeout(500);
      }

      await page.goto(`${BASE_URL}/jobs`);
      const card = page.locator('.job-card', { hasText: job.title });
      await expect(card).toBeVisible({ timeout: 15000 });
      await expect(card.getByRole('button', { name: /applied/i }))
        .toBeVisible({ timeout: 10000 });
    });

  test('recruiter sees the ATS score for an applicant in the applications table',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      // HR side
      await registerUser(page, 'hr');
      const job = await createJob(page);

      // Candidate in ISOLATED context — critical fix, avoids JWT overwrite
      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');
      await applyToJob(candidatePage, job.title, TEST_RESUME);
      await expect(candidatePage.getByText(/application submitted/i))
        .toBeVisible({ timeout: 20000 });
      await candidatePage.close();

      // HR back to jobs and open applicants
      await page.goto(`${BASE_URL}/jobs`);
      const jobCard = page.locator('.job-card', { hasText: job.title });
      await expect(jobCard).toBeVisible({ timeout: 20000 });

      const applicantsBtn = jobCard.getByRole('button', { name: /applicants/i });
      await expect(applicantsBtn).toBeVisible({ timeout: 15000 });
      await applicantsBtn.click();

      await expect(page).toHaveURL(/\/hr\/applications\//, { timeout: 15000 });

      // ATS score is rendered as "{n}%" somewhere in the applicant row
      const percentText = page.getByText(/\d+%/).first();
      await expect(percentText).toBeVisible({ timeout: 15000 });

      const score = (await percentText.textContent()) || '';
      logResult('ATS score shown to recruiter', score);

      await candidateContext.close();
    });
});