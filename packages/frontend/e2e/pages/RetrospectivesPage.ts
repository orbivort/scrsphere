import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class RetrospectivesPage extends BasePage {
  readonly pageHeader: Locator;
  readonly newRetroButton: Locator;
  readonly retroList: Locator;
  readonly retroCard: Locator;
  readonly createModal: Locator;
  readonly actionItemModal: Locator;
  readonly emptyState: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page
      .locator('[class*="retrospective"], h1:has-text("Retrospective")')
      .first();
    this.newRetroButton = page.locator('button:has-text("New"), button:has-text("Create")').first();
    this.retroList = page.locator('[class*="retro-list"], [class*="retrospectives-list"]');
    this.retroCard = page.locator('[class*="retro-card"], [class*="retrospective-item"]');
    this.createModal = page.locator(
      '[class*="create-modal"], [class*="modal"]:has(h2:has-text("Create"))'
    );
    this.actionItemModal = page.locator(
      '[class*="action-item-modal"], [class*="modal"]:has(h2:has-text("Action"))'
    );
    this.emptyState = page.locator('[class*="empty-state"]').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async goto(): Promise<void> {
    await this.navigate('/retrospective');
    await this.waitForPageLoad();
  }

  async clickNewRetro(): Promise<void> {
    await this.newRetroButton.click();
  }

  async getRetros(): Promise<Locator[]> {
    return this.retroCard.all();
  }

  async getRetroByTitle(title: string): Promise<Locator> {
    return this.retroCard.filter({ hasText: title }).first();
  }

  async hasRetros(): Promise<boolean> {
    return this.isElementVisible(this.retroList);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }

  async searchRetros(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }
}
