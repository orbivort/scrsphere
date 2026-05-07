import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ImpedimentsPage extends BasePage {
  readonly pageHeader: Locator;
  readonly newImpedimentButton: Locator;
  readonly impedimentList: Locator;
  readonly impedimentCard: Locator;
  readonly createModal: Locator;
  readonly editModal: Locator;
  readonly detailModal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly prioritySelect: Locator;
  readonly statusSelect: Locator;
  readonly submitButton: Locator;
  readonly emptyState: Locator;
  readonly filterBar: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('[class*="impediments"], h1:has-text("Impediment")').first();
    this.newImpedimentButton = page
      .locator('button:has-text("New"), button:has-text("Add")')
      .first();
    this.impedimentList = page.locator('[class*="impediment-list"], [class*="impediments-list"]');
    this.impedimentCard = page.locator('[class*="impediment-card"], [class*="impediment-item"]');
    this.createModal = page.locator(
      '[class*="create-modal"], [class*="modal"]:has(h2:has-text("Create"))'
    );
    this.editModal = page.locator(
      '[class*="edit-modal"], [class*="modal"]:has(h2:has-text("Edit"))'
    );
    this.detailModal = page.locator(
      '[class*="detail-modal"], [class*="modal"]:has(h2:has-text("Detail"))'
    );
    this.titleInput = page.locator('#title, [name="title"]');
    this.descriptionInput = page.locator('#description, [name="description"]');
    this.prioritySelect = page.locator('#priority, [name="priority"]');
    this.statusSelect = page.locator('#status, [name="status"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.emptyState = page.locator('[class*="empty-state"]').first();
    this.filterBar = page.locator('[class*="filter-bar"]');
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async goto(): Promise<void> {
    await this.navigate('/impediments');
    await this.waitForPageLoad();
  }

  async clickNewImpediment(): Promise<void> {
    await this.newImpedimentButton.click();
  }

  async fillImpedimentForm(data: {
    title: string;
    description?: string;
    priority?: string;
  }): Promise<void> {
    await this.titleInput.fill(data.title);
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.priority) {
      await this.prioritySelect.selectOption(data.priority);
    }
  }

  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  async getImpediments(): Promise<Locator[]> {
    return this.impedimentCard.all();
  }

  async getImpedimentByTitle(title: string): Promise<Locator> {
    return this.impedimentCard.filter({ hasText: title }).first();
  }

  async hasImpediments(): Promise<boolean> {
    return this.isElementVisible(this.impedimentList);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }

  async searchImpediments(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }
}
