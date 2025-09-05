import { Page, Locator, expect } from '@playwright/test';
import { TEST_CONFIG } from '@config/test.config';
import * as fs from 'fs';
import * as path from 'path';

export class ScreenshotUtils {
  private page: Page;
  private screenshotPath: string;

  constructor(page: Page) {
    this.page = page;
    this.screenshotPath = TEST_CONFIG.SCREENSHOT_PATH;
    this.ensureDirectoryExists(this.screenshotPath);
  }

  /**
   * Take a full page screenshot
   */
  async takeFullPageScreenshot(name: string): Promise<string> {
    const fileName = `${name}-${Date.now()}.png`;
    const filePath = path.join(this.screenshotPath, fileName);
    
    await this.page.screenshot({
      path: filePath,
      fullPage: true,
      quality: TEST_CONFIG.SCREENSHOT_QUALITY,
    });
    
    return filePath;
  }

  /**
   * Take a screenshot of a specific element
   */
  async takeElementScreenshot(locator: Locator, name: string): Promise<string> {
    const fileName = `${name}-element-${Date.now()}.png`;
    const filePath = path.join(this.screenshotPath, fileName);
    
    await locator.screenshot({
      path: filePath,
      quality: TEST_CONFIG.SCREENSHOT_QUALITY,
    });
    
    return filePath;
  }

  /**
   * Compare screenshot with baseline (visual regression testing)
   */
  async compareWithBaseline(name: string, options?: {
    threshold?: number;
    maxDiffPixels?: number;
  }): Promise<void> {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      threshold: options?.threshold || 0.2,
      maxDiffPixels: options?.maxDiffPixels || 100,
    });
  }

  /**
   * Compare element screenshot with baseline
   */
  async compareElementWithBaseline(
    locator: Locator, 
    name: string, 
    options?: {
      threshold?: number;
      maxDiffPixels?: number;
    }
  ): Promise<void> {
    await expect(locator).toHaveScreenshot(`${name}-element.png`, {
      threshold: options?.threshold || 0.2,
      maxDiffPixels: options?.maxDiffPixels || 100,
    });
  }

  /**
   * Take screenshot on test failure
   */
  async captureFailureScreenshot(testName: string, error: Error): Promise<string> {
    const fileName = `FAILURE-${testName}-${Date.now()}.png`;
    const filePath = path.join(this.screenshotPath, 'failures', fileName);
    
    this.ensureDirectoryExists(path.dirname(filePath));
    
    await this.page.screenshot({
      path: filePath,
      fullPage: true,
    });
    
    console.log(`Failure screenshot saved: ${filePath}`);
    console.log(`Error: ${error.message}`);
    
    return filePath;
  }

  /**
   * Take screenshot with custom options
   */
  async takeCustomScreenshot(options: {
    name: string;
    clip?: { x: number; y: number; width: number; height: number };
    fullPage?: boolean;
    omitBackground?: boolean;
    quality?: number;
  }): Promise<string> {
    const fileName = `${options.name}-${Date.now()}.png`;
    const filePath = path.join(this.screenshotPath, fileName);
    
    await this.page.screenshot({
      path: filePath,
      clip: options.clip,
      fullPage: options.fullPage || false,
      omitBackground: options.omitBackground || false,
      quality: options.quality || TEST_CONFIG.SCREENSHOT_QUALITY,
    });
    
    return filePath;
  }

  /**
   * Create baseline screenshots for visual regression testing
   */
  async createBaseline(name: string): Promise<void> {
    const baselinePath = path.join(this.screenshotPath, 'baselines');
    this.ensureDirectoryExists(baselinePath);
    
    const fileName = `${name}-baseline.png`;
    const filePath = path.join(baselinePath, fileName);
    
    await this.page.screenshot({
      path: filePath,
      fullPage: true,
      quality: TEST_CONFIG.SCREENSHOT_QUALITY,
    });
    
    console.log(`Baseline screenshot created: ${filePath}`);
  }

  /**
   * Wait for element to be stable before screenshot
   */
  async waitForStableElement(locator: Locator, timeout: number = 5000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
    
    // Wait for animations to complete
    await this.page.waitForTimeout(500);
    
    // Ensure element is stable (not moving)
    const box1 = await locator.boundingBox();
    await this.page.waitForTimeout(100);
    const box2 = await locator.boundingBox();
    
    if (box1 && box2) {
      if (box1.x !== box2.x || box1.y !== box2.y) {
        // Element is still moving, wait a bit more
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Mask dynamic content before screenshot
   */
  async maskDynamicContent(selectors: string[]): Promise<void> {
    for (const selector of selectors) {
      await this.page.addStyleTag({
        content: `${selector} { visibility: hidden !important; }`
      });
    }
  }

  /**
   * Clean up old screenshots
   */
  async cleanupOldScreenshots(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    if (fs.existsSync(this.screenshotPath)) {
      const files = fs.readdirSync(this.screenshotPath);
      
      for (const file of files) {
        const filePath = path.join(this.screenshotPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old screenshot: ${file}`);
        }
      }
    }
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}