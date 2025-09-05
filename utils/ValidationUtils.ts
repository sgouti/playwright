import { Page, Locator, expect } from '@playwright/test';

export class ValidationUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that element is visible and enabled
   */
  async validateElementIsInteractable(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();
  }

  /**
   * Validate element text content
   */
  async validateElementText(locator: Locator, expectedText: string, exact: boolean = true): Promise<void> {
    if (exact) {
      await expect(locator).toHaveText(expectedText);
    } else {
      await expect(locator).toContainText(expectedText);
    }
  }

  /**
   * Validate element attribute value
   */
  async validateElementAttribute(locator: Locator, attribute: string, expectedValue: string): Promise<void> {
    await expect(locator).toHaveAttribute(attribute, expectedValue);
  }

  /**
   * Validate element CSS property
   */
  async validateElementCSS(locator: Locator, property: string, expectedValue: string): Promise<void> {
    await expect(locator).toHaveCSS(property, expectedValue);
  }

  /**
   * Validate page title
   */
  async validatePageTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Validate page URL
   */
  async validatePageUrl(expectedUrl: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Validate element count
   */
  async validateElementCount(locator: Locator, expectedCount: number): Promise<void> {
    await expect(locator).toHaveCount(expectedCount);
  }

  /**
   * Validate form field value
   */
  async validateInputValue(locator: Locator, expectedValue: string): Promise<void> {
    await expect(locator).toHaveValue(expectedValue);
  }

  /**
   * Validate checkbox/radio button state
   */
  async validateCheckboxState(locator: Locator, shouldBeChecked: boolean): Promise<void> {
    if (shouldBeChecked) {
      await expect(locator).toBeChecked();
    } else {
      await expect(locator).not.toBeChecked();
    }
  }

  /**
   * Validate dropdown selection
   */
  async validateDropdownSelection(locator: Locator, expectedValue: string): Promise<void> {
    await expect(locator).toHaveValue(expectedValue);
  }

  /**
   * Validate element is focused
   */
  async validateElementFocus(locator: Locator): Promise<void> {
    await expect(locator).toBeFocused();
  }

  /**
   * Validate element contains class
   */
  async validateElementClass(locator: Locator, className: string): Promise<void> {
    await expect(locator).toHaveClass(new RegExp(className));
  }

  /**
   * Validate API response status
   */
  static validateResponseStatus(response: any, expectedStatus: number): void {
    expect(response.status()).toBe(expectedStatus);
  }

  /**
   * Validate API response contains property
   */
  static validateResponseProperty(responseBody: any, propertyPath: string, expectedValue?: any): void {
    const properties = propertyPath.split('.');
    let current = responseBody;
    
    for (const prop of properties) {
      expect(current).toHaveProperty(prop);
      current = current[prop];
    }
    
    if (expectedValue !== undefined) {
      expect(current).toBe(expectedValue);
    }
  }

  /**
   * Validate array length
   */
  static validateArrayLength(array: any[], expectedLength: number): void {
    expect(array).toHaveLength(expectedLength);
  }

  /**
   * Validate object structure
   */
  static validateObjectStructure(obj: any, expectedStructure: any): void {
    for (const key in expectedStructure) {
      expect(obj).toHaveProperty(key);
      
      if (typeof expectedStructure[key] === 'object' && expectedStructure[key] !== null) {
        this.validateObjectStructure(obj[key], expectedStructure[key]);
      }
    }
  }

  /**
   * Validate string matches pattern
   */
  static validateStringPattern(str: string, pattern: RegExp): boolean {
    return pattern.test(str);
  }

  /**
   * Validate number is within range
   */
  static validateNumberRange(num: number, min: number, max: number): boolean {
    return num >= min && num <= max;
  }

  /**
   * Validate date format
   */
  static validateDateFormat(dateStr: string, format: 'ISO' | 'US' | 'EU'): boolean {
    let regex: RegExp;
    
    switch (format) {
      case 'ISO':
        regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        break;
      case 'US':
        regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
        break;
      case 'EU':
        regex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
        break;
      default:
        return false;
    }
    
    return regex.test(dateStr);
  }

  /**
   * Validate element is within viewport
   */
  async validateElementInViewport(locator: Locator): Promise<void> {
    await expect(locator).toBeInViewport();
  }

  /**
   * Validate page load performance
   */
  async validatePageLoadTime(maxLoadTime: number): Promise<void> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(maxLoadTime);
  }

  /**
   * Validate no console errors
   */
  async validateNoConsoleErrors(): Promise<void> {
    const errors: string[] = [];
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit to collect any console errors
    await this.page.waitForTimeout(1000);
    
    expect(errors).toHaveLength(0);
  }

  /**
   * Validate accessibility (basic check)
   */
  async validateBasicAccessibility(): Promise<void> {
    // Check for alt attributes on images
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
    
    // Check for form labels
    const inputs = this.page.locator('input[type="text"], input[type="email"], input[type="password"], textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      
      if (id) {
        const label = this.page.locator(`label[for="${id}"]`);
        const labelExists = await label.count() > 0;
        expect(labelExists || ariaLabel).toBeTruthy();
      } else {
        expect(ariaLabel).not.toBeNull();
      }
    }
  }
}