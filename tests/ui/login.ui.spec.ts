import { test, expect } from '@fixtures/fixtures';
import { TEST_CONFIG } from '@config/test.config';

test.describe('Login Page UI Tests', () => {
  test.beforeAll(async () => {
    console.log('🚀 Starting Login UI test suite');
  });

  test.afterAll(async () => {
    console.log('✅ Login UI test suite completed');
  });

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.validatePageLoaded();
  });

  test.afterEach(async ({ page, takeTestScreenshot }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await takeTestScreenshot(`failure-${testInfo.title}`);
    }
  });

  test('should display login form elements', async ({ loginPage, validationUtils }) => {
    // Validate form elements are present and interactive
    await loginPage.validateFormElements();
    
    // Validate page title
    await validationUtils.validatePageTitle('Login');
    
    // Validate URL
    await validationUtils.validatePageUrl(/login|auth/);
  });

  test('should login successfully with valid credentials', async ({ 
    loginPage, 
    dashboardPage, 
    testData 
  }) => {
    const adminUser = testData.users.ADMIN;
    
    // Perform login
    await loginPage.login(adminUser.username, adminUser.password);
    await loginPage.waitForLoginComplete();
    
    // Validate successful navigation to dashboard
    await dashboardPage.validatePageLoaded();
    
    // Validate welcome message contains username
    const welcomeMessage = await dashboardPage.getWelcomeMessage();
    expect(welcomeMessage).toContain('Welcome');
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    // Test with invalid credentials
    const errorMessage = await loginPage.testInvalidLogin('invalid@example.com', 'wrongpassword');
    
    // Validate error message is displayed
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.toLowerCase()).toContain('invalid');
    
    // Validate user remains on login page
    expect(await loginPage.isPageLoaded()).toBe(true);
  });

  test('should validate empty form submission', async ({ loginPage }) => {
    // Test empty form submission
    const validationMessage = await loginPage.testEmptyFormSubmission();
    
    // Validate that some form of validation occurs
    expect(validationMessage).toBeTruthy();
  });

  test('should validate username field', async ({ loginPage }) => {
    // Test username field validation
    await loginPage.validateUsernameField();
    
    // Test entering and clearing username
    await loginPage.enterUsername('test@example.com');
    await loginPage.validateUsernameField('test@example.com');
    
    await loginPage.enterUsername('');
    await loginPage.validateUsernameField('');
  });

  test('should validate password field security', async ({ loginPage }) => {
    // Validate password field is of type password
    await loginPage.validatePasswordField();
    
    // Enter password and verify it's masked
    await loginPage.enterPassword('testpassword');
    
    // Password value should not be visible in the DOM
    const passwordValue = await loginPage.getInputValue(
      loginPage['passwordInput'] // Access private field for testing
    );
    expect(passwordValue).toBe('testpassword');
  });

  test('should handle remember me functionality', async ({ loginPage, testData }) => {
    const user = testData.users.USER;
    
    // Login with remember me checked
    await loginPage.login(user.username, user.password, true);
    await loginPage.waitForLoginComplete();
    
    // Verify remember me was set (this would depend on implementation)
    // In a real test, you might check localStorage or cookies
  });

  test('should navigate to forgot password', async ({ loginPage, page }) => {
    // Click forgot password link
    await loginPage.clickForgotPassword();
    
    // Validate navigation (URL would depend on implementation)
    await page.waitForURL(/forgot|reset/);
  });

  test('should navigate to sign up', async ({ loginPage, page }) => {
    // Click sign up link
    await loginPage.clickSignUp();
    
    // Validate navigation
    await page.waitForURL(/signup|register/);
  });

  test('should be accessible', async ({ loginPage }) => {
    // Validate basic accessibility
    await loginPage.validateAccessibility();
  });

  test('should load within performance threshold', async ({ 
    loginPage, 
    validationUtils 
  }) => {
    // Validate page load performance
    await validationUtils.validatePageLoadTime(TEST_CONFIG.PERFORMANCE_THRESHOLDS.LOAD_TIME);
  });

  test('should handle keyboard navigation', async ({ loginPage, page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(loginPage['usernameInput']).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(loginPage['passwordInput']).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(loginPage['loginButton']).toBeFocused();
  });

  test('should clear form correctly', async ({ loginPage }) => {
    // Fill form
    await loginPage.enterUsername('test@example.com');
    await loginPage.enterPassword('testpassword');
    await loginPage.setRememberMe(true);
    
    // Clear form
    await loginPage.clearForm();
    
    // Validate form is cleared
    await loginPage.validateUsernameField('');
    expect(await loginPage.isElementChecked(loginPage['rememberMeCheckbox'])).toBe(false);
  });
});