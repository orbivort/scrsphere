import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly toggleModeButton: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly termsCheckbox: Locator;
  readonly marketingCheckbox: Locator;
  readonly errorMessage: Locator;
  readonly passwordToggle: Locator;
  readonly passwordStrengthIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.toggleModeButton = page.locator('button[class*="mode-toggle"]');
    this.firstNameInput = page.locator('#firstName');
    this.lastNameInput = page.locator('#lastName');
    this.termsCheckbox = page.locator('input[type="checkbox"]').first();
    this.marketingCheckbox = page.locator('input[type="checkbox"]').nth(1);
    this.errorMessage = page.locator('[class*="error-message"]');
    this.passwordToggle = page.locator('button[aria-label*="password"]');
    this.passwordStrengthIndicator = page.locator('[class*="password-strength"]');
  }

  async goto(): Promise<void> {
    await this.navigate('/login');
    await this.waitForPageLoad();
  }

  async switchToRegisterMode(): Promise<void> {
    // Wait for any animations to complete and cookie banner to appear
    await this.page.waitForTimeout(800);
    await this.dismissCookieBanner();

    // Check if already in register mode
    const isRegisterMode = await this.firstNameInput.isVisible().catch(() => false);
    if (isRegisterMode) {
      return;
    }

    // Try clicking the toggle button with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        // Use force click to bypass any overlay issues
        await this.toggleModeButton.click({ force: true });
        await this.firstNameInput.waitFor({ state: 'visible', timeout: 5000 });
        return; // Success
      } catch {
        retries--;
        if (retries === 0) {
          throw new Error('Failed to switch to register mode after 3 attempts');
        }
        await this.page.waitForTimeout(500);
      }
    }
  }

  async switchToLoginMode(): Promise<void> {
    // Wait for any animations to complete and cookie banner to appear
    await this.page.waitForTimeout(800);
    await this.dismissCookieBanner();

    // Check if already in login mode
    const isLoginMode = !(await this.firstNameInput.isVisible().catch(() => false));
    if (isLoginMode) {
      return;
    }

    // Try clicking the toggle button with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        // Use force click to bypass any overlay issues
        await this.toggleModeButton.click({ force: true });
        await expect(this.firstNameInput).not.toBeVisible({ timeout: 5000 });
        return; // Success
      } catch {
        retries--;
        if (retries === 0) {
          throw new Error('Failed to switch to login mode after 3 attempts');
        }
        await this.page.waitForTimeout(500);
      }
    }
  }

  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.dismissCookieBanner();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async fillRegistrationForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    acceptTerms?: boolean;
    optInMarketing?: boolean;
  }): Promise<void> {
    await this.switchToRegisterMode();
    await this.dismissCookieBanner();
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);

    if (data.acceptTerms !== false) {
      await this.termsCheckbox.check({ force: true });
    }

    if (data.optInMarketing) {
      await this.marketingCheckbox.check({ force: true });
    }
  }

  async submitForm(): Promise<void> {
    await this.dismissCookieBanner();
    await this.submitButton.click({ force: true });
  }

  async login(email: string, password: string): Promise<void> {
    await this.switchToLoginMode();
    await this.fillLoginForm(email, password);
    await this.submitForm();
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    acceptTerms?: boolean;
    optInMarketing?: boolean;
  }): Promise<void> {
    await this.fillRegistrationForm(data);
    await this.submitForm();
  }

  async getErrorMessage(): Promise<string | null> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return this.getElementText(this.errorMessage);
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.dismissCookieBanner();
    await this.passwordToggle.click({ force: true });
  }

  async isPasswordVisible(): Promise<boolean> {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'text';
  }

  async getPasswordStrength(): Promise<string | null> {
    const strengthLabel = this.passwordStrengthIndicator.locator('[class*="strength-label"]');
    return this.getElementText(strengthLabel);
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return this.submitButton.isDisabled();
  }

  async waitForRedirect(expectedPath: RegExp | string, timeout = 30000): Promise<void> {
    await this.waitForUrl(expectedPath, timeout);
  }
}
