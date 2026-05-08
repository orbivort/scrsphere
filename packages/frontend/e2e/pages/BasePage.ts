import type { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly cookieAcceptButton: Locator;
  readonly cookieRejectButton: Locator;
  readonly cookieBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cookieAcceptButton = page.locator('button:has-text("Accept All")');
    this.cookieRejectButton = page.locator('button:has-text("Reject All")');
    this.cookieBanner = page.locator('[aria-label="Cookie consent banner"]');
  }

  async navigate(path: string): Promise<void> {
    try {
      await this.page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch {
      // Retry with load wait strategy if domcontentloaded times out
      await this.page.goto(path, { waitUntil: 'load', timeout: 30000 });
    }
    await this.dismissCookieBanner();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.dismissCookieBanner();
  }

  async dismissCookieBanner(): Promise<void> {
    try {
      // Wait for cookie banner to appear with a short timeout
      const acceptButton = this.cookieAcceptButton;
      await acceptButton.waitFor({ state: 'visible', timeout: 2000 });

      // Click the accept button
      await acceptButton.click({ force: true });

      // Wait for banner to disappear
      await this.cookieBanner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    } catch {
      // Cookie banner not present or already dismissed
    }
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  async waitForElement(locator: Locator, timeout = 10000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async clickElement(locator: Locator): Promise<void> {
    await locator.click();
  }

  async fillInput(locator: Locator, value: string): Promise<void> {
    await locator.fill(value);
  }

  async getElementText(locator: Locator): Promise<string | null> {
    return locator.textContent();
  }

  async isElementVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  async waitForUrl(pattern: RegExp | string, timeout = 30000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async reload(): Promise<void> {
    try {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch {
      // Retry with load wait strategy if domcontentloaded times out
      await this.page.reload({ waitUntil: 'load', timeout: 30000 });
    }
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async waitForTimeout(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
