import { defineConfig, devices } from '@playwright/test';
import { config } from 'config/env.config';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: config.baseUrl,
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for all actions */
    actionTimeout: config.timeout,
    
    /* Global timeout for navigation */
    navigationTimeout: config.timeout,
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./global-setup/global-setup.ts'),
  globalTeardown: require.resolve('./global-setup/global-teardown.ts'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testDir: './tests/ui',
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
      testDir: './tests/ui',
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
      testDir: './tests/ui',
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testDir: './tests/ui',
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testDir: './tests/ui',
    },

    /* API Tests - run on single browser */
    {
      name: 'api-tests',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/api',
      testMatch: '**/*.api.spec.ts',
    },

    /* Database Tests - run on single browser */
    {
      name: 'database-tests',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/db',
      testMatch: '**/*.db.spec.ts',
    },

    /* Performance Tests - run on single browser */
    {
      name: 'performance-tests',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/performance',
      testMatch: '**/*.perf.spec.ts',
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});