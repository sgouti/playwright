import { test as base, Page, BrowserContext } from '@playwright/test';
import { PageFactory, PageBuilder } from '@pages/PageFactory';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { DatabaseUtils, getDatabase } from '@utils/DatabaseUtils';
import { ApiUtils, createApiUtils } from '@utils/ApiUtils';
import { ScreenshotUtils } from '@utils/ScreenshotUtils';
import { ValidationUtils } from '@utils/ValidationUtils';
import { getStorageStatePath, getAuthToken } from '@global-setup/global-setup';
import { TEST_CONFIG } from '@config/test.config';

/**
 * Extended test fixtures with custom utilities and page objects
 */
export interface TestFixtures {
  // Page Objects
  pageFactory: PageFactory;
  pageBuilder: PageBuilder;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  
  // Utilities
  apiUtils: ApiUtils;
  dbUtils: DatabaseUtils;
  screenshotUtils: ScreenshotUtils;
  validationUtils: ValidationUtils;
  
  // Authentication
  authenticatedContext: BrowserContext;
  adminContext: BrowserContext;
  userContext: BrowserContext;
  
  // Test Data
  testData: any;
  
  // Custom Actions
  loginAsUser: (userType?: 'admin' | 'user' | 'guest') => Promise<void>;
  takeTestScreenshot: (name: string) => Promise<string>;
}

/**
 * Worker-scoped fixtures (shared across tests in the same worker)
 */
export interface WorkerFixtures {
  // Database connection (shared across tests)
  sharedDatabase: DatabaseUtils;
  
  // API client (shared across tests)
  sharedApiUtils: ApiUtils;
}

/**
 * Extend Playwright test with custom fixtures
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker-scoped fixtures
  sharedDatabase: [async ({}, use) => {
    const db = await getDatabase();
    await use(db);
    // Database cleanup is handled in global teardown
  }, { scope: 'worker' }],

  sharedApiUtils: [async ({ request }, use) => {
    const apiUtils = await createApiUtils(request);
    await use(apiUtils);
    await apiUtils.dispose();
  }, { scope: 'worker' }],

  // Test-scoped fixtures
  pageFactory: async ({ page }, use) => {
    const factory = new PageFactory(page);
    await use(factory);
    factory.clearCache();
  },

  pageBuilder: async ({ page }, use) => {
    const builder = new PageBuilder(page);
    await use(builder);
  },

  loginPage: async ({ pageFactory }, use) => {
    const loginPage = pageFactory.getLoginPage();
    await use(loginPage);
  },

  dashboardPage: async ({ pageFactory }, use) => {
    const dashboardPage = pageFactory.getDashboardPage();
    await use(dashboardPage);
  },

  apiUtils: async ({ request }, use) => {
    const apiUtils = await createApiUtils(request);
    await use(apiUtils);
    await apiUtils.dispose();
  },

  dbUtils: async ({ sharedDatabase }, use) => {
    // Each test gets a fresh database state
    await sharedDatabase.cleanup();
    await use(sharedDatabase);
  },

  screenshotUtils: async ({ page }, use) => {
    const screenshotUtils = new ScreenshotUtils(page);
    await use(screenshotUtils);
  },

  validationUtils: async ({ page }, use) => {
    const validationUtils = new ValidationUtils(page);
    await use(validationUtils);
  },

  authenticatedContext: async ({ browser }, use) => {
    const storageStatePath = getStorageStatePath();
    const context = await browser.newContext({
      storageState: storageStatePath,
    });
    await use(context);
    await context.close();
  },

  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    
    // Set admin authentication
    await context.addInitScript(() => {
      localStorage.setItem('authToken', 'admin_token');
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('isAuthenticated', 'true');
    });
    
    await use(context);
    await context.close();
  },

  userContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    
    // Set user authentication
    await context.addInitScript(() => {
      localStorage.setItem('authToken', 'user_token');
      localStorage.setItem('userRole', 'user');
      localStorage.setItem('isAuthenticated', 'true');
    });
    
    await use(context);
    await context.close();
  },

  testData: async ({}, use) => {
    // Load test data from files
    const testData = {
      users: TEST_CONFIG.TEST_USERS,
      endpoints: TEST_CONFIG.ENDPOINTS,
      // Add more test data as needed
    };
    await use(testData);
  },

  loginAsUser: async ({ loginPage }, use) => {
    const loginAsUser = async (userType: 'admin' | 'user' | 'guest' = 'user') => {
      await loginPage.navigate();
      await loginPage.loginAsTestUser(userType);
      await loginPage.waitForLoginComplete();
    };
    await use(loginAsUser);
  },

  takeTestScreenshot: async ({ screenshotUtils }, use) => {
    const takeTestScreenshot = async (name: string) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotName = `${name}-${timestamp}`;
      return await screenshotUtils.takeFullPageScreenshot(screenshotName);
    };
    await use(takeTestScreenshot);
  },
});

/**
 * Custom test with database setup
 */
