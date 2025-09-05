import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { TEST_CONFIG } from '@config/test.config';

export class LoginPage extends BasePage {
  // Page elements
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly errorMessage: Locator;
  private readonly successMessage: Locator;
  private readonly loadingSpinner: Locator;
  private readonly signUpLink: Locator;

  constructor(page: Page) {
    super(page, TEST_CONFIG.ENDPOINTS.LOGIN);
    
    // Initialize locators
    this.usernameInput = page.locator('[data-testid="username"], #username, input[name="username"]');
    this.passwordInput = page.locator('[data-testid="password"], #password, input[name="password"]');
    this.loginButton = page.locator('[data-testid="login-button"], #login-btn, button[type="submit"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password"], a[href*="forgot"]');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me"], #remember-me');
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message, .alert-error');
    this.successMessage = page.locator('[data-testid="success-message"], .success-message, .alert-success');
    this.loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner');
    this.signUpLink = page.locator('[data-testid="signup-link"], a[href*="signup"], a[href*="register"]');
  }

  /**
   * Check if login page is loaded
   */
  async isPageLoaded(): Promise<boolean> {
    try {
      await this.waitForElement(this.usernameInput);
      await this.waitForElement(this.passwordInput);
      await this.waitForElement(this.loginButton);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Enter username
   */
  async enterUsername(username: string): Promise<void> {
    await this.fillInput(this.usernameInput, username);
  }

  /**
   * Enter password
   */
  async enterPassword(password: string): Promise<void> {
    await this.fillInput(this.passwordInput, password);
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await this.clickElement(this.loginButton);
  }

  /**
   * Set remember me checkbox
   */
  async setRememberMe(checked: boolean): Promise<void> {
    if (await this.isElementVisible(this.rememberMeCheckbox)) {
      await this.setCheckbox(this.rememberMeCheckbox, checked);
    }
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink);
  }

  /**
   * Click sign up link
   */
  async clickSignUp(): Promise<void> {
    await this.clickElement(this.signUpLink);
  }

  /**
   * Perform login with credentials
   */
  async login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    
    if (rememberMe) {
      await this.setRememberMe(true);
    }
    
    await this.clickLogin();
  }

  /**
   * Perform quick login with test user
   */
  async loginAsTestUser(userType: 'admin' | 'user' | 'guest' = 'user'): Promise<void> {
    const testUser = TEST_CONFIG.TEST_USERS[userType.toUpperCase() as keyof typeof TEST_CONFIG.TEST_USERS];
    await this.login(testUser.username, testUser.password);
  }

  /**
   * Wait for login to complete
   */
  async waitForLoginComplete(): Promise<void> {
    // Wait for loading spinner to disappear
    if (await this.isElementVisible(this.loadingSpinner)) {
      await this.waitForElementToBeHidden(this.loadingSpinner);
    }
    
    // Wait for navigation or success message
    try {
      await Promise.race([
        this.waitForUrlChange(/dashboard|home|profile/),
        this.waitForElement(this.successMessage, 5000)
      ]);
    } catch {
      // If neither happens, check for error message
      if (await this.isElementVisible(this.errorMessage)) {
        const error = await this.getElementText(this.errorMessage);
        throw new Error(`Login failed: ${error}`);
      }
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.isElementVisible(this.errorMessage)) {
      return await this.getElementText(this.errorMessage);
    }
    return '';
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    if (await this.isElementVisible(this.successMessage)) {
      return await this.getElementText(this.successMessage);
    }
    return '';
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.isElementVisible(this.errorMessage);
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.isElementVisible(this.successMessage);
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.isElementEnabled(this.loginButton);
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.isElementVisible(this.loadingSpinner);
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<void> {
    await this.fillInput(this.usernameInput, '');
    await this.fillInput(this.passwordInput, '');
    
    if (await this.isElementChecked(this.rememberMeCheckbox)) {
      await this.setCheckbox(this.rememberMeCheckbox, false);
    }
  }

  /**
   * Validate login form elements
   */
  async validateFormElements(): Promise<void> {
    await this.validationUtils.validateElementIsInteractable(this.usernameInput);
    await this.validationUtils.validateElementIsInteractable(this.passwordInput);
    await this.validationUtils.validateElementIsInteractable(this.loginButton);
  }

  /**
   * Validate username field
   */
  async validateUsernameField(expectedValue?: string): Promise<void> {
    await this.validationUtils.validateElementIsInteractable(this.usernameInput);
    
    if (expectedValue) {
      await this.validationUtils.validateInputValue(this.usernameInput, expectedValue);
    }
  }

  /**
   * Validate password field
   */
  async validatePasswordField(): Promise<void> {
    await this.validationUtils.validateElementIsInteractable(this.passwordInput);
    await this.validationUtils.validateElementAttribute(this.passwordInput, 'type', 'password');
  }

  /**
   * Test invalid login scenarios
   */
  async testInvalidLogin(username: string, password: string): Promise<string> {
    await this.login(username, password);
    
    // Wait for error message to appear
    await this.waitForElement(this.errorMessage, 5000);
    
    return await this.getErrorMessage();
  }

  /**
   * Test empty form submission
   */
  async testEmptyFormSubmission(): Promise<string> {
    await this.clearForm();
    await this.clickLogin();
    
    // Check for validation messages or error
    if (await this.hasErrorMessage()) {
      return await this.getErrorMessage();
    }
    
    // Check for HTML5 validation
    const usernameValidation = await this.usernameInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    const passwordValidation = await this.passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    
    return usernameValidation || passwordValidation || 'No validation message found';
  }

  /**
   * Take screenshot of login page
   */
  async takeLoginPageScreenshot(name: string = 'login-page'): Promise<string> {
    return await this.takeScreenshot(name);
  }

  /**
   * Validate login page accessibility
   */
  async validateAccessibility(): Promise<void> {
    await this.validationUtils.validateBasicAccessibility();
    
    // Check for proper form labels
    const usernameLabel = this.page.locator('label[for="username"], label[for*="username"]');
    const passwordLabel = this.page.locator('label[for="password"], label[for*="password"]');
    
    if (await usernameLabel.count() > 0) {
      await this.validationUtils.validateElementIsInteractable(usernameLabel);
    }
    
    if (await passwordLabel.count() > 0) {
      await this.validationUtils.validateElementIsInteractable(passwordLabel);
    }
  }
}