import { expect, type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class TeamManagementPage extends BasePage {
  readonly pageHeader: Locator;
  readonly inviteButton: Locator;
  readonly memberList: Locator;
  readonly memberCard: Locator;
  readonly inviteModal: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly sendInviteButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeader = page.locator('[class*="team-page"], h1:has-text("Team")').first();
    this.inviteButton = page
      .locator('button:has-text("Invite"), button:has-text("Add Member")')
      .first();
    this.memberList = page.locator('[class*="member-list"], [class*="team-members"]');
    this.memberCard = page.locator('[class*="member-card"], [class*="team-member"]');
    this.inviteModal = page.locator(
      '[class*="invite-modal"], [class*="modal"]:has(h2:has-text("Invite"))'
    );
    this.emailInput = page.locator('#email, [name="email"]');
    this.roleSelect = page.locator('#role, [name="role"]');
    this.sendInviteButton = page.locator('button:has-text("Send"), button:has-text("Invite")');
    this.emptyState = page.locator('[class*="empty-state"]').first();
  }

  async goto(): Promise<void> {
    await this.navigate('/team');
    await this.waitForPageLoad();
  }

  async clickInvite(): Promise<void> {
    await this.inviteButton.click();
  }

  async fillInviteForm(email: string, role?: string): Promise<void> {
    await this.emailInput.fill(email);
    if (role) {
      await this.roleSelect.selectOption(role);
    }
  }

  async sendInvite(): Promise<void> {
    await this.sendInviteButton.click();
  }

  async getMembers(): Promise<Locator[]> {
    return this.memberCard.all();
  }

  async getMemberByName(name: string): Promise<Locator> {
    return this.memberCard.filter({ hasText: name }).first();
  }

  async hasMembers(): Promise<boolean> {
    return this.isElementVisible(this.memberList);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.isElementVisible(this.emptyState);
  }
}
