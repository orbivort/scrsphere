import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class BacklogPage extends BasePage {
  readonly pageHeader: Locator;
  readonly newItemButton: Locator;
  readonly bulkImportButton: Locator;
  readonly viewModeToggle: Locator;
  readonly boardView: Locator;
  readonly listView: Locator;
  readonly filterBar: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly mustHaveColumn: Locator;
  readonly shouldHaveColumn: Locator;
  readonly couldHaveColumn: Locator;
  readonly wontHaveColumn: Locator;
  readonly createModal: Locator;
  readonly editModal: Locator;
  readonly detailModal: Locator;
  readonly deleteModal: Locator;
  readonly validationModal: Locator;
  readonly emptyState: Locator;
  readonly activeGoalBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page
      .locator('[data-testid="product-backlog"], [class*="product-backlog"]')
      .first();
    this.newItemButton = page
      .locator('button:has-text("New Item"), button:has-text("Add")')
      .first();
    this.bulkImportButton = page.locator('button:has-text("Bulk"), button:has-text("Import")');
    this.viewModeToggle = page.locator('[class*="view-toggle"], button[aria-label*="view"]');
    this.boardView = page.locator('[class*="board-view"]');
    this.listView = page.locator('[class*="list-view"]');
    this.filterBar = page.locator('[class*="filter-bar"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    this.statusFilter = page.locator('[class*="status-filter"], select[name*="status"]');
    this.mustHaveColumn = page.locator('[class*="must-have"], [data-priority="must"]').first();
    this.shouldHaveColumn = page
      .locator('[class*="should-have"], [data-priority="should"]')
      .first();
    this.couldHaveColumn = page.locator('[class*="could-have"], [data-priority="could"]').first();
    this.wontHaveColumn = page.locator('[class*="wont-have"], [data-priority="wont"]').first();
    this.createModal = page.locator(
      '[class*="create-modal"], [class*="modal"]:has(h2:has-text("Create"))'
    );
    this.editModal = page.locator(
      '[class*="edit-modal"], [class*="modal"]:has(h2:has-text("Edit"))'
    );
    this.detailModal = page.locator(
      '[class*="detail-modal"], [class*="modal"]:has(h2:has-text("Details"))'
    );
    this.deleteModal = page.locator(
      '[class*="delete-modal"], [class*="modal"]:has(h2:has-text("Delete"))'
    );
    this.validationModal = page.locator(
      '[class*="validation-modal"], [class*="modal"]:has(h2:has-text("Validation"))'
    );
    this.emptyState = page.locator('[class*="empty-state"]').first();
    this.activeGoalBanner = page.locator('[class*="active-goal"], [class*="goal-banner"]');
  }

  async goto(): Promise<void> {
    await this.navigate('/backlog');
    await this.waitForPageLoad();
  }

  async clickNewItem(): Promise<void> {
    await this.newItemButton.click();
  }

  async clickBulkImport(): Promise<void> {
    await this.bulkImportButton.click();
  }

  async switchToBoardView(): Promise<void> {
    const boardButton = this.page.locator('button:has-text("Board"), [aria-label*="board" i]');
    if (await boardButton.isVisible()) {
      await boardButton.click();
    }
  }

  async switchToListView(): Promise<void> {
    const listButton = this.page.locator('button:has-text("List"), [aria-label*="list" i]');
    if (await listButton.isVisible()) {
      await listButton.click();
    }
  }

  async searchItems(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async getBacklogItems(): Promise<Locator[]> {
    const items = this.page.locator('[class*="backlog-item"], [class*="product-item"]');
    return await items.all();
  }

  async getItemByTitle(title: string): Promise<Locator> {
    return this.page
      .locator(
        `[class*="backlog-item"]:has-text("${title}"), [class*="product-item"]:has-text("${title}")`
      )
      .first();
  }

  async clickItem(title: string): Promise<void> {
    const item = await this.getItemByTitle(title);
    await item.click();
  }

  async fillCreateForm(data: {
    title: string;
    description?: string;
    estimate?: number;
    priority?: string;
    acceptanceCriteria?: string;
  }): Promise<void> {
    await this.page.locator('#title, [name="title"]').fill(data.title);

    if (data.description) {
      await this.page.locator('#description, [name="description"]').fill(data.description);
    }

    if (data.estimate) {
      await this.page
        .locator('#estimate, [name="estimate"], [name="storyPoints"]')
        .fill(data.estimate.toString());
    }

    if (data.priority) {
      await this.page
        .locator(`[name="priority"], [name="moscowPriority"]`)
        .selectOption(data.priority);
    }

    if (data.acceptanceCriteria) {
      await this.page
        .locator('#acceptanceCriteria, [name="acceptanceCriteria"]')
        .fill(data.acceptanceCriteria);
    }
  }

  async submitCreateForm(): Promise<void> {
    await this.page
      .locator('button[type="submit"]:has-text("Create"), button:has-text("Add")')
      .click();
  }

  async isBoardViewVisible(): Promise<boolean> {
    return this.isElementVisible(this.boardView);
  }

  async isListViewVisible(): Promise<boolean> {
    return this.isElementVisible(this.listView);
  }

  async getMustHaveItems(): Promise<Locator[]> {
    return this.mustHaveColumn.locator('[class*="item"]').all();
  }

  async getShouldHaveItems(): Promise<Locator[]> {
    return this.shouldHaveColumn.locator('[class*="item"]').all();
  }

  async getCouldHaveItems(): Promise<Locator[]> {
    return this.couldHaveColumn.locator('[class*="item"]').all();
  }

  async getWontHaveItems(): Promise<Locator[]> {
    return this.wontHaveColumn.locator('[class*="item"]').all();
  }

  async hasActiveGoal(): Promise<boolean> {
    return this.isElementVisible(this.activeGoalBanner);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }
}
