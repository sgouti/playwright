import { Page } from '@playwright/test';

/**
 * Simple screenshot utilities for beginners
 * Only the essential helpers you actually need
 */
export class ScreenshotUtils {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Take a simple screenshot
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Take screenshot of specific element
   */
  async takeElementScreenshot(selector: string, name: string) {
    const element = this.page.locator(selector);
    await element.screenshot({ path: `screenshots/${name}-element.png` });
  }
}