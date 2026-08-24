import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DailyScrumPage extends BasePage {
  readonly pageHeader: Locator;
  readonly updateForm: Locator;
  readonly progressInput: Locator;
  readonly adaptationsInput: Locator;
  readonly planInput: Locator;
  readonly submitButton: Locator;
  readonly scrumRecord: Locator;
  readonly emptyState: Locator;
  readonly dateSelector: Locator;
  readonly previousDayButton: Locator;
  readonly nextDayButton: Locator;
  readonly createImpedimentButton: Locator;
  readonly promoteModal: Locator;
  readonly promoteTitleInput: Locator;
  readonly promoteDescriptionInput: Locator;
  readonly promoteSubmitButton: Locator;
  readonly impedimentList: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('[class*="daily-scrum"], h1:has-text("Daily")').first();
    this.updateForm = page.locator('[class*="update-form"], form');
    this.progressInput = page.locator('#progress-notes, [name="progress-notes"], textarea').first();
    this.adaptationsInput = page
      .locator('#adaptations-notes, [name="adaptations-notes"], textarea')
      .nth(1);
    this.planInput = page.locator('#plan-next-day, [name="plan-next-day"], textarea').nth(2);
    this.submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
    this.scrumRecord = page.locator('[class*="scrum-record-header"], [class*="daily-scrum"]');
    this.emptyState = page.locator('[class*="empty-state"]').first();
    this.dateSelector = page.locator('[class*="date-selector"], [class*="date-picker"]');
    this.previousDayButton = page.locator('button[aria-label*="previous" i], button:has-text("←")');
    this.nextDayButton = page.locator('button[aria-label*="next" i], button:has-text("→")');
    this.createImpedimentButton = page.locator('button:has-text("Create impediment")');
    this.promoteModal = page.locator('[role="dialog"], [class*="promote-modal"]');
    this.promoteTitleInput = page.locator('[role="dialog"] input[type="text"]').first();
    this.promoteDescriptionInput = page.locator('[role="dialog"] textarea').first();
    this.promoteSubmitButton = page.locator('[role="dialog"] button:has-text("Create Impediment")');
    this.impedimentList = page.locator('[class*="impediment-list"]');
  }

  async goto(): Promise<void> {
    await this.navigate('/daily-scrum');
    await this.waitForPageLoad();
  }

  async fillUpdateForm(data: {
    progressNotes?: string;
    adaptationsNotes?: string;
    planForNextDay?: string;
  }): Promise<void> {
    if (data.progressNotes) {
      await this.progressInput.fill(data.progressNotes);
    }
    if (data.adaptationsNotes) {
      await this.adaptationsInput.fill(data.adaptationsNotes);
    }
    if (data.planForNextDay) {
      await this.planInput.fill(data.planForNextDay);
    }
  }

  async submitUpdate(): Promise<void> {
    await this.submitButton.click();
  }

  async getUpdates(): Promise<Locator[]> {
    return this.scrumRecord.all();
  }

  async hasUpdates(): Promise<boolean> {
    return this.isElementVisible(this.scrumRecord);
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

  async openCreateImpedimentModal(): Promise<void> {
    await this.createImpedimentButton.click();
  }

  async createImpediment(data: { title: string; description: string }): Promise<void> {
    await this.promoteModal.waitFor({ state: 'visible' });
    await this.promoteTitleInput.fill(data.title);
    await this.promoteDescriptionInput.fill(data.description);
    await this.promoteSubmitButton.click();
  }

  getRaisedImpediments(): Locator {
    return this.impedimentList.locator('[class*="impediment-item"]');
  }
}
