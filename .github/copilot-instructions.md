# Playwright Testing Project

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Initial Setup - REQUIRED STEPS
- Install dependencies: `npm install` -- takes ~3 seconds
- Install system dependencies: `npx playwright install-deps` -- takes ~150 seconds (2.5 minutes). NEVER CANCEL.
- **CRITICAL**: Browser installation fails with "Download failed: size mismatch" error. Use system Chrome instead.
- Verify setup: `npx tsc --noEmit` -- takes ~2 seconds
- Check Node.js version: Requires Node.js 20+ (v20.19.5 confirmed working)

### Browser Setup - IMPORTANT LIMITATION
- **CANNOT use**: `npx playwright install` -- consistently fails with download size mismatch error
- **MUST use**: System Chrome with `channel: 'chrome'` configuration
- System Chrome location: `/usr/bin/google-chrome-stable`
- **ALWAYS run tests in headless mode** -- no display server available

### Running Tests 
- Run all tests: `npm test` -- fails without downloaded browsers
- **WORKING SOLUTION**: Use custom config with system Chrome:
  ```typescript
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Use system Chrome
        headless: true,    // REQUIRED - no display
        ignoreHTTPSErrors: true,
        launchOptions: {
          args: ['--ignore-certificate-errors', '--ignore-ssl-errors']
        }
      },
    }
  ]
  ```
- Run single test: `npx playwright test [testfile] --config=[custom-config]`
- TypeScript compilation check: `npx tsc --noEmit` -- takes ~2 seconds

### Report Generation
- Generate HTML report: `npm run report` -- starts server on localhost:9323
- **WARNING**: Report server runs indefinitely, use Ctrl+C to stop

## Validation
- **ALWAYS validate browser setup** before running tests by creating a simple local HTML test
- **CANNOT test external sites** reliably due to SSL/network issues in environment
- **ALWAYS test with local files** or mock data for reliable validation
- Tests using SauceDemo (https://www.saucedemo.com/) may timeout or fail with SSL errors
- **TypeScript validation works**: Run `npx tsc --noEmit` before making changes

## Common Tasks

### Project Structure
```
playwright/
├── tests/
│   ├── ui/                  # UI tests (login.ui.spec.ts)
│   ├── saucedemo.spec.ts    # Sample tests
│   └── simple-test.spec.ts  # Local test example
├── pages/                   # Page Object Model
│   ├── BasePage.ts         # Base page utilities  
│   ├── LoginPage.ts        # Login page implementation
│   └── homepage.ts         # Home page implementation
├── config/                 # Configuration files
│   ├── env.config.ts       # Environment configuration
│   └── test.config.ts      # Test constants
├── utils/                  # Utility functions
│   ├── helper.ts           # Helper functions
│   └── ScreenshotUtils.ts  # Screenshot utilities
├── data/                   # Test data
│   └── testdata.csv        # CSV test data for data-driven tests
├── playwright.config.ts    # Main Playwright configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

### NPM Scripts Available
```bash
npm test                    # Run all tests (requires browsers)
npm run test:ui            # Run UI tests only (requires browsers)
npm run test:api           # Run API tests (requires browsers)
npm run test:headed        # Run in headed mode (requires browsers + display)
npm run test:debug         # Run in debug mode (requires browsers)
npm run test:staging       # Run with staging environment
npm run test:prod          # Run with production environment
npm run install:browsers   # Install Playwright browsers (FAILS)
npm run report             # Show HTML report (starts server)
npm run setup              # Full setup (FAILS due to browser install)
```

### Environment Configuration
- **Development** (default): SauceDemo website
- **Staging**: Custom staging environment  
- **Production**: Custom production environment
- Configuration file: `config/env.config.ts`
- Environment override: Set `TEST_ENV=staging` or `TEST_ENV=prod`

### Key Features
- **Page Object Model**: Tests use page objects in `/pages` directory
- **Data-driven testing**: Uses CSV files in `/data` directory
- **Multi-environment**: Supports dev/staging/prod environments
- **TypeScript**: Full TypeScript support with path aliases
- **Authentication**: Global auth setup (currently commented out)
- **Parallel execution**: Configurable workers for CI/CD

### Working Example - Reliable Test Pattern
```typescript
import { test, expect } from '@playwright/test';

test('reliable local test', async ({ page }) => {
  // Create local HTML for testing
  const html = `
    <!DOCTYPE html>
    <html><body>
      <h1>Test Page</h1>
      <input id="username" placeholder="Username" />
      <button id="submit">Submit</button>
    </body></html>
  `;
  await page.setContent(html);
  
  // Interact with elements
  await page.fill('#username', 'testuser');
  await page.click('#submit');
  
  // Assert results
  await expect(page.locator('h1')).toHaveText('Test Page');
});
```

### Troubleshooting
- **Browser install fails**: Use system Chrome with `channel: 'chrome'`
- **Tests timeout**: Network issues with external sites, use local tests
- **Display errors**: Ensure `headless: true` in configuration
- **SSL errors**: Add `ignoreHTTPSErrors: true` and SSL bypass args
- **TypeScript errors**: Run `npx tsc --noEmit` to check compilation

### Critical Timeouts and Warnings
- **npm install**: ~3 seconds - safe to use
- **npx playwright install-deps**: ~150 seconds (2.5 minutes) - NEVER CANCEL
- **npx playwright install**: ALWAYS FAILS - do not use
- **npx tsc --noEmit**: ~2 seconds - safe to use  
- **Test execution**: Varies by test complexity, 30-60 seconds typical

### Development Workflow
1. Always run `npm install` first
2. Install system deps with `npx playwright install-deps` (wait 2.5 min)
3. Verify TypeScript: `npx tsc --noEmit`
4. Create custom config for system Chrome if testing
5. Write tests using Page Object Model pattern
6. Test locally with simple HTML before external sites
7. Validate changes with TypeScript compilation

### Files to Check After Changes
- **Always check**: TypeScript compilation with `npx tsc --noEmit`
- **Page objects**: When modifying `pages/` directory
- **Config files**: When changing environment or test settings
- **Test data**: When modifying CSV files in `data/` directory