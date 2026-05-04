import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SprintReviewPage extends BasePage {
  readonly pageHeader: Locator;
  readonly newReviewButton: Locator;
  readonly reviewList: Locator;
  readonly reviewCard: Locator;
  readonly createModal: Locator;
  readonly feedbackModal: Locator;
  readonly adjustmentModal: Locator;
  readonly emptyState: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('[class*="sprint-review"], h1:has-text("Review")').first();
    this.newReviewButton = page
      .locator('button:has-text("New"), button:has-text("Create")')
      .first();
    this.reviewList = page.locator('[class*="review-list"], [class*="sprint-reviews"]');
    this.reviewCard = page.locator('[class*="review-card"], [class*="sprint-review-item"]');
    this.createModal = page.locator(
      '[class*="create-modal"], [class*="modal"]:has(h2:has-text("Create"))'
    );
    this.feedbackModal = page.locator(
      '[class*="feedback-modal"], [class*="modal"]:has(h2:has-text("Feedback"))'
    );
    this.adjustmentModal = page.locator(
      '[class*="adjustment-modal"], [class*="modal"]:has(h2:has-text("Adjustment"))'
    );
    this.emptyState = page.locator('[class*="empty-state"]').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
  }

  async goto(): Promise<void> {
    await this.navigate('/sprint-review');
    await this.waitForPageLoad();
  }

  async clickNewReview(): Promise<void> {
    await this.newReviewButton.click();
  }

  async getReviews(): Promise<Locator[]> {
    return this.reviewCard.all();
  }

  async getReviewByTitle(title: string): Promise<Locator> {
    return this.reviewCard.filter({ hasText: title }).first();
  }

  async hasReviews(): Promise<boolean> {
    return this.isElementVisible(this.reviewList);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }

  async searchReviews(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }
}