export const dbTest = test.extend<{ setupDatabase: void }>({
  setupDatabase: [async ({ dbUtils }, use) => {
    // Setup specific test data for database tests
    await dbUtils.seedTestData('test_users', [
      { id: 1, name: 'Test User 1', email: 'test1@example.com' },
      { id: 2, name: 'Test User 2', email: 'test2@example.com' },
    ]);
    
    await use();
    
    // Cleanup after test
    await dbUtils.clearTable('test_users');
  }, { auto: true }],
});

/**
 * Custom test with API setup
 */
export const apiTest = test.extend<{ setupApi: void }>({
  setupApi: [async ({ apiUtils }, use) => {
    // Setup API authentication
    const token = getAuthToken('admin');
    if (token) {
      apiUtils.setAuthToken(token);
    }
    
    await use();
    
    // Cleanup API state
    apiUtils.removeAuthToken();
  }, { auto: true }],
});

/**
 * Custom test for authenticated scenarios
 */
export const authenticatedTest = test.extend<{ 
  authenticatedPage: Page;
  userRole: string;
}>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: getStorageStatePath(),
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  userRole: async ({ authenticatedPage }, use) => {
    const role = await authenticatedPage.evaluate(() => 
      localStorage.getItem('userRole') || 'user'
    );
    await use(role);
  },
});

/**
 * Custom test for performance testing
 */
export const performanceTest = test.extend<{ 
  performanceMetrics: any;
  startPerformanceMonitoring: () => Promise<void>;
  stopPerformanceMonitoring: () => Promise<any>;
}>({
  performanceMetrics: async ({}, use) => {
    let metrics: any = {};
    await use(metrics);
  },

  startPerformanceMonitoring: async ({ page, performanceMetrics }, use) => {
    const startMonitoring = async () => {
      await page.addInitScript(() => {
        (window as any).performanceStartTime = performance.now();
      });
    };
    await use(startMonitoring);
  },

  stopPerformanceMonitoring: async ({ page }, use) => {
    const stopMonitoring = async () => {
      return await page.evaluate(() => {
        const endTime = performance.now();
        const startTime = (window as any).performanceStartTime || endTime;
        
        return {
          loadTime: endTime - startTime,
          navigation: performance.getEntriesByType('navigation')[0],
          resources: performance.getEntriesByType('resource'),
          marks: performance.getEntriesByType('mark'),
          measures: performance.getEntriesByType('measure'),
        };
      });
    };
    await use(stopMonitoring);
  },
});

/**
 * Custom test for visual regression testing
 */
export const visualTest = test.extend<{ 
  compareScreenshot: (name: string, options?: any) => Promise<void>;
}>({
  compareScreenshot: async ({ page }, use) => {
    const compareScreenshot = async (name: string, options?: any) => {
      // Wait for page to be stable
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Allow animations to complete
      
      // Take screenshot and compare with baseline
      await test.expect(page).toHaveScreenshot(`${name}.png`, {
        threshold: options?.threshold || 0.2,
        maxDiffPixels: options?.maxDiffPixels || 100,
        ...options,
      });
    };
    await use(compareScreenshot);
  },
});

/**
 * Custom test for mobile testing
 */
export const mobileTest = test.extend<{ 
  mobileContext: BrowserContext;
  mobilePage: Page;
}>({
  mobileContext: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      isMobile: true,
      hasTouch: true,
    });
    await use(context);
    await context.close();
  },

  mobilePage: async ({ mobileContext }, use) => {
    const page = await mobileContext.newPage();
    await use(page);
  },
});

/**
 * Export expect for consistency
 */
export { expect } from '@playwright/test';