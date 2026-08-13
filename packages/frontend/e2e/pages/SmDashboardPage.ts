import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SmDashboardPage extends BasePage {
  readonly pageHeader: Locator;
  readonly eventComplianceSection: Locator;
  readonly impedimentMetricsSection: Locator;
  readonly dodTrendSection: Locator;
  readonly sprintGoalSection: Locator;
  readonly actionItemsSection: Locator;
  readonly healthCheckSection: Locator;
  readonly emptyState: Locator;
  readonly errorState: Locator;

  constructor(page: Page) {
    super(page);
    // Use data-testid and structural selectors to be locale-independent
    this.pageHeader = page.locator('[data-testid="sm-dashboard-header"], h1').first();
    this.eventComplianceSection = page.locator(
      '[data-testid="event-compliance"], [class*="event-compliance"]'
    );
    this.impedimentMetricsSection = page.locator(
      '[data-testid="impediment-metrics"], [class*="impediment-metrics"]'
    );
    this.dodTrendSection = page.locator('[data-testid="dod-trend"], [class*="dod-trend"]');
    this.sprintGoalSection = page.locator('[data-testid="sprint-goal"], [class*="sprint-goal"]');
    this.actionItemsSection = page.locator('[data-testid="action-items"], [class*="action-items"]');
    this.healthCheckSection = page.locator('[data-testid="health-check"], [class*="health-check"]');
    this.emptyState = page.locator('[class*="empty-state"]').first();
    this.errorState = page.locator('[class*="error-state"], [role="alert"]').first();
  }

  async goto(): Promise<void> {
    await this.navigate('/scrum-master-dashboard');
    await this.waitForPageLoad();
  }

  /**
   * Dashboard sections render asynchronously after the data query resolves.
   * Wait for the section to become visible before reporting its state so the
   * check is robust against the initial loading state.
   */
  private async waitForVisible(locator: Locator, timeout = 15000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isEventComplianceVisible(): Promise<boolean> {
    return this.waitForVisible(this.eventComplianceSection);
  }

  async isImpedimentMetricsVisible(): Promise<boolean> {
    return this.waitForVisible(this.impedimentMetricsSection);
  }

  async isDoDTrendVisible(): Promise<boolean> {
    return this.waitForVisible(this.dodTrendSection);
  }

  async isSprintGoalVisible(): Promise<boolean> {
    return this.waitForVisible(this.sprintGoalSection);
  }

  async isActionItemsVisible(): Promise<boolean> {
    return this.waitForVisible(this.actionItemsSection);
  }

  async isHealthCheckVisible(): Promise<boolean> {
    return this.waitForVisible(this.healthCheckSection);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }

  async hasErrorState(): Promise<boolean> {
    return this.isElementVisible(this.errorState);
  }

  async getOverallHealthScore(): Promise<string | null> {
    const scoreElement = this.page.locator(
      '[data-testid="health-score"], [class*="overall-score"]'
    );
    return this.getElementText(scoreElement.first());
  }
}
