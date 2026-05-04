import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductGoalsPage extends BasePage {
  readonly pageHeader: Locator;
  readonly newGoalButton: Locator;
  readonly goalList: Locator;
  readonly goalCard: Locator;
  readonly createModal: Locator;
  readonly editModal: Locator;
  readonly statusChangeModal: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('[class*="product-goals"], h1:has-text("Goal")').first();
    this.newGoalButton = page.locator('button:has-text("New"), button:has-text("Create")').first();
    this.goalList = page.locator('[class*="goal-list"], [class*="product-goals-list"]');
    this.goalCard = page.locator('[class*="goal-card"], [class*="product-goal-item"]');
    this.createModal = page.locator(
      '[class*="create-modal"], [class*="modal"]:has(h2:has-text("Create"))'
    );
    this.editModal = page.locator(
      '[class*="edit-modal"], [class*="modal"]:has(h2:has-text("Edit"))'
    );
    this.statusChangeModal = page.locator(
      '[class*="status-modal"], [class*="modal"]:has(h2:has-text("Status"))'
    );
    this.titleInput = page.locator('#title, [name="title"]');
    this.descriptionInput = page.locator('#description, [name="description"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.emptyState = page.locator('[class*="empty-state"]').first();
  }

  async goto(): Promise<void> {
    await this.navigate('/goals');
    await this.waitForPageLoad();
  }

  async clickNewGoal(): Promise<void> {
    await this.newGoalButton.click();
  }

  async fillGoalForm(data: { title: string; description?: string }): Promise<void> {
    await this.titleInput.fill(data.title);
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
  }

  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  async getGoals(): Promise<Locator[]> {
    return this.goalCard.all();
  }

  async getGoalByTitle(title: string): Promise<Locator> {
    return this.goalCard.filter({ hasText: title }).first();
  }

  async hasGoals(): Promise<boolean> {
    return this.isElementVisible(this.goalList);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }
}
