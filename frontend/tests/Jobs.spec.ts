import { test, expect } from '@playwright/test';
import { BASE_URL, registerUser, createJob } from './helpers';

test.describe('Job Posting Management', () => {
  test('HR can create a job posting', async ({ page }) => {
    await registerUser(page, 'hr');
    const job = await createJob(page, { title: `Manual Job ${Date.now()}` });

    await expect(page).toHaveURL(/\/jobs$/);
    await expect(page.locator('.job-card', { hasText: job.title })).toBeVisible();
  });

  test('AI-generate button is disabled until title and company are filled', async ({ page }) => {
    await registerUser(page, 'hr');
    await page.goto(`${BASE_URL}/create-job`);

    const aiButton = page.getByRole('button', { name: /generate job details with ai/i });
    await expect(aiButton).toBeDisabled();

    await page.locator('input[name="title"]').fill('Backend Engineer');
    await page.locator('input[name="company"]').fill('Acme Inc');
    await expect(aiButton).toBeEnabled();
  });

  test('HR can generate a job description with AI', async ({ page }) => {
    await registerUser(page, 'hr');
    await page.goto(`${BASE_URL}/create-job`);

    await page.locator('input[name="title"]').fill('Backend Engineer');
    await page.locator('input[name="company"]').fill('Acme Inc');

    // Real handler shows a window.alert() on success — accept it.
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /generate job details with ai/i }).click();

    // AI generation calls a real LLM backend — allow generous time.
    await expect(page.locator('textarea[name="description"]')).not.toBeEmpty({ timeout: 30000 });
  });

  test('submitting an incomplete form does not navigate away (native required validation)', async ({ page }) => {
    await registerUser(page, 'hr');
    await page.goto(`${BASE_URL}/create-job`);
    await page.getByRole('button', { name: /post job/i }).click();

    // All text/textarea fields are HTML5 `required` — browser blocks
    // submission client-side, so we should simply still be on the same page.
    await expect(page).toHaveURL(/create-job/);
  });

  test('closing a job keeps it visible in the candidate job list',
  async ({ page, browser }) => {
    test.setTimeout(90000);

    await registerUser(page, 'hr');
    const job = await createJob(page);

    await page.goto(`${BASE_URL}/jobs`);
    const card = page.locator('.job-card', { hasText: job.title });
    await card.getByRole('button', { name: /close job/i }).click();
    await expect(card.getByText(/closed/i).first()).toBeVisible({ timeout: 10000 });

    const candidateContext = await browser.newContext();
    const candidatePage = await candidateContext.newPage();
    await registerUser(candidatePage, 'candidate');
    await candidatePage.goto(`${BASE_URL}/jobs`);

    await expect(
      candidatePage.locator('.job-card', { hasText: job.title })
    ).toBeVisible({ timeout: 10000 });

    await candidateContext.close();
  });

  test('HR can reopen a closed job', async ({ page }) => {
    await registerUser(page, 'hr');
    const job = await createJob(page);

    await page.goto(`${BASE_URL}/jobs`);
    const card = page.locator('.job-card', { hasText: job.title });
    await card.getByRole('button', { name: /close job/i }).click();
    await expect(card.getByRole('button', { name: /reopen job/i })).toBeVisible({ timeout: 10000 });
    await card.getByRole('button', { name: /reopen job/i }).click();
    await expect(card.getByRole('button', { name: /close job/i })).toBeVisible({ timeout: 10000 });
  });

  test('HR can delete a job posting', async ({ page }) => {
    await registerUser(page, 'hr');
    const job = await createJob(page);

    await page.goto(`${BASE_URL}/jobs`);
    const card = page.locator('.job-card', { hasText: job.title });
    await card.getByRole('button', { name: /delete/i }).click();

    // JobList.js renders a confirm modal ("Delete Job Post?")
    await expect(page.getByText(/delete job post\?/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /yes, delete/i }).click();

    await expect(page.locator('.job-card', { hasText: job.title })).toHaveCount(0, { timeout: 10000 });
  });
});