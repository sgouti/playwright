/// <reference lib="dom" />
import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage – Test-support layer only.
 *  browser-level helpers (context, route, permissions, cookies, viewport, etc.).
 * No page-level workflows (click, fill, etc.).
 * Only low-level, reusable helpers that tests or page-models can call.
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /* ---------- Screenshots ---------- */

  async compareScreenshot(name: string, options?: {
    threshold?: number;
    maxDiffPixels?: number;
    fullPage?: boolean;
  }) {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      threshold: options?.threshold ?? 0.2,
      maxDiffPixels: options?.maxDiffPixels ?? 100,
      fullPage: options?.fullPage ?? true,
    });
  }

  /* ---------- File handling ---------- */

  async uploadFile(fileInput: Locator, filePath: string | string[]) {
    await fileInput.setInputFiles(filePath);
  }

  async downloadFile(startDownload: () => Promise<void>) {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      startDownload(),
    ]);
    return download;
  }

  /* ---------- Network ---------- */

  async waitForNetworkIdle(timeout = 30_000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  async waitForApiResponse(urlPattern: string | RegExp, timeout = 30_000) {
    return this.page.waitForResponse(
      (res) =>
        typeof urlPattern === 'string'
          ? res.url().includes(urlPattern)
          : urlPattern.test(res.url()),
      { timeout }
    );
  }

  /* ---------- Page state ---------- */

  async waitForPageStable() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  /* ---------- Dialogs ---------- */

  async handleDialog(accept = true, promptText?: string) {
    this.page.once('dialog', async (dialog) => {
      if (accept) {
        await (promptText ? dialog.accept(promptText) : dialog.accept());
      } else {
        await dialog.dismiss();
      }
    });
  }

  /* ---------- Runtime scripting ---------- */

  async executeScript<T>(fn: string | (() => T), ...args: any[]): Promise<T> {
    return this.page.evaluate(fn as any, ...args);
  }

  /* ---------- Storage ---------- */

  async clearBrowserStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  async setLocalStorage(key: string, value: string) {
    await this.page.evaluate(
      ({ k, v }) => window.localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  async getLocalStorage(key: string): Promise<string | null> {
    return this.page.evaluate((k) => window.localStorage.getItem(k), key);
  }

}