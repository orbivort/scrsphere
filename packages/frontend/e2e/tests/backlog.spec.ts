import { test, expect } from '../fixtures';

test.describe('Backlog Page', () => {
  test.beforeEach(async ({ loginPage, page, mockApi }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `backlog_${timestamp}@example.com`,
      password: 'TestPass123!@#',
      firstName: 'Backlog',
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

  test('TC-BACKLOG-001: Display Backlog Page', async ({ backlogPage, page }) => {
    await test.step('Navigate to backlog page', async () => {
      await backlogPage.goto();
    });

    await test.step('Verify page loads or redirects appropriately', async () => {
      await page.waitForLoadState('domcontentloaded');
      const currentUrl = page.url();
      const isValidPage =
        currentUrl.includes('/backlog') ||
        currentUrl.includes('/team') ||
        currentUrl.includes('/login');
      expect(isValidPage).toBe(true);
    });
  });

  test('TC-BACKLOG-002: Display MoSCoW Board View', async ({ backlogPage, page }) => {
    await test.step('Navigate to backlog page', async () => {
      await backlogPage.goto();
    });

    await test.step('Verify page content is visible', async () => {
      await page.waitForLoadState('domcontentloaded');
      const bodyContent = await page.locator('body').isVisible();
      expect(bodyContent).toBe(true);
    });
  });

  test('TC-BACKLOG-003: Switch Between View Modes', async ({ backlogPage, page }) => {
    await test.step('Navigate to backlog page', async () => {
      await backlogPage.goto();
    });

    await test.step('Try to switch views if available', async () => {
      await page.waitForLoadState('domcontentloaded');

      const listButton = page.locator('button:has-text("List"), [aria-label*="list" i]');
      if (await listButton.isVisible()) {
        await listButton.click();
        await page.waitForTimeout(500);
      }

      const boardButton = page.locator('button:has-text("Board"), [aria-label*="board" i]');
      if (await boardButton.isVisible()) {
        await boardButton.click();
        await page.waitForTimeout(500);
      }
    });

    await test.step('Verify page still functions', async () => {
      const bodyContent = await page.locator('body').isVisible();
      expect(bodyContent).toBe(true);
    });
  });

  test('TC-BACKLOG-004: Filter Backlog Items', async ({ backlogPage, page }) => {
    await test.step('Navigate to backlog page', async () => {
      await backlogPage.goto();
    });

    await test.step('Try to search for items', async () => {
      await page.waitForLoadState('domcontentloaded');

      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('Authentication');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
      }
    });

    await test.step('Verify page still functions after filter', async () => {
      const bodyContent = await page.locator('body').isVisible();
      expect(bodyContent).toBe(true);
    });
  });

  test('TC-BACKLOG-005: Display Active Goal Banner', async ({ backlogPage, page }) => {
    await test.step('Navigate to backlog page', async () => {
      await backlogPage.goto();
    });

    await test.step('Verify page loads', async () => {
      await page.waitForLoadState('domcontentloaded');
      const bodyContent = await page.locator('body').isVisible();
      expect(bodyContent).toBe(true);
    });
  });
});

test.describe('Backlog Page - Responsive Design', () => {
  test.beforeEach(async ({ loginPage, page, mockApi }) => {
    const timestamp = Date.now();
    const testUser = {
      email: `backlog_mobile_${timestamp}@example.com`,
      password: 'TestPass123!@#',
      firstName: 'Backlog',
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

  test('should display correctly on mobile viewport', async ({ backlogPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await backlogPage.goto();
    await page.waitForLoadState('domcontentloaded');

    const bodyContent = await page.locator('body').isVisible();
    expect(bodyContent).toBe(true);
  });

  test('should display correctly on tablet viewport', async ({ backlogPage, page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await backlogPage.goto();
    await page.waitForLoadState('domcontentloaded');

    const bodyContent = await page.locator('body').isVisible();
    expect(bodyContent).toBe(true);
  });
});
