import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DailyScrumPage extends BasePage {
  readonly pageHeader: Locator;
  readonly updateForm: Locator;
  readonly yesterdayInput: Locator;
  readonly todayInput: Locator;
  readonly blockersInput: Locator;
  readonly submitButton: Locator;
  readonly updateList: Locator;
  readonly updateCard: Locator;
  readonly emptyState: Locator;
  readonly dateSelector: Locator;
  readonly previousDayButton: Locator;
  readonly nextDayButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('[class*="daily-scrum"], h1:has-text("Daily")').first();
    this.updateForm = page.locator('[class*="update-form"], form');
    this.yesterdayInput = page.locator('#yesterday, [name="yesterday"], textarea').first();
    this.todayInput = page.locator('#today, [name="today"], textarea').nth(1);
    this.blockersInput = page.locator('#blockers, [name="blockers"], textarea').nth(2);
    this.submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
    this.updateList = page.locator('[class*="update-list"], [class*="daily-updates"]');
    this.updateCard = page.locator('[class*="update-card"], [class*="daily-update"]');
    this.emptyState = page.locator('[class*="empty-state"]').first();
    this.dateSelector = page.locator('[class*="date-selector"], [class*="date-picker"]');
    this.previousDayButton = page.locator('button[aria-label*="previous" i], button:has-text("←")');
    this.nextDayButton = page.locator('button[aria-label*="next" i], button:has-text("→")');
  }

  async goto(): Promise<void> {
    await this.navigate('/daily-scrum');
    await this.waitForPageLoad();
  }

  async fillUpdateForm(data: {
    yesterday?: string;
    today?: string;
    blockers?: string;
  }): Promise<void> {
    if (data.yesterday) {
      await this.yesterdayInput.fill(data.yesterday);
    }
    if (data.today) {
      await this.todayInput.fill(data.today);
    }
    if (data.blockers) {
      await this.blockersInput.fill(data.blockers);
    }
  }

  async submitUpdate(): Promise<void> {
    await this.submitButton.click();
  }

  async getUpdates(): Promise<Locator[]> {
    return this.updateCard.all();
  }

  async hasUpdates(): Promise<boolean> {
    return this.isElementVisible(this.updateList);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }

  async navigateToPreviousDay(): Promise<void> {
    await this.previousDayButton.click();
  }

  async navigateToNextDay(): Promise<void> {
    await this.nextDayButton.click();
  }
}
