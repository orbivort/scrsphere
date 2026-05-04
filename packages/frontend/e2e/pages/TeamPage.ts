import type { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class TeamPage extends BasePage {
  readonly welcomeMessage: Locator;
  readonly inviteButton: Locator;
  readonly memberList: Locator;
  readonly teamName: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.locator('[class*="welcome"], h1').first();
    this.inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add")');
    this.memberList = page.locator('[class*="member-list"], [class*="team-member"]').first();
    this.teamName = page.locator('[class*="team-name"]').first();
  }

  async goto(): Promise<void> {
    await this.navigate('/team');
    await this.waitForPageLoad();
  }

  async isWelcomeMessageVisible(): Promise<boolean> {
    return this.isElementVisible(this.welcomeMessage);
  }

  async isMemberListVisible(): Promise<boolean> {
    return this.isElementVisible(this.memberList);
  }

  async getWelcomeText(): Promise<string | null> {
    return this.getElementText(this.welcomeMessage);
  }
}
