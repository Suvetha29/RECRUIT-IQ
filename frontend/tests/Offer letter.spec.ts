import { test, expect } from '@playwright/test';
import path from 'path';
import { BASE_URL, registerUser, createJob, applyToJob } from './helpers';

const TEST_RESUME = path.join(__dirname, 'fixtures', 'test-resume.pdf');

/**
 * Real flow (verified against HRApplications.jsx `generateOfferLetter`):
 * Clicking "📄 Offer" (visible only when status === 'hired') calls
 * POST /api/evaluation/offer-letter/:id with responseType 'blob', then
 * triggers a browser file download via a synthetic <a> click.
 *
 * There is no candidate-facing view of the offer letter — hiring is a
 * recruiter-only, download-only action.
 */
test.describe('Offer Letter Generation', () => {

  /**
   * Seeds a candidate in an ISOLATED browser context so HR's JWT is never
   * overwritten. Returns the context so callers can close it.
   */
  async function seedCandidate(
    browser: import('@playwright/test').Browser,
    jobTitle: string
  ) {
    const candidateContext = await browser.newContext();
    const candidatePage = await candidateContext.newPage();
    await registerUser(candidatePage, 'candidate');
    await applyToJob(candidatePage, jobTitle, TEST_RESUME);
    await expect(candidatePage.getByText(/application submitted/i))
      .toBeVisible({ timeout: 20000 });

    // Dismiss ATS modal
    const viewApps = candidatePage.getByRole('button', { name: /view my applications/i });
    if (await viewApps.isVisible().catch(() => false)) {
      await viewApps.click();
      await candidatePage.waitForTimeout(500);
    }

    await candidatePage.close();
    return candidateContext;
  }

  /**
   * HR navigates to the applicants table for the given job.
   */
  async function openApplicantsTable(
    hrPage: import('@playwright/test').Page,
    jobTitle: string
  ) {
    await hrPage.goto(`${BASE_URL}/jobs`);
    const jobCard = hrPage.locator('.job-card', { hasText: jobTitle });
    await expect(jobCard).toBeVisible({ timeout: 20000 });

    const applicantsBtn = jobCard.getByRole('button', { name: /applicants/i });
    await expect(applicantsBtn).toBeVisible({ timeout: 15000 });
    await applicantsBtn.click();

    await expect(hrPage).toHaveURL(/\/hr\/applications\//, { timeout: 15000 });
    await expect(hrPage.locator('select.status-select').first())
      .toBeVisible({ timeout: 15000 });
  }

  /**
   * HR sets the applicant status, waiting for the PATCH to complete.
   */
  async function setStatus(
    hrPage: import('@playwright/test').Page,
    status: 'pending' | 'under_review' | 'shortlisted' | 'interview' | 'hired' | 'rejected'
  ) {
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
  }

  // -------------------------------------------------------------------------
  // Test 1: Offer button appears only after status = Hired
  // -------------------------------------------------------------------------
  test('the "Offer" button only appears once an applicant is marked Hired',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      await registerUser(page, 'hr');
      const job = await createJob(page);
      const candidateContext = await seedCandidate(browser, job.title);

      await openApplicantsTable(page, job.title);

      // Before hired: no Offer button
      await expect(page.getByRole('button', { name: /offer/i })).toHaveCount(0);

      // Mark as hired
      await setStatus(page, 'hired');
      await page.waitForTimeout(800);

      // After hired: Offer button visible
      await expect(page.getByRole('button', { name: /offer/i }))
        .toBeVisible({ timeout: 15000 });

      await candidateContext.close();
    });

  // -------------------------------------------------------------------------
  // Test 2: Clicking Offer downloads a PDF
  // -------------------------------------------------------------------------
  test('clicking "Offer" downloads a PDF named Offer_Letter_<candidate>.pdf',
    async ({ page, browser }) => {
      test.setTimeout(180000); // PDF generation + email can be slow

      await registerUser(page, 'hr');
      const job = await createJob(page);
      const candidateContext = await seedCandidate(browser, job.title);

      await openApplicantsTable(page, job.title);
      await setStatus(page, 'hired');
      await page.waitForTimeout(800);

      const offerBtn = page.getByRole('button', { name: /offer/i }).first();
      await expect(offerBtn).toBeVisible({ timeout: 15000 });

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60000 }),
        offerBtn.click(),
      ]);

      const filename = download.suggestedFilename();
      console.log('Downloaded:', filename);
      expect(filename).toMatch(/^Offer_Letter_.*\.pdf$/i);

      await candidateContext.close();
    });
});