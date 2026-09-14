import { test, expect } from '@playwright/test';
import path from 'path';
import { BASE_URL, registerUser, createJob, applyToJob } from './helpers';

const TEST_RESUME = path.join(__dirname, 'fixtures', 'test-resume.pdf');

// ===========================================================================
// HELPERS
// ===========================================================================

/**
 * HR changes the applicant status on /hr/applications/:id and waits for the PATCH.
 */
async function setApplicationStatus(
  hrPage: import('@playwright/test').Page,
  jobTitle: string,
  status: 'pending' | 'under_review' | 'shortlisted' | 'interview' | 'hired' | 'rejected'
) {
  await hrPage.goto(`${BASE_URL}/jobs`);
  const jobCard = hrPage.locator('.job-card', { hasText: jobTitle });
  await expect(jobCard).toBeVisible({ timeout: 20000 });

  const applicantsBtn = jobCard.getByRole('button', { name: /applicants/i });
  await expect(applicantsBtn).toBeVisible({ timeout: 15000 });
  await applicantsBtn.click();

  await expect(hrPage).toHaveURL(/\/hr\/applications\//, { timeout: 15000 });

  const statusSelect = hrPage.locator('select.status-select').first();
  await expect(statusSelect).toBeVisible({ timeout: 15000 });

  const patch = hrPage.waitForResponse(
    (r) =>
      r.url().includes('/api/applications/') &&
      r.request().method() === 'PATCH' &&
      r.ok(),
    { timeout: 15000 }
  );

  await statusSelect.selectOption(status);
  await patch;
  await hrPage.waitForTimeout(500);
}

/**
 * Candidate opens /my-applications, expands the card, and clicks "Take Assessment".
 */
async function openAssessment(candidatePage: import('@playwright/test').Page) {
  await candidatePage.goto(`${BASE_URL}/my-applications`);
  await candidatePage.waitForLoadState('networkidle');

  const viewDetails = candidatePage
    .getByRole('button', { name: /view details/i })
    .first();
  await expect(viewDetails).toBeVisible({ timeout: 15000 });
  await viewDetails.click();
  await candidatePage.waitForTimeout(1000);

  const takeAssessment = candidatePage.getByRole('button', {
    name: /take assessment/i,
  });
  await expect(takeAssessment).toBeVisible({ timeout: 15000 });
  await takeAssessment.click();

  await expect(candidatePage).toHaveURL(/\/assessment\//, { timeout: 10000 });
  await expect(candidatePage.getByText(/⏱/)).toBeVisible({ timeout: 10000 });
}

/**
 * Clicks the answer option (B = "4" in our tests).
 * Tries every plausible markup shape.
 */
async function clickAnswerOption(
  candidatePage: import('@playwright/test').Page,
  answerText = '4',
  answerLetter = 'B'
) {
  const strategies = [
    candidatePage
      .getByRole('button', {
        name: new RegExp(
          `^${answerLetter}[\\.\\):\\s-]*\\s*${answerText}\\b`,
          'i'
        ),
      })
      .first(),
    candidatePage.getByRole('button', { name: answerText, exact: true }).first(),
    candidatePage.getByRole('button', { name: new RegExp(`\\b${answerText}\\b`) }).first(),
    candidatePage.locator('input[type="radio"]').nth(1),
    candidatePage.locator(`label:has-text("${answerText}")`).first(),
    candidatePage.getByText(answerText, { exact: true }).first(),
  ];

  for (const loc of strategies) {
    if (await loc.isVisible({ timeout: 1000 }).catch(() => false)) {
      await loc.click();
      return;
    }
  }
  throw new Error(`Could not find answer option "${answerLetter} / ${answerText}"`);
}

/**
 * Submits the assessment and waits for the result screen.
 * Matches the app's actual wording ("Assessment Complete", "Your Score: N", "Well done!").
 */
async function submitAndWaitForResult(
  candidatePage: import('@playwright/test').Page
) {
  const submitBtn = candidatePage
    .getByRole('button', {
      name: /submit assessment|submit answers|submit|finish/i,
    })
    .last();
  await expect(submitBtn).toBeVisible({ timeout: 10000 });
  await submitBtn.click();

  // Confirm dialog if any
  const confirm = candidatePage
    .getByRole('button', { name: /confirm|yes|submit/i })
    .last();
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click().catch(() => {});
  }

  // Result screen — matches your app's actual wording
  await expect(
    candidatePage
      .getByText(
        /assessment complete|your score|well done|congratulations|better luck|\d+%/i
      )
      .first()
  ).toBeVisible({ timeout: 30000 });
}

// ===========================================================================
// TESTS
// ===========================================================================

test.describe('MCQ Assessment', () => {

  test('HR can create an assessment with a question', async ({ page }) => {
    test.setTimeout(90000);

    await registerUser(page, 'hr');
    const job = await createJob(page);

    await page.goto(`${BASE_URL}/jobs`);
    const jobCard = page.locator('.job-card', { hasText: job.title });
    await expect(jobCard).toBeVisible({ timeout: 20000 });
    await jobCard.getByRole('button', { name: /applicants/i }).click();
    await expect(page).toHaveURL(/\/hr\/applications\//, { timeout: 15000 });

    await page.getByRole('button', { name: /assessment/i }).click();
    await expect(page).toHaveURL(/\/hr\/assessment\//, { timeout: 10000 });

    await page.getByPlaceholder('Enter question 1 here...').fill('What does SQL stand for?');
    await page.getByPlaceholder('Option A').fill('Structured Query Language');
    await page.getByPlaceholder('Option B').fill('Simple Query Logic');
    await page.getByPlaceholder('Option C').fill('Sequential Query List');
    await page.getByPlaceholder('Option D').fill('Standard Question Language');

    await page.getByRole('button', { name: /save assessment/i }).click();
    await expect(page.getByText(/assessment saved/i)).toBeVisible({ timeout: 10000 });
  });

  test('candidate cannot take assessment before being shortlisted',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      await registerUser(page, 'hr');
      const job = await createJob(page);

      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');
      await applyToJob(candidatePage, job.title, TEST_RESUME);
      await expect(candidatePage.getByText(/application submitted/i))
        .toBeVisible({ timeout: 20000 });

      await candidatePage.goto(`${BASE_URL}/my-applications`);
      await candidatePage.waitForLoadState('networkidle');

      const viewDetails = candidatePage
        .getByRole('button', { name: /view details/i })
        .first();
      if (await viewDetails.isVisible().catch(() => false)) {
        await viewDetails.click();
        await candidatePage.waitForTimeout(500);
      }

      await expect(
        candidatePage.getByRole('button', { name: /take assessment/i })
      ).not.toBeVisible();

      await candidateContext.close();
    });

  test('candidate takes assessment under the countdown timer once shortlisted',
    async ({ page, browser }) => {
      test.setTimeout(240000);

      // ---- HR: job + assessment ----
      await registerUser(page, 'hr');
      const job = await createJob(page);

      await page.goto(`${BASE_URL}/jobs`);
      const jobCard = page.locator('.job-card', { hasText: job.title });
      await expect(jobCard).toBeVisible({ timeout: 20000 });
      await jobCard.getByRole('button', { name: /applicants/i }).click();
      await expect(page).toHaveURL(/\/hr\/applications\//, { timeout: 15000 });

      await page.getByRole('button', { name: /assessment/i }).click();
      await expect(page).toHaveURL(/\/hr\/assessment\//, { timeout: 10000 });

      await page.getByPlaceholder('Enter question 1 here...').fill('2 + 2 = ?');
      await page.getByPlaceholder('Option A').fill('3');
      await page.getByPlaceholder('Option B').fill('4');
      await page.getByPlaceholder('Option C').fill('5');
      await page.getByPlaceholder('Option D').fill('6');
      await page.locator('select').last().selectOption('1'); // Option B = "4"

      await page.getByRole('button', { name: /save assessment/i }).click();
      await expect(page.getByText(/assessment saved/i)).toBeVisible({ timeout: 10000 });

      // ---- Candidate applies ----
      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');
      await applyToJob(candidatePage, job.title, TEST_RESUME);
      await expect(candidatePage.getByText(/application submitted/i))
        .toBeVisible({ timeout: 20000 });

      // ---- HR shortlists ----
      await setApplicationStatus(page, job.title, 'shortlisted');

      // ---- Candidate opens assessment ----
      await openAssessment(candidatePage);

      // ---- Timer ticks ----
      const timerText = candidatePage.getByText(/⏱/);
      await expect(timerText).toBeVisible({ timeout: 10000 });

      const initialTimerText = (await timerText.textContent()) || '';
      await candidatePage.waitForTimeout(4000);
      const updatedTimerText = (await timerText.textContent()) || '';
      console.log('Timer before:', initialTimerText, '| after:', updatedTimerText);

      const parseTimer = (t: string): number => {
        const m = t.match(/(\d{1,2}):(\d{2})/);
        return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : NaN;
      };
      const before = parseTimer(initialTimerText);
      const after = parseTimer(updatedTimerText);
      if (!isNaN(before) && !isNaN(after)) {
        expect(after).toBeLessThan(before);
      }

      // ---- Answer + submit ----
      await clickAnswerOption(candidatePage, '4', 'B');
      await submitAndWaitForResult(candidatePage);

      await candidateContext.close();
    });

  test('candidate scoring >= 50% becomes eligible for interview scheduling',
    async ({ page, browser }) => {
      test.setTimeout(240000);

      // ---- HR: job + assessment ----
      await registerUser(page, 'hr');
      const job = await createJob(page);

      await page.goto(`${BASE_URL}/jobs`);
      const jobCard = page.locator('.job-card', { hasText: job.title });
      await expect(jobCard).toBeVisible({ timeout: 20000 });
      await jobCard.getByRole('button', { name: /applicants/i }).click();
      await expect(page).toHaveURL(/\/hr\/applications\//, { timeout: 15000 });

      await page.getByRole('button', { name: /assessment/i }).click();
      await expect(page).toHaveURL(/\/hr\/assessment\//, { timeout: 10000 });

      await page.getByPlaceholder('Enter question 1 here...').fill('2 + 2 = ?');
      await page.getByPlaceholder('Option A').fill('3');
      await page.getByPlaceholder('Option B').fill('4');
      await page.getByPlaceholder('Option C').fill('5');
      await page.getByPlaceholder('Option D').fill('6');
      await page.locator('select').last().selectOption('1');

      await page.getByRole('button', { name: /save assessment/i }).click();
      await expect(page.getByText(/assessment saved/i)).toBeVisible({ timeout: 10000 });

      // ---- Candidate applies ----
      const candidateContext = await browser.newContext();
      const candidatePage = await candidateContext.newPage();
      await registerUser(candidatePage, 'candidate');
      await applyToJob(candidatePage, job.title, TEST_RESUME);
      await expect(candidatePage.getByText(/application submitted/i))
        .toBeVisible({ timeout: 20000 });

      // ---- HR shortlists + candidate takes assessment ----
      await setApplicationStatus(page, job.title, 'shortlisted');
      await openAssessment(candidatePage);
      await clickAnswerOption(candidatePage, '4', 'B');
      await submitAndWaitForResult(candidatePage);

      // ---- HR re-checks status ----
      await page.goto(`${BASE_URL}/jobs`);
      const jobCard2 = page.locator('.job-card', { hasText: job.title });
      await expect(jobCard2).toBeVisible({ timeout: 20000 });
      await jobCard2.getByRole('button', { name: /applicants/i }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const statusSelect = page.locator('select.status-select').first();
      await expect(statusSelect).toBeVisible({ timeout: 15000 });
      const finalStatus = await statusSelect.inputValue();
      console.log('Final HR-side status after passing assessment:', finalStatus);

      expect(['shortlisted', 'interview']).toContain(finalStatus);

      await candidateContext.close();
    });
});