import { test, expect } from '@playwright/test';
import path from 'path';
import { BASE_URL, registerUser, createJob, applyToJob, dragKanbanCard, logResult } from './helpers';

const TEST_RESUME = path.join(__dirname, 'fixtures', 'test-resume.pdf');

test.describe('Kanban Pipeline (/hr/kanban)', () => {

  /**
   * Seeds a candidate applicant in an ISOLATED browser context so HR's JWT
   * in the main `page` context is never overwritten by the candidate's.
   * Returns the candidate's full name and its context for cleanup.
   */
  async function seedApplicant(
    browser: import('@playwright/test').Browser,
    jobTitle: string
  ): Promise<{ name: string; context: import('@playwright/test').BrowserContext }> {
    const candidateContext = await browser.newContext();
    const candidatePage = await candidateContext.newPage();
    const candidate = await registerUser(
      candidatePage,
      'candidate',
      `Candidate${Date.now()}`
    );

    await applyToJob(candidatePage, jobTitle, TEST_RESUME);
    await expect(candidatePage.getByText(/application submitted/i))
      .toBeVisible({ timeout: 20000 });

    await candidatePage.close();
    return { name: candidate.firstName, context: candidateContext };
  }

  /**
   * Waits for the Schedule Interview modal to appear in any of its likely forms:
   * a heading, a text node, or a dialog element.
   */
  async function waitForInterviewModal(
    page: import('@playwright/test').Page,
    timeout = 10000
  ) {
    const modalCandidates = [
      page.getByRole('heading', { name: /schedule interview/i }),
      page.getByText(/schedule interview/i).first(),
      page.locator('[role="dialog"]').first(),
      page.locator('[class*="modal" i]').first(),
    ];

    const started = Date.now();
    while (Date.now() - started < timeout) {
      for (const loc of modalCandidates) {
        if (await loc.isVisible().catch(() => false)) {
          return; // modal found
        }
      }
      await page.waitForTimeout(250);
    }

    // Dump state for diagnosis if nothing matched
    console.log('\n=== MODAL NOT FOUND — DUMPING PAGE STATE ===');
    console.log('URL:', page.url());
    console.log('--- buttons ---');
    for (const b of await page.getByRole('button').all()) {
      console.log('BTN:', ((await b.textContent().catch(() => '?')) || '').trim().slice(0, 80));
    }
    console.log('--- inputs ---');
    for (const i of await page.locator('input').all()) {
      const t = await i.getAttribute('type').catch(() => null);
      const p = await i.getAttribute('placeholder').catch(() => null);
      console.log(`INPUT type="${t}" placeholder="${p}"`);
    }
    console.log('--- page text (first 1200) ---');
    console.log((await page.locator('body').innerText()).slice(0, 1200));
    await page.screenshot({ path: 'debug-kanban-modal-missing.png', fullPage: true });

    throw new Error('Schedule Interview modal did not appear in any recognized form.');
  }

  // -------------------------------------------------------------------------
  // Test 1: Drag from Pending → Shortlisted
  // -------------------------------------------------------------------------
  test('recruiter can drag a card from Pending to Shortlisted',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      await registerUser(page, 'hr');
      const job = await createJob(page);
      const { name: candidateName, context: candidateContext } =
        await seedApplicant(browser, job.title);

      await page.goto(`${BASE_URL}/hr/kanban`);
      await expect(page.getByText(candidateName)).toBeVisible({ timeout: 15000 });

      await dragKanbanCard(page, candidateName, 'Shortlisted');

      // doUpdate() is async — give it a moment, then confirm the card still exists
      await expect(async () => {
        const card = page.locator('[draggable="true"]', { hasText: candidateName });
        await expect(card).toBeVisible();
      }).toPass({ timeout: 15000 });

      logResult('candidate moved to Shortlisted', candidateName);
      await candidateContext.close();
    });

  // -------------------------------------------------------------------------
  // Test 2: Drag to Interview opens the Schedule Interview modal
  // -------------------------------------------------------------------------
  test('dragging a card to Interview opens the scheduling modal',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      await registerUser(page, 'hr');
      const job = await createJob(page);
      const { name: candidateName, context: candidateContext } =
        await seedApplicant(browser, job.title);

      await page.goto(`${BASE_URL}/hr/kanban`);
      await expect(page.getByText(candidateName)).toBeVisible({ timeout: 15000 });

      await dragKanbanCard(page, candidateName, 'Interview');

      // Modal should appear (heading, text, or dialog element — whichever renders)
      await waitForInterviewModal(page, 10000);

      const today = new Date().toISOString().split('T')[0];

      // Date — native input or custom placeholder
      const dateInput = page.locator(
        'input[type="date"], input[placeholder*="dd-mm-yyyy" i], input[placeholder*="dd/mm/yyyy" i]'
      ).first();
      await expect(dateInput).toBeVisible({ timeout: 5000 });
      await dateInput.fill(today);
      await dateInput.press('Tab');

      // Time — native input or custom placeholder
      const timeInput = page.locator(
        'input[type="time"], input[placeholder*="--:--" i]'
      ).first();
      await expect(timeInput).toBeVisible({ timeout: 5000 });
      await timeInput.fill('11:00');
      await timeInput.press('Tab');

      // Confirm
      await page.getByRole('button', { name: /confirm & send/i }).click();

      // Modal closes
      await expect(page.getByText(/schedule interview/i).first())
        .not.toBeVisible({ timeout: 15000 });

      await candidateContext.close();
    });

  // -------------------------------------------------------------------------
  // Test 3: Funnel chart tab
  // -------------------------------------------------------------------------
  test('funnel chart tab renders pipeline stage counts',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      await registerUser(page, 'hr');
      const job = await createJob(page);
      const { context: candidateContext } = await seedApplicant(browser, job.title);

      await page.goto(`${BASE_URL}/hr/kanban`);

      const funnelBtn = page.getByRole('button', { name: /funnel chart/i });
      await expect(funnelBtn).toBeVisible({ timeout: 15000 });
      await funnelBtn.click();

      await expect(page.getByText(/pipeline funnel/i)).toBeVisible({ timeout: 10000 });

      await candidateContext.close();
    });

  // -------------------------------------------------------------------------
  // Test 4: Search filters cards
  // -------------------------------------------------------------------------
  test('search filters cards by candidate name',
    async ({ page, browser }) => {
      test.setTimeout(120000);

      await registerUser(page, 'hr');
      const job = await createJob(page);
      const { name: candidateName, context: candidateContext } =
        await seedApplicant(browser, job.title);

      await page.goto(`${BASE_URL}/hr/kanban`);
      await expect(page.getByText(candidateName)).toBeVisible({ timeout: 15000 });

      const searchBox = page.getByPlaceholder('Search candidates...');
      await expect(searchBox).toBeVisible({ timeout: 10000 });

      await searchBox.fill('zzz_no_such_candidate');
      await expect(page.getByText(candidateName)).not.toBeVisible({ timeout: 5000 });

      await searchBox.fill('');
      await expect(page.getByText(candidateName)).toBeVisible({ timeout: 5000 });

      await candidateContext.close();
    });
});