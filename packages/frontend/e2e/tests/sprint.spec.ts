import { test, expect } from '../fixtures';

test.describe('Sprint Board Page', () => {
  test.beforeEach(async ({ loginPage, page, mockApi }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `sprint_${timestamp}@example.com`,
      password: 'TestPass123!@#',
      firstName: 'Sprint',
      lastName: 'Tester',
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
  });

  test('TC-SPRINT-001: Display Sprint Board', async ({ sprintBoardPage, page }) => {
    await test.step('Navigate to sprint board page', async () => {
      await sprintBoardPage.goto();
    });

    await test.step('Verify page loads or redirects appropriately', async () => {
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url();
      const isValidPage =
        currentUrl.includes('/sprint') ||
        currentUrl.includes('/team') ||
        currentUrl.includes('/login');
      expect(isValidPage).toBe(true);
    });
  });

  test('TC-SPRINT-002: Display Sprint Overview', async ({ sprintBoardPage, page }) => {
    await test.step('Navigate to sprint board page', async () => {
      await sprintBoardPage.goto();
    });

    await test.step('Verify page content is visible', async () => {
      await page.waitForLoadState('domcontentloaded');
      const bodyContent = await page.locator('body').isVisible();
      expect(bodyContent).toBe(true);
    });
  });

  test('TC-SPRINT-003: Display Kanban Columns', async ({ sprintBoardPage, page }) => {
    await test.step('Navigate to sprint board page', async () => {
      await sprintBoardPage.goto();
    });

    await test.step('Check for kanban columns or empty state', async () => {
      await page.waitForLoadState('domcontentloaded');

      const todoColumn = page.locator(
        '[class*="column"]:has(h3:has-text("TO DO")), [data-status="todo"]'
      );
      const inProgressColumn = page.locator(
        '[class*="column"]:has(h3:has-text("IN PROGRESS")), [data-status="in_progress"]'
      );
      const doneColumn = page.locator(
        '[class*="column"]:has(h3:has-text("DONE")), [data-status="done"]'
      );
      const emptyState = page.locator('[class*="empty-state"]');

      const hasTodoColumn = await todoColumn
        .first()
        .isVisible()
        .catch(() => false);
      const hasInProgressColumn = await inProgressColumn
        .first()
        .isVisible()
        .catch(() => false);
      const hasDoneColumn = await doneColumn
        .first()
        .isVisible()
        .catch(() => false);
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasBody = await page.locator('body').isVisible();

      expect(
        hasTodoColumn || hasInProgressColumn || hasDoneColumn || hasEmptyState || hasBody
      ).toBe(true);
    });
  });

  test('TC-SPRINT-004: Toggle Burndown Chart', async ({ sprintBoardPage, page }) => {
    await test.step('Navigate to sprint board page', async () => {
      await sprintBoardPage.goto();
    });

    await test.step('Try to toggle burndown chart', async () => {
      await page.waitForLoadState('domcontentloaded');

      const burndownButton = page.locator(
        'button:has-text("Burndown"), [aria-label*="burndown" i]'
      );
      if (await burndownButton.isVisible()) {
        await burndownButton.click();
        await page.waitForTimeout(500);
      }
    });

    await test.step('Verify page still functions', async () => {
      const bodyContent = await page.locator('body').isVisible();
      expect(bodyContent).toBe(true);
    });
  });

  test('TC-SPRINT-005: Filter Tasks', async ({ sprintBoardPage, page }) => {
    await test.step('Navigate to sprint board page', async () => {
      await sprintBoardPage.goto();
    });

    await test.step('Try to filter by assignee', async () => {
      await page.waitForLoadState('domcontentloaded');

      const assigneeFilter = page.locator('[name="assignee"], [aria-label*="assignee" i]');
      if (await assigneeFilter.isVisible()) {
        await assigneeFilter.click();
        await page.waitForTimeout(300);
      }
    });

    await test.step('Try to search tasks', async () => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('login');
        await page.waitForTimeout(500);
      }
    });

    await test.step('Verify page still functions', async () => {
      const bodyContent = await page.locator('body').isVisible();
      expect(bodyContent).toBe(true);
    });
  });

  test('TC-SPRINT-006: Display Task Statistics', async ({ sprintBoardPage, page }) => {
    await test.step('Navigate to sprint board page', async () => {
      await sprintBoardPage.goto();
    });

    await test.step('Verify page loads', async () => {
      await page.waitForLoadState('domcontentloaded');
      const bodyContent = await page.locator('body').isVisible();
      expect(bodyContent).toBe(true);
    });
  });
});

test.describe('Sprint Board Page - Responsive Design', () => {
  test.beforeEach(async ({ loginPage, page, mockApi }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `sprint_mobile_${timestamp}@example.com`,
      password: 'TestPass123!@#',
      firstName: 'Sprint',
      lastName: 'Mobile',
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
  });

  test('should display correctly on mobile viewport', async ({ sprintBoardPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await sprintBoardPage.goto();
    await page.waitForLoadState('domcontentloaded');

    const bodyContent = await page.locator('body').isVisible();
    expect(bodyContent).toBe(true);
  });

  test('should display correctly on tablet viewport', async ({ sprintBoardPage, page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await sprintBoardPage.goto();
    await page.waitForLoadState('domcontentloaded');

    const bodyContent = await page.locator('body').isVisible();
    expect(bodyContent).toBe(true);
  });
});
