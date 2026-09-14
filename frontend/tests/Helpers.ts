import { Page, expect } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const TEST_PASSWORD = 'Test@1234';

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;
}

export interface RegisteredUser {
  email: string;
  password: string;
  firstName: string;
}

/**
 * Registers a user. Verified against Register.js:
 *  - real name attributes: full_name, email, password
 *  - role toggle button ("🎓 Candidate" / "💼 HR / Recruiter")
 *  - submit button text is exactly "SIGN UP"
 */
export async function registerUser(
  page: Page,
  role: 'hr' | 'candidate',
  firstName = `${role}Tester`
): Promise<RegisteredUser> {
  const email = uniqueEmail(role);
  const password = TEST_PASSWORD;

  await page.goto(`${BASE_URL}/register`);
  await page.locator('input[name="full_name"]').fill(firstName);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  if (role === 'hr') {
    await page.getByRole('button', { name: /HR \/ Recruiter/i }).click();
  }

  await page.getByRole('button', { name: /^sign up$/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });

  return { email, password, firstName };
}

/** Login.js: real name attributes, submit button text "LOG IN" */
export async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /^log in$/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
}

export interface JobDetails {
  title: string;
  company: string;
  location: string;
  experience: string;
}

/**
 * Creates a job posting at /create-job. All required fields must be filled
 * or the native HTML5 `required` attribute blocks submission silently.
 */
export async function createJob(
  page: Page,
  overrides: Partial<JobDetails> = {}
): Promise<JobDetails> {
  const details: JobDetails = {
    title: overrides.title ?? `QA Test Role ${Date.now()}`,
    company: overrides.company ?? 'QA Test Co',
    location: overrides.location ?? 'Remote',
    experience: overrides.experience ?? '2-4 years',
  };

  await page.goto(`${BASE_URL}/create-job`);
  await page.locator('input[name="title"]').fill(details.title);
  await page.locator('input[name="company"]').fill(details.company);
  await page.locator('input[name="location"]').fill(details.location);
  await page.locator('input[name="experience_required"]').fill(details.experience);
  await page.locator('textarea[name="description"]').fill('Automated QA test job description.');
  await page.locator('textarea[name="requirements"]').fill('QA test requirements.');
  await page.locator('textarea[name="responsibilities"]').fill('QA test responsibilities.');

  page.once('dialog', (dialog) => dialog.accept());

  await page.getByRole('button', { name: /post job/i }).click();
  await expect(page).toHaveURL(/\/jobs$/, { timeout: 15000 });

  return details;
}

/**
 * Applies to a job from the JobList grid. Resume must be a PDF.
 */
export async function applyToJob(page: Page, jobTitle: string, resumePath: string) {
  await page.goto(`${BASE_URL}/jobs`);
  const card = page.locator('.job-card', { hasText: jobTitle });
  await card.getByRole('button', { name: /apply now/i }).click();

  await page.locator('#resume-input').setInputFiles(resumePath);
  await page.getByRole('button', { name: /^submit application$/i }).click();
}

export function logResult(label: string, data: unknown) {
  console.log(`\n📋 MANUAL CHECK — ${label}:`, JSON.stringify(data, null, 2), '\n');
}

/**
 * HRKanban.jsx uses native HTML5 drag-and-drop. Playwright's built-in
 * locator.dragTo() fires mouse events only and does NOT reliably trigger
 * native DragEvent handlers, so we dispatch real DragEvent objects directly.
 *
 * Robust matching:
 *  - Column label matched across <span>, <div>, <h1-h4>, <p>, <label>
 *  - Case-insensitive exact-trim match, then word-boundary regex fallback
 *  - Column root found by climbing to the ancestor containing "Drop here"
 */
export async function dragKanbanCard(
  page: Page,
  candidateName: string,
  targetColumnLabel: string
) {
  await page.evaluate(
    ({ candidateName, targetColumnLabel }) => {
      const draggables = Array.from(
        document.querySelectorAll('[draggable="true"]')
      ) as HTMLElement[];
      const source = draggables.find((el) =>
        el.textContent?.includes(candidateName)
      ) ?? null;

      if (!source) {
        throw new Error(`Kanban card for "${candidateName}" not found`);
      }

      const target = targetColumnLabel.trim().toLowerCase();

      const searchables = Array.from(
        document.querySelectorAll('span, div, h1, h2, h3, h4, p, label')
      ) as HTMLElement[];

      let labelEl: HTMLElement | null = null;

      // Strategy A: exact trimmed text match
      for (const el of searchables) {
        const text = (el.textContent ?? '').trim().toLowerCase();
        if (text === target) {
          if (!labelEl || el.children.length < labelEl.children.length) {
            labelEl = el;
          }
        }
      }

      // Strategy B: word-boundary regex on short text nodes
      if (!labelEl) {
        const re = new RegExp(
          `\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
          'i'
        );
        for (const el of searchables) {
          const text = (el.textContent ?? '').trim();
          if (text.length <= 40 && re.test(text)) {
            labelEl = el;
            break;
          }
        }
      }

      if (!labelEl) {
        throw new Error(
          `Kanban column "${targetColumnLabel}" label not found. ` +
          `Available text nodes: ${searchables
            .filter((e) => e.children.length === 0)
            .map((e) => (e.textContent ?? '').trim())
            .filter(Boolean)
            .slice(0, 30)
            .join(' | ')}`
        );
      }

      // Climb to column root (contains "Drop here")
      let columnRoot: HTMLElement = labelEl;
      let cursor: HTMLElement | null = labelEl.parentElement;
      let hops = 0;
      while (cursor && hops < 8) {
        const text = cursor.textContent ?? '';
        if (/drop here/i.test(text)) {
          columnRoot = cursor;
          cursor = cursor.parentElement;
          hops++;
          continue;
        }
        break;
      }

      if (columnRoot === labelEl) {
        columnRoot =
          (labelEl.parentElement?.parentElement as HTMLElement) ?? labelEl;
      }

      const dataTransfer = new DataTransfer();
      const fire = (el: HTMLElement, type: string) => {
        el.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
          })
        );
      };

      fire(source, 'dragstart');
      fire(columnRoot, 'dragenter');
      fire(columnRoot, 'dragover');
      fire(columnRoot, 'drop');
      fire(source, 'dragend');
    },
    { candidateName, targetColumnLabel }
  );

  await page.waitForTimeout(600);
}