import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class IncrementsPage extends BasePage {
  readonly pageHeader: Locator;
  readonly newIncrementButton: Locator;
  readonly incrementList: Locator;
  readonly incrementCard: Locator;
  readonly createModal: Locator;
  readonly detailModal: Locator;
  readonly emptyState: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('[class*="increment"], h1:has-text("Increment")').first();
    this.newIncrementButton = page
      .locator('button:has-text("New"), button:has-text("Create")')
      .first();
    this.incrementList = page.locator('[class*="increment-list"], [class*="increments-list"]');
    this.incrementCard = page.locator('[class*="increment-card"], [class*="increment-item"]');
    this.createModal = page.locator(
      '[class*="create-modal"], [class*="modal"]:has(h2:has-text("Create"))'
    );
    this.detailModal = page.locator(
      '[class*="detail-modal"], [class*="modal"]:has(h2:has-text("Detail"))'
    );
    this.emptyState = page.locator('[class*="empty-state"]').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async goto(): Promise<void> {
    await this.navigate('/increment');
    await this.waitForPageLoad();
  }

  async clickNewIncrement(): Promise<void> {
    await this.newIncrementButton.click();
  }

  async getIncrements(): Promise<Locator[]> {
    return this.incrementCard.all();
  }

  async getIncrementByTitle(title: string): Promise<Locator> {
    return this.incrementCard.filter({ hasText: title }).first();
  }

  async hasIncrements(): Promise<boolean> {
    return this.isElementVisible(this.incrementList);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }

  async searchIncrements(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }
}
