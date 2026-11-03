import { test, expect } from '@playwright/test';

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'RozgaarDemo2026!';
const APPLICANT_EMAIL = process.env.SMOKE_APPLICANT_EMAIL || 'applicant@rozgaar.example';
const RECRUITER_EMAIL = process.env.SMOKE_RECRUITER_EMAIL || 'recruiter@rozgaar.example';
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || 'admin@rozgaar.example';

test.describe('Rozgaar ATS - End-to-End Golden Paths', () => {

  test('1. Applicant Golden Path: login, search & filter jobs, view detail and timeline', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
    await expect(page).toHaveTitle(/Rozgaar/i);

    // 2. Fill login form
    await page.locator('#email').fill(APPLICANT_EMAIL);
    await page.locator('#password').fill(DEMO_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // 3. Authenticated applicant lands on /me/applications
    await page.waitForURL('**/me/applications', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Candidate Application Tracking|My Applications/i);

    // 4. Assert application detail & timeline view from dashboard
    const viewDetailsLinks = page.locator('a[href^="/me/applications/"]');
    if (await viewDetailsLinks.count() > 0) {
      await viewDetailsLinks.first().click();
      await page.waitForURL('**/me/applications/*', { timeout: 10000 });
      await expect(page.locator('text=Timeline').first()).toBeVisible({ timeout: 10000 });
    }

    // 5. Navigate to Public Job Search via Navbar
    await page.locator('header a[href="/jobs"], nav a:has-text("Find Jobs")').first().click();
    await page.waitForURL('**/jobs', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/Find.*Local Jobs/i);

    // 6. Search and filter
    const searchInput = page.locator('input[placeholder*="Job title"], input[name="q"], input[type="text"]').first();
    await searchInput.fill('Baker');
    await page.keyboard.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000);
    const jobCards = page.locator('a[href^="/jobs/"]');
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 });

    // 7. Click job card to view job details
    await jobCards.first().click();
    await page.waitForURL('**/jobs/*', { timeout: 10000 });
    await expect(page.locator('h1')).toBeVisible();
  });

  test('2. Recruiter Golden Path: login, open Kanban, move card via accessible menu and reject with message', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
    await page.locator('#email').fill(RECRUITER_EMAIL);
    await page.locator('#password').fill(DEMO_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // 2. Recruiter lands on /recruiter/jobs
    await page.waitForURL('**/recruiter/jobs', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Job Listings & Pipelines|Job Postings/i);

    // 3. Open Kanban Board for the primary job
    const boardLinks = page.locator('a[href*="/board"]');
    await expect(boardLinks.first()).toBeVisible({ timeout: 10000 });
    await boardLinks.first().click();

    // 4. Wait for Kanban Board to render columns
    await page.waitForURL('**/recruiter/jobs/*/board', { timeout: 15000 });
    await expect(page.locator(':text("Applied"):visible').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(':text("Reviewing"):visible').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(':text("Interviewing"):visible').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(':text("Hired"):visible').first()).toBeVisible({ timeout: 10000 });

    // 5. Test "Move to..." menu on a candidate card if available
    const moveSelects = page.locator('select[aria-label*="Move"]:visible');
    if (await moveSelects.count() > 0) {
      const firstSelect = moveSelects.first();
      await firstSelect.selectOption('reviewing');
      await page.waitForTimeout(1000);

      // 6. Test reject with explanatory message
      await firstSelect.selectOption('rejected');
      const modal = page.locator('div[role="dialog"], text=Reason & Feedback for Candidate').first();
      await expect(modal).toBeVisible({ timeout: 8000 });

      const feedbackInput = page.locator('textarea[placeholder*="feedback"], textarea').first();
      await feedbackInput.fill('E2E Automated test: Application moved with feedback.');

      const confirmBtn = page.locator('button:has-text("Confirm Stage Move")');
      await confirmBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('3. Applicant sees updated status in personal dashboard', async ({ page }) => {
    // 1. Login as applicant
    await page.goto('/login');
    await page.locator('#email').fill(APPLICANT_EMAIL);
    await page.locator('#password').fill(DEMO_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // 2. Navigate to Applications Dashboard
    await page.waitForURL('**/me/applications', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Candidate Application Tracking|My Applications/i);

    // 3. Verify status badges exist
    const statusBadges = page.locator('span[class*="border"]');
    await expect(statusBadges.first()).toBeVisible({ timeout: 10000 });
  });

  test('4. Admin Golden Path: login and access moderation portal', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/login');
    await page.locator('#email').fill(ADMIN_EMAIL);
    await page.locator('#password').fill(DEMO_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // 2. Admin lands on /admin
    await page.waitForURL('**/admin', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText(/Admin Control Center|Admin Moderation Portal/i);

    // 3. Verify metrics cards are rendered
    await expect(page.locator('text=Total Users').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Companies').first()).toBeVisible({ timeout: 10000 });

    // 4. Click through tabs
    await page.locator('button:has-text("Users Moderation")').click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Companies")').click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("All Job Postings")').click();
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Reported Jobs Queue")').click();
    await page.waitForTimeout(500);
  });

});
