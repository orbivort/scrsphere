import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SprintPlanningPage extends BasePage {
  readonly pageHeader: Locator;
  readonly sprintNameInput: Locator;
  readonly sprintGoalInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly capacityInput: Locator;
  readonly availableBacklogItems: Locator;
  readonly selectedBacklogItems: Locator;
  readonly addItemButton: Locator;
  readonly removeItemButton: Locator;
  readonly startPlanningButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly teamCapacitySection: Locator;
  readonly velocityChart: Locator;
  readonly storyPointsTotal: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page
      .locator('[class*="sprint-planning"], h1:has-text("Sprint Planning")')
      .first();
    this.sprintNameInput = page.locator('#sprintName, [name="name"], [name="sprintName"]');
    this.sprintGoalInput = page.locator('#sprintGoal, [name="goal"], [name="sprintGoal"]');
    this.startDateInput = page.locator('#startDate, [name="startDate"]');
    this.endDateInput = page.locator('#endDate, [name="endDate"]');
    this.capacityInput = page.locator('#capacity, [name="capacity"]');
    this.availableBacklogItems = page.locator(
      '[class*="available-items"], [class*="backlog-pool"]'
    );
    this.selectedBacklogItems = page.locator(
      '[class*="selected-items"], [class*="sprint-backlog"]'
    );
    this.addItemButton = page.locator('button:has-text("Add"), [aria-label*="add" i]');
    this.removeItemButton = page.locator('button:has-text("Remove"), [aria-label*="remove" i]');
    this.startPlanningButton = page.locator(
      'button:has-text("Start Planning"), button:has-text("New Sprint")'
    );
    this.saveButton = page.locator(
      'button[type="submit"]:has-text("Save"), button:has-text("Create")'
    );
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.teamCapacitySection = page.locator(
      '[class*="team-capacity"], [class*="capacity-section"]'
    );
    this.velocityChart = page.locator('[class*="velocity"], [class*="chart"]').first();
    this.storyPointsTotal = page.locator('[class*="story-points"], [class*="total-points"]');
    this.emptyState = page.locator('[class*="empty-state"]').first();
  }

  async goto(): Promise<void> {
    await this.navigate('/planning');
    await this.waitForPageLoad();
  }

  async fillSprintDetails(data: {
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    await this.sprintNameInput.fill(data.name);

    if (data.goal) {
      await this.sprintGoalInput.fill(data.goal);
    }

    if (data.startDate) {
      await this.startDateInput.fill(data.startDate);
    }

    if (data.endDate) {
      await this.endDateInput.fill(data.endDate);
    }
  }

  async addBacklogItem(itemTitle: string): Promise<void> {
    const item = this.availableBacklogItems
      .locator(`:text-is("${itemTitle}"), [class*="item"]:has-text("${itemTitle}")`)
      .first();
    await item.click();
    await this.addItemButton.first().click();
  }

  async removeBacklogItem(itemTitle: string): Promise<void> {
    const item = this.selectedBacklogItems
      .locator(`:text-is("${itemTitle}"), [class*="item"]:has-text("${itemTitle}")`)
      .first();
    await item.click();
    await this.removeItemButton.first().click();
  }

  async getAvailableItems(): Promise<Locator[]> {
    return this.availableBacklogItems.locator('[class*="item"]').all();
  }

  async getSelectedItems(): Promise<Locator[]> {
    return this.selectedBacklogItems.locator('[class*="item"]').all();
  }

  async getTotalStoryPoints(): Promise<string | null> {
    return this.getElementText(this.storyPointsTotal);
  }

  async clickStartPlanning(): Promise<void> {
    await this.startPlanningButton.click();
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async hasTeamCapacitySection(): Promise<boolean> {
    return this.isElementVisible(this.teamCapacitySection);
  }

  async hasVelocityChart(): Promise<boolean> {
    return this.isElementVisible(this.velocityChart);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }

  async setTeamMemberCapacity(memberId: string, capacity: number): Promise<void> {
    const memberRow = this.page.locator(
      `[data-member-id="${memberId}"], [class*="member"]:has-text("${memberId}")`
    );
    const capacityInput = memberRow.locator('[name*="capacity"], input[type="number"]');
    await capacityInput.fill(capacity.toString());
  }
}
