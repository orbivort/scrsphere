import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly sprintCard: Locator;
  readonly burndownChart: Locator;
  readonly taskList: Locator;
  readonly impedimentList: Locator;
  readonly pageHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.userMenu = page.locator('[class*="user-menu"], [data-testid="user-menu"]').first();
    this.logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out")');
    this.sprintCard = page.locator('[class*="sprint-card"]').first();
    this.burndownChart = page
      .locator('[class*="chart-container"] canvas, [class*="burndown"] canvas')
      .first();
    this.taskList = page.locator('[class*="task-list"], [class*="task-item"]').first();
    this.impedimentList = page.locator('[class*="impediment"]').first();
    this.pageHeader = page.locator('h1, [class*="page-header"]').first();
  }

  async goto(): Promise<void> {
    await this.navigate('/dashboard');
    await this.waitForPageLoad();
  }

  async isUserMenuVisible(): Promise<boolean> {
    return this.isElementVisible(this.userMenu);
  }

  async openUserMenu(): Promise<void> {
    await this.userMenu.click();
  }

  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  async isSprintCardVisible(): Promise<boolean> {
    return this.isElementVisible(this.sprintCard);
  }

  async isBurndownChartVisible(): Promise<boolean> {
    return this.isElementVisible(this.burndownChart);
  }

  async isTaskListVisible(): Promise<boolean> {
    return this.isElementVisible(this.taskList);
  }

  async verifyDashboardLoaded(): Promise<void> {
    await expect(this.pageHeader).toBeVisible({ timeout: 10000 });
  }

  async getSprintDaysRemaining(): Promise<string | null> {
    const daysElement = this.page.locator('[class*="days-remaining"]').first();
    return this.getElementText(daysElement);
  }

  async navigateToSprintBoard(): Promise<void> {
    await this.page.click('a:has-text("Sprint"), a:has-text("Board")');
  }
}
