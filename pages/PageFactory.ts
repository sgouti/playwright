import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';

/**
 * Page Factory for creating page objects
 * Implements the Factory pattern for page object instantiation
 */
export class PageFactory {
  private page: Page;
  private pageCache: Map<string, BasePage> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get LoginPage instance
   */
  getLoginPage(): LoginPage {
    const cacheKey = 'login';
    
    if (!this.pageCache.has(cacheKey)) {
      this.pageCache.set(cacheKey, new LoginPage(this.page));
    }
    
    return this.pageCache.get(cacheKey) as LoginPage;
  }

  /**
   * Get DashboardPage instance
   */
  getDashboardPage(): DashboardPage {
    const cacheKey = 'dashboard';
    
    if (!this.pageCache.has(cacheKey)) {
      this.pageCache.set(cacheKey, new DashboardPage(this.page));
    }
    
    return this.pageCache.get(cacheKey) as DashboardPage;
  }

  /**
   * Create page instance by name
   */
  createPage<T extends BasePage>(pageName: string): T {
    switch (pageName.toLowerCase()) {
      case 'login':
        return this.getLoginPage() as T;
      case 'dashboard':
        return this.getDashboardPage() as T;
      default:
        throw new Error(`Unknown page: ${pageName}`);
    }
  }

  /**
   * Get page instance by URL pattern
   */
  getPageByUrl(url: string): BasePage {
    if (url.includes('/login') || url.includes('/auth')) {
      return this.getLoginPage();
    } else if (url.includes('/dashboard') || url.includes('/home')) {
      return this.getDashboardPage();
    } else {
      throw new Error(`No page object found for URL: ${url}`);
    }
  }

  /**
   * Clear page cache
   */
  clearCache(): void {
    this.pageCache.clear();
  }

  /**
   * Get all cached pages
   */
  getCachedPages(): Map<string, BasePage> {
    return new Map(this.pageCache);
  }

  /**
   * Check if page is cached
   */
  isPageCached(pageName: string): boolean {
    return this.pageCache.has(pageName.toLowerCase());
  }

  /**
   * Remove page from cache
   */
  removePage(pageName: string): boolean {
    return this.pageCache.delete(pageName.toLowerCase());
  }
}

/**
 * Page registry for dynamic page creation
 */
export class PageRegistry {
  private static pageConstructors: Map<string, new (page: Page) => BasePage> = new Map();

  /**
   * Register a page class
   */
  static registerPage(name: string, pageClass: new (page: Page) => BasePage): void {
    this.pageConstructors.set(name.toLowerCase(), pageClass);
  }

  /**
   * Create page instance by registered name
   */
  static createPage<T extends BasePage>(name: string, page: Page): T {
    const PageClass = this.pageConstructors.get(name.toLowerCase());
    
    if (!PageClass) {
      throw new Error(`Page '${name}' is not registered`);
    }
    
    return new PageClass(page) as T;
  }

  /**
   * Get all registered page names
   */
  static getRegisteredPages(): string[] {
    return Array.from(this.pageConstructors.keys());
  }

  /**
   * Check if page is registered
   */
  static isPageRegistered(name: string): boolean {
    return this.pageConstructors.has(name.toLowerCase());
  }

  /**
   * Unregister a page
   */
  static unregisterPage(name: string): boolean {
    return this.pageConstructors.delete(name.toLowerCase());
  }

  /**
   * Clear all registered pages
   */
  static clearRegistry(): void {
    this.pageConstructors.clear();
  }
}

// Register default pages
PageRegistry.registerPage('login', LoginPage);
PageRegistry.registerPage('dashboard', DashboardPage);

/**
 * Utility functions for page management
 */
export class PageUtils {
  /**
   * Wait for page to navigate and return appropriate page object
   */
  static async waitForPageNavigation(page: Page, factory: PageFactory): Promise<BasePage> {
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    return factory.getPageByUrl(currentUrl);
  }

  /**
   * Navigate to page and return page object
   */
  static async navigateToPage<T extends BasePage>(
    page: Page, 
    factory: PageFactory, 
    pageName: string
  ): Promise<T> {
    const pageObject = factory.createPage<T>(pageName);
    await pageObject.navigate();
    return pageObject;
  }

  /**
   * Validate current page matches expected page type
   */
  static async validateCurrentPage(page: Page, expectedPageClass: new (page: Page) => BasePage): Promise<boolean> {
    const pageInstance = new expectedPageClass(page);
    return await pageInstance.isPageLoaded();
  }

  /**
   * Get page title and validate it matches expected pattern
   */
  static async validatePageTitle(page: Page, expectedTitlePattern: string | RegExp): Promise<boolean> {
    const title = await page.title();
    
    if (typeof expectedTitlePattern === 'string') {
      return title.includes(expectedTitlePattern);
    } else {
      return expectedTitlePattern.test(title);
    }
  }

  /**
   * Take screenshot with page-specific naming
   */
  static async takePageScreenshot(pageObject: BasePage, testName: string): Promise<string> {
    const pageName = pageObject.constructor.name.replace('Page', '').toLowerCase();
    const screenshotName = `${testName}-${pageName}`;
    return await pageObject.takeScreenshot(screenshotName);
  }
}

/**
 * Page object builder for complex page initialization
 */
export class PageBuilder {
  private page: Page;
  private factory: PageFactory;

  constructor(page: Page) {
    this.page = page;
    this.factory = new PageFactory(page);
  }

  /**
   * Build login flow
   */
  async buildLoginFlow(): Promise<{ loginPage: LoginPage; dashboardPage: DashboardPage }> {
    const loginPage = this.factory.getLoginPage();
    const dashboardPage = this.factory.getDashboardPage();
    
    return { loginPage, dashboardPage };
  }

  /**
   * Build authenticated session
   */
  async buildAuthenticatedSession(userType: 'admin' | 'user' | 'guest' = 'user'): Promise<DashboardPage> {
    const loginPage = this.factory.getLoginPage();
    await loginPage.navigate();
    await loginPage.loginAsTestUser(userType);
    await loginPage.waitForLoginComplete();
    
    return this.factory.getDashboardPage();
  }

  /**
   * Build page with custom validation
   */
  async buildPageWithValidation<T extends BasePage>(
    pageName: string,
    validationFn?: (page: T) => Promise<void>
  ): Promise<T> {
    const pageObject = this.factory.createPage<T>(pageName);
    await pageObject.navigate();
    
    if (validationFn) {
      await validationFn(pageObject);
    }
    
    return pageObject;
  }

  /**
   * Get factory instance
   */
  getFactory(): PageFactory {
    return this.factory;
  }
}