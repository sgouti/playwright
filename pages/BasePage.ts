import { Page, Locator, expect } from '@playwright/test';
import { ScreenshotUtils } from '@utils/ScreenshotUtils';
import { ValidationUtils } from '@utils/ValidationUtils';
import { TEST_CONFIG } from '@config/test.config';

export abstract class BasePage {
  protected page: Page;
  protected screenshotUtils: ScreenshotUtils;
  protected validationUtils: ValidationUtils;
  protected url: string;

  constructor(page: Page, url: string = '') {
    this.page = page;
    this.url = url;
    this.screenshotUtils = new ScreenshotUtils(page);
    this.validationUtils = new ValidationUtils(page);
  }

  /**
   * Navigate to the page
   */
  async navigate(): Promise<void> {
    if (!this.url) {
      throw new Error('URL not defined for this page');
    }
    
    console.log(`Navigating to: ${this.url}`);
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Refresh the page
   */
  async refresh(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  /**
   * Go forward in browser history
   */
  async goForward(): Promise<void> {
    await this.page.goForward();
    await this.waitForPageLoad();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ 
      state: 'visible', 
      timeout: timeout || TEST_CONFIG.DEFAULT_TIMEOUT 
    });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementToBeHidden(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ 
      state: 'hidden', 
      timeout: timeout || TEST_CONFIG.DEFAULT_TIMEOUT 
    });
  }

  /**
   * Click element with wait
   */
  async clickElement(locator: Locator, options?: { timeout?: number; force?: boolean }): Promise<void> {
    await this.waitForElement(locator, options?.timeout);
    await locator.click({ 
      timeout: options?.timeout || TEST_CONFIG.DEFAULT_TIMEOUT,
      force: options?.force 
    });
  }

  /**
   * Double click element
   */
  async doubleClickElement(locator: Locator): Promise<void> {
    await this.waitForElement(locator);
    await locator.dblclick();
  }

  /**
   * Right click element
   */
  async rightClickElement(locator: Locator): Promise<void> {
    await this.waitForElement(locator);
    await locator.click({ button: 'right' });
  }

  /**
   * Hover over element
   */
  async hoverElement(locator: Locator): Promise<void> {
    await this.waitForElement(locator);
    await locator.hover();
  }

  /**
   * Fill input field
   */
  async fillInput(locator: Locator, value: string, options?: { clear?: boolean }): Promise<void> {
    await this.waitForElement(locator);
    
    if (options?.clear !== false) {
      await locator.clear();
    }
    
    await locator.fill(value);
  }

  /**
   * Type text with delay
   */
  async typeText(locator: Locator, text: string, delay?: number): Promise<void> {
    await this.waitForElement(locator);
    await locator.type(text, { delay: delay || 50 });
  }

  /**
   * Select option from dropdown
   */
  async selectOption(locator: Locator, option: string | { label?: string; value?: string; index?: number }): Promise<void> {
    await this.waitForElement(locator);
    
    if (typeof option === 'string') {
      await locator.selectOption({ value: option });
    } else if (option.value) {
      await locator.selectOption({ value: option.value });
    } else if (option.label) {
      await locator.selectOption({ label: option.label });
    } else if (option.index !== undefined) {
      await locator.selectOption({ index: option.index });
    }
  }

  /**
   * Check/uncheck checkbox or radio button
   */
  async setCheckbox(locator: Locator, checked: boolean): Promise<void> {
    await this.waitForElement(locator);
    await locator.setChecked(checked);
  }

  /**
   * Upload file
   */
  async uploadFile(locator: Locator, filePath: string): Promise<void> {
    await this.waitForElement(locator);
    await locator.setInputFiles(filePath);
  }

  /**
   * Get element text
   */
  async getElementText(locator: Locator): Promise<string> {
    await this.waitForElement(locator);
    return await locator.textContent() || '';
  }

  /**
   * Get element attribute
   */
  async getElementAttribute(locator: Locator, attribute: string): Promise<string | null> {
    await this.waitForElement(locator);
    return await locator.getAttribute(attribute);
  }

  /**
   * Get input value
   */
  async getInputValue(locator: Locator): Promise<string> {
    await this.waitForElement(locator);
    return await locator.inputValue();
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if element is enabled
   */
  async isElementEnabled(locator: Locator): Promise<boolean> {
    try {
      return await locator.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Check if checkbox/radio is checked
   */
  async isElementChecked(locator: Locator): Promise<boolean> {
    try {
      return await locator.isChecked();
    } catch {
      return false;
    }
  }

  /**
   * Get element count
   */
  async getElementCount(locator: Locator): Promise<number> {
    return await locator.count();
  }

  /**
   * Scroll element into view
   */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * Wait for URL to change
   */
  async waitForUrlChange(expectedUrl: string | RegExp, timeout?: number): Promise<void> {
    await this.page.waitForURL(expectedUrl, { 
      timeout: timeout || TEST_CONFIG.DEFAULT_TIMEOUT 
    });
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(action: () => Promise<void>): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation(),
      action()
    ]);
  }

  /**
   * Handle JavaScript dialog (alert, confirm, prompt)
   */
  async handleDialog(accept: boolean = true, promptText?: string): Promise<void> {
    this.page.once('dialog', async dialog => {
      console.log(`Dialog appeared: ${dialog.message()}`);
      
      if (dialog.type() === 'prompt' && promptText) {
        await dialog.accept(promptText);
      } else if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });
  }

  /**
   * Execute JavaScript in browser
   */
  async executeScript(script: string, ...args: any[]): Promise<any> {
    return await this.page.evaluate(script, ...args);
  }

  /**
   * Take screenshot of current page
   */
  async takeScreenshot(name: string): Promise<string> {
    return await this.screenshotUtils.takeFullPageScreenshot(name);
  }

  /**
   * Take screenshot of specific element
   */
  async takeElementScreenshot(locator: Locator, name: string): Promise<string> {
    return await this.screenshotUtils.takeElementScreenshot(locator, name);
  }

  /**
   * Wait for element with custom condition
   */
  async waitForCondition(
    condition: () => Promise<boolean>, 
    timeout: number = TEST_CONFIG.DEFAULT_TIMEOUT,
    interval: number = 1000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.page.waitForTimeout(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Get all elements matching locator
   */
  async getAllElements(locator: Locator): Promise<Locator[]> {
    const count = await locator.count();
    const elements: Locator[] = [];
    
    for (let i = 0; i < count; i++) {
      elements.push(locator.nth(i));
    }
    
    return elements;
  }

  /**
   * Validate page is loaded correctly
   */
  async validatePageLoaded(): Promise<void> {
    await this.waitForPageLoad();
    
    // Check for common error indicators
    const errorSelectors = [
      '[data-testid="error"]',
      '.error',
      '#error',
      '.alert-error'
    ];
    
    for (const selector of errorSelectors) {
      const errorElement = this.page.locator(selector);
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        throw new Error(`Page load error detected: ${errorText}`);
      }
    }
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(urlPattern: string | RegExp, timeout?: number): Promise<void> {
    await this.page.waitForResponse(
      response => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: timeout || TEST_CONFIG.DEFAULT_TIMEOUT }
    );
  }

  /**
   * Clear browser storage
   */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Set local storage item
   */
  async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key, value }
    );
  }

  /**
   * Get local storage item
   */
  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate(
      (key) => localStorage.getItem(key),
      key
    );
  }

  /**
   * Abstract method to be implemented by concrete page classes
   * Should define page-specific validation logic
   */
  abstract isPageLoaded(): Promise<boolean>;
}