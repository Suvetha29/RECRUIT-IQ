import { test, expect } from '@playwright/test';
import { BASE_URL, TEST_PASSWORD, uniqueEmail, registerUser, login, logResult } from './helpers';

test.describe('Authentication', () => {
  test('candidate registers (default role) and lands on dashboard', async ({ page }) => {
    const user = await registerUser(page, 'candidate');
    await expect(page).toHaveURL(/dashboard/);
    logResult('candidate registered', user.email);
  });

  test('HR/recruiter registers and lands on dashboard', async ({ page }) => {
    const user = await registerUser(page, 'hr');
    await expect(page).toHaveURL(/dashboard/);
    logResult('hr registered', user.email);
  });

  test('duplicate email is rejected with "Email already registered"', async ({ page }) => {
    // Confirmed exact backend message in backend/main.py:
    //   raise HTTPException(status_code=400, detail="Email already registered")
    const user = await registerUser(page, 'candidate');

    await page.goto(`${BASE_URL}/register`);
    await page.locator('input[name="full_name"]').fill('Duplicate User');
    await page.locator('input[name="email"]').fill(user.email);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^sign up$/i }).click();

    await expect(page.getByText(/email already registered/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/register/);
  });

  test('login with correct credentials redirects to dashboard', async ({ page }) => {
    const user = await registerUser(page, 'candidate');
    await page.context().clearCookies();
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login with wrong password shows "Invalid credentials"', async ({ page }) => {
    // Confirmed backend message: HTTPException(status_code=401, detail="Invalid credentials")
    const user = await registerUser(page, 'candidate');
    await page.context().clearCookies();

    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[name="email"]').fill(user.email);
    await page.locator('input[name="password"]').fill('WrongPassword999');
    await page.getByRole('button', { name: /^log in$/i }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  /**
   * ⚠️ APP GAP — not a test bug:
   * backend/main.py's UserRegister schema has NO password length/strength
   * validation (`password: str` with no constraints). There is currently no
   * way to trigger a "weak password" rejection. This test is written to
   * document that gap rather than pretend it doesn't exist — it currently
   * expects registration to SUCCEED with a trivial password, which is itself
   * a finding worth flagging to your team/report as a security gap.
   */
  test('[KNOWN GAP] registration currently accepts a trivial password', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.locator('input[name="full_name"]').fill('Weak Password User');
    await page.locator('input[name="email"]').fill(uniqueEmail('weakpw'));
    await page.locator('input[name="password"]').fill('1');
    await page.getByRole('button', { name: /^sign up$/i }).click();

    // Documenting current (undesirable) behavior — registration succeeds.
    // If/when password validation is added to the backend, update this
    // test to expect a rejection message instead.
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
  });

  /**
   * ⚠️ APP GAP — worth flagging:
   * Register.js uses `err.response?.data?.detail` as the error message.
   * FastAPI/pydantic returns `detail` as an ARRAY of objects for validation
   * errors (e.g. invalid email format via EmailStr), and React throws when
   * asked to render an array of objects as a child ("Objects are not valid
   * as a React child"). This test checks that the app does NOT crash to a
   * blank page on this input — if it currently does, that's the finding.
   */
  test('[KNOWN GAP] invalid email format may crash the form instead of showing an error', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.locator('input[name="full_name"]').fill('Invalid Email User');
    await page.locator('input[name="email"]').fill('not-an-email');
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^sign up$/i }).click();

    // The <input type="email"> gives native browser validation on submit in
    // most cases, which may prevent the request from firing at all. If it
    // does fire and the backend 422s, watch this assertion — a blank page
    // here means the React crash described above is happening.
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');
    logResult('page state after invalid email submit', bodyText?.slice(0, 300));
    expect(bodyText).not.toBe('');
  });

  /**
   * ⚠️ APP GAP: App.js has no route guards / role checks at all — every
   * route (including /create-job and /my-applications) is reachable by any
   * logged-in user regardless of role. This test documents that a candidate
   * CAN currently reach an HR-only page, which is a real authorization gap.
   */
  test('[KNOWN GAP] candidate can currently reach HR-only /create-job directly', async ({ page }) => {
    const candidate = await registerUser(page, 'candidate');
    await login(page, candidate.email, candidate.password);

    await page.goto(`${BASE_URL}/create-job`);
    // Documenting current behavior: no redirect happens.
    await expect(page).toHaveURL(/create-job/);
  });

  test('logged-out user visiting /dashboard is redirected to /login', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/dashboard`);
  await expect(page).toHaveURL(/login/, { timeout: 5000 });
});
});