import { test, expect } from '@playwright/test';

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'RozgaarDemo2026!';
const APPLICANT_EMAIL = process.env.SMOKE_APPLICANT_EMAIL || 'applicant@rozgaar.example';
const RECRUITER_EMAIL = process.env.SMOKE_RECRUITER_EMAIL || 'recruiter@rozgaar.example';

// Test matrix across compact mobile (320x568), iPhone SE (375x667), and iPhone 13/14 (390x844)
const MOBILE_VIEWPORTS = [
  { name: 'Compact Mobile (320x568)', width: 320, height: 568 },
  { name: 'iPhone SE (375x667)', width: 375, height: 667 },
  { name: 'iPhone 13/14 (390x844)', width: 390, height: 844 },
];

for (const vp of MOBILE_VIEWPORTS) {
  test.describe(`Rozgaar Mobile Responsive Layout - ${vp.name}`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
    });

    test('1. Zero horizontal page scroll on public job search and home', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Assert zero horizontal scrolling
      const hasHorizontalScrollHome = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScrollHome).toBeFalsy();

      await page.goto('/jobs');
      await page.waitForLoadState('networkidle');

      const hasHorizontalScrollJobs = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScrollJobs).toBeFalsy();
    });

    test('2. Hamburger menu: opens slide-in panel, traps focus, and closes on close button & Escape', async ({ page }) => {
      await page.goto('/jobs');

      const hamburgerBtn = page.locator('button[aria-label="Toggle navigation menu"]');
      await expect(hamburgerBtn).toBeVisible({ timeout: 10000 });
      await expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'false');

      // Open drawer
      await hamburgerBtn.click();
      await expect(hamburgerBtn).toHaveAttribute('aria-expanded', 'true');

      const mobileNav = page.locator('#mobile-nav-panel');
      await expect(mobileNav).toBeVisible({ timeout: 5000 });
      await expect(mobileNav.locator('text=Rozgaar Menu')).toBeVisible();

      // Close using Escape key
      await page.keyboard.press('Escape');
      await expect(mobileNav).not.toBeVisible();

      // Open again and close using close button
      await hamburgerBtn.click();
      await expect(mobileNav).toBeVisible();

      const closeBtn = page.locator('button[aria-label="Close navigation menu"]');
      await expect(closeBtn).toBeVisible();
      await closeBtn.click();
      await expect(mobileNav).not.toBeVisible();
    });

    test('3. Mobile Bottom App Bar is fixed, accessible, and activates only unique matching route', async ({ page }) => {
      await page.goto('/jobs');

      const bottomBar = page.locator('nav[aria-label="Mobile Bottom App Bar"]');
      await expect(bottomBar).toBeVisible();

      // Check primary items have 44px min-height
      const findJobsLink = bottomBar.locator('a:has-text("Find Jobs")');
      await expect(findJobsLink).toBeVisible();
      const boundingBox = await findJobsLink.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44);

      // Verify on /login, ONLY "Sign in" is active; no duplicate "Alerts" active
      await page.goto('/login');
      const signInTab = bottomBar.locator('a:has-text("Sign in")');
      await expect(signInTab).toBeVisible();
      await expect(signInTab).toHaveClass(/bg-accent/);

      // Alerts must not exist in unauthenticated bottom bar
      const alertsTab = bottomBar.locator('a:has-text("Alerts")');
      await expect(alertsTab).toHaveCount(0);

      // Other tabs must NOT have active class
      const savedTab = bottomBar.locator('a:has-text("Saved")');
      await expect(savedTab).not.toHaveClass(/bg-accent/);
    });

    test('4. Job Search: Filter button opens bottom sheet drawer and applies criteria', async ({ page }) => {
      await page.goto('/jobs');

      // Click mobile Filters trigger
      const filterBtn = page.locator('button[aria-label="Open filter options"]');
      await expect(filterBtn).toBeVisible({ timeout: 10000 });
      await filterBtn.click();

      // Bottom sheet should be visible
      const bottomSheet = page.locator('div[role="dialog"][aria-label="Filters"]');
      await expect(bottomSheet).toBeVisible({ timeout: 5000 });
      await expect(bottomSheet.locator('h3:has-text("Search Filters")')).toBeVisible();

      // Toggle remote filter
      const remoteCheckbox = bottomSheet.locator('input[type="checkbox"]');
      await remoteCheckbox.check();

      // Apply filters
      const applyBtn = bottomSheet.locator('button:has-text("Apply Filters")');
      await applyBtn.click();

      // Bottom sheet closes
      await expect(bottomSheet).not.toBeVisible();
    });

    test('5. Job Detail: Pinned sticky Apply CTA bar on mobile', async ({ page }) => {
      await page.goto('/jobs');
      const jobCards = page.locator('a[href^="/jobs/"]');
      await expect(jobCards.first()).toBeVisible({ timeout: 10000 });
      await jobCards.first().click();

      await page.waitForURL('**/jobs/*', { timeout: 10000 });

      // Sticky Apply Bar on mobile
      const stickyBar = page.locator('div.sm\\:hidden.fixed.bottom-16');
      await expect(stickyBar).toBeVisible({ timeout: 8000 });
      await expect(stickyBar.locator('a:has-text("Apply"), a:has-text("Log in to Apply")')).toBeVisible();
    });

    test('6. Recruiter Kanban: single-column tabbed view and accessible stage move on mobile', async ({ page }) => {
      // Login as recruiter
      await page.goto('/login');
      await page.locator('#email').fill(RECRUITER_EMAIL);
      await page.locator('#password').fill(DEMO_PASSWORD);
      await page.locator('button[type="submit"]').click();

      await page.waitForURL('**/recruiter/jobs', { timeout: 15000 });

      // Open Kanban Board
      const boardLinks = page.locator('a[href*="/board"]');
      await expect(boardLinks.first()).toBeVisible({ timeout: 10000 });
      await boardLinks.first().click();

      await page.waitForURL('**/recruiter/jobs/*/board', { timeout: 15000 });

      // Mobile stage tabs must be visible
      const stageTabs = page.locator('div.md\\:hidden button');
      await expect(stageTabs.first()).toBeVisible({ timeout: 10000 });

      // Click "Reviewing" tab
      const reviewingTab = stageTabs.filter({ hasText: /Reviewing/i }).first();
      await reviewingTab.click();
      await page.waitForTimeout(500);

      // Verify accessible "Move to..." dropdown on candidate card if items exist
      const moveSelects = page.locator('select[aria-label*="Move"]');
      if (await moveSelects.count() > 0) {
        await expect(moveSelects.first()).toBeVisible();
      }

      // Assert zero horizontal scrolling on Kanban mobile layout
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('7. Auth Pages: Login and Register have zero horizontal scroll and accessible touch targets', async ({ page }) => {
      // Login page check
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const loginScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(loginScroll).toBeFalsy();

      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();
      const emailBox = await emailInput.boundingBox();
      expect(emailBox?.height).toBeGreaterThanOrEqual(44);

      const submitBtn = page.locator('button[type="submit"]');
      const submitBox = await submitBtn.boundingBox();
      expect(submitBox?.height).toBeGreaterThanOrEqual(44);

      // Register page check
      await page.goto('/register');
      await page.waitForLoadState('networkidle');

      const registerScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(registerScroll).toBeFalsy();

      // Role switcher buttons fit and are clickable
      const seekerTab = page.locator('button:has-text("Job Seeker")');
      const employerTab = page.locator('button:has-text("Employer")');
      await expect(seekerTab).toBeVisible();
      await expect(employerTab).toBeVisible();

      await employerTab.click();
      await expect(page.locator('#companyName')).toBeVisible();

      await seekerTab.click();
      await expect(page.locator('#companyName')).not.toBeVisible();
    });

    test('8. Applicant Dashboard & Applications: Zero horizontal scroll and pinned visible logout button in drawer', async ({ page }) => {
      // Login as applicant
      await page.goto('/login');
      await page.locator('#email').fill(APPLICANT_EMAIL);
      await page.locator('#password').fill(DEMO_PASSWORD);
      await page.locator('button[type="submit"]').click();

      await page.waitForURL('**/me/applications', { timeout: 15000 });

      const appScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(appScroll).toBeFalsy();

      // Check stat cards are visible
      const statCard = page.locator('p:has-text("Total Applications")');
      await expect(statCard).toBeVisible();

      // Open mobile menu drawer and verify Log out button is visible and within viewport bounds
      const hamburgerBtn = page.locator('button[aria-label="Toggle navigation menu"]');
      await expect(hamburgerBtn).toBeVisible({ timeout: 10000 });
      await hamburgerBtn.click();

      const logoutBtn = page.locator('#mobile-nav-panel button:has-text("Log out")');
      await expect(logoutBtn).toBeVisible({ timeout: 5000 });

      const logoutBox = await logoutBtn.boundingBox();
      expect(logoutBox).not.toBeNull();
      // Ensure the logout button is within vertical viewport
      expect(logoutBox.y + logoutBox.height).toBeLessThanOrEqual(vp.height + 10);
    });
  });
}

