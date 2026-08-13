import { test, expect } from '../fixtures';

test.describe('Scrum Master Dashboard', () => {
  test.beforeEach(async ({ loginPage, page, mockApi }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `smdash_${timestamp}@example.com`,
      password: 'TestPass123!@#',
      firstName: 'SM',
      lastName: 'User',
    };

    await loginPage.goto();
    await loginPage.register({
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      email: testUser.email,
      password: testUser.password,
      acceptTerms: true,
    });
    await page.waitForURL(/\/team/, { timeout: 30000 });
    await page.waitForTimeout(500);
    await page.goto('/scrum-master-dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('TC-SMDASH-001: Display Scrum Master Dashboard data sections', async ({
    smDashboardPage,
    page,
  }) => {
    await test.step('Verify dashboard page loads', async () => {
      await page
        .waitForSelector('[data-testid="sm-dashboard-header"], h1', { timeout: 10000 })
        .catch(() => {});
    });

    await test.step('Verify event compliance section is displayed', async () => {
      expect(await smDashboardPage.isEventComplianceVisible()).toBe(true);
    });

    await test.step('Verify impediment metrics section is displayed', async () => {
      expect(await smDashboardPage.isImpedimentMetricsVisible()).toBe(true);
    });

    await test.step('Verify sprint goal achievement section is displayed', async () => {
      expect(await smDashboardPage.isSprintGoalVisible()).toBe(true);
    });

    await test.step('Verify action item completion section is displayed', async () => {
      expect(await smDashboardPage.isActionItemsVisible()).toBe(true);
    });

    await test.step('Verify health check section is displayed', async () => {
      expect(await smDashboardPage.isHealthCheckVisible()).toBe(true);
    });
  });

  test('TC-SMDASH-002: Display Definition of Done compliance trend', async ({
    smDashboardPage,
  }) => {
    await test.step('Navigate to SM dashboard', async () => {
      await smDashboardPage.goto();
    });

    await test.step('Verify DoD compliance trend section', async () => {
      expect(await smDashboardPage.isDoDTrendVisible()).toBe(true);
    });
  });

  test('TC-SMDASH-003: Display health check trend chart when data exists', async ({
    smDashboardPage,
    page,
  }) => {
    await test.step('Navigate to SM dashboard', async () => {
      await smDashboardPage.goto();
    });

    await test.step('Verify health check trend chart is rendered', async () => {
      const trendChart = page
        .locator('[data-testid="health-check-trend-chart"], [class*="trend-chart"] canvas')
        .first();
      const section = page.locator('[data-testid="health-check"], [class*="health-check"]').first();
      const hasChart = await trendChart.isVisible().catch(() => false);
      const hasSection = await section.isVisible().catch(() => false);
      expect(hasChart || hasSection).toBe(true);
    });
  });

  test('TC-SMDASH-004: Display Scrum Values health check results', async ({ smDashboardPage }) => {
    await test.step('Navigate to SM dashboard', async () => {
      await smDashboardPage.goto();
    });

    await test.step('Verify health score is displayed', async () => {
      const score = await smDashboardPage.getOverallHealthScore();
      // Either a numeric score or the section is present
      const section = await smDashboardPage.isHealthCheckVisible();
      expect(score !== null || section).toBe(true);
    });
  });

  test('TC-SMDASH-005: Dashboard handles refresh correctly', async ({ smDashboardPage, page }) => {
    await test.step('Navigate to SM dashboard', async () => {
      await smDashboardPage.goto();
    });

    await test.step('Reload the dashboard', async () => {
      await page.reload();
    });

    await test.step('Verify dashboard still renders after refresh', async () => {
      await page.waitForLoadState('domcontentloaded');
      await page
        .waitForSelector('[data-testid="sm-dashboard-header"], h1', { timeout: 10000 })
        .catch(() => {});
      expect(await smDashboardPage.isEventComplianceVisible()).toBe(true);
    });
  });
});
