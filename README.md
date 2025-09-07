# Playwright Sample Project

A simple Playwright sample project for beginners demonstrating basic UI and API testing with TypeScript and Page Object Model pattern.

## 🚀 Features

- **Page Object Model (POM)** - Simple, clean page abstractions
- **Multi-browser Testing** - Chrome, Firefox, Safari
- **API Testing** - Basic API testing examples
- **TypeScript** - Full type safety and IDE support
- **Simple Structure** - Easy to understand for beginners

## 📁 Project Structure

```
playwright-sample-project/
├── tests/                   # Test files
│   ├── ui/                 # UI tests
│   │   └── login.ui.spec.ts
│   └── api/                # API tests
│       └── users.api.spec.ts
├── pages/                  # Page Object Model classes
│   └── LoginPage.ts       # Login page implementation
├── docs/                   # Documentation
└── playwright.config.ts    # Playwright configuration
```

## 🛠️ Getting Started

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm 8+** or **yarn 1.22+**
- **Git** for version control
- **VS Code** (recommended) with Playwright extension

### System Requirements

- **Windows**: Windows 10/11, PowerShell 5.1+
- **macOS**: macOS 10.15+
- **Linux**: Ubuntu 18.04+, CentOS 7+

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd playwright-sample-project
   ```

2. **Install dependencies:**
   ```bash
   # Using npm
   npm install
   
   # Using yarn
   yarn install
   ```

3. **Install Playwright browsers:**
   ```bash
   # Install all browsers
   npm run install:browsers
   
   # Or install specific browsers
   npx playwright install chromium firefox webkit
   ```

4. **Verify installation:**
   ```bash
   # Run a quick test to verify setup
   npx playwright test --reporter=list tests/ui/login.ui.spec.ts
   ```

5. **Set up environment configuration:**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your specific configuration
   # Available on Windows, macOS, and Linux
   ```

### IDE Setup (VS Code)

1. **Install recommended extensions:**
   - Playwright Test for VS Code
   - TypeScript and JavaScript Language Features
   - ESLint (if using)

2. **Configure VS Code settings:**
   ```json
   {
     "playwright.reuseBrowser": true,
     "playwright.showTrace": true,
     "typescript.preferences.importModuleSpecifier": "relative"
   }
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:ui          # UI tests only
npm run test:api         # API tests only

# Run with different options
npm run test:headed      # Run in headed mode
npm run test:debug       # Run in debug mode
npm run test:report      # Show HTML report
```

### Configuration

The base URL is configured in `playwright.config.ts`:

```typescript
use: {
  baseURL: 'http://localhost:3000',
}
```

## 🧪 Test Examples

### UI Test with Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navigate();
  await loginPage.login('admin@example.com', 'admin123');
  
  // Verify successful login
  await expect(page).toHaveURL(/dashboard|home/);
});
```

### Using BasePage Test-Support Utilities

```typescript
test('visual regression test', async ({ page }) => {
  const basePage = new BasePage(page);
  const loginPage = new LoginPage(page);
  
  // Navigate with specific wait condition
  await basePage.navigate('/login', 'networkidle');
  await basePage.waitForPageStable();
  
  // Compare screenshot for visual testing
  await basePage.compareScreenshot('login-page', { fullPage: true });
  
  // Perform login (page-specific action)
  await loginPage.login('admin@example.com', 'admin123');
  
  // Compare after login
  await basePage.compareScreenshot('dashboard-after-login');
});

test('API mocking test', async ({ page }) => {
  const basePage = new BasePage(page);
  const loginPage = new LoginPage(page);
  
  // Mock login API response
  await basePage.mockApiResponse('/api/login', { 
    success: true, 
    token: 'mock-token' 
  });
  
  await basePage.navigate('/login');
  await loginPage.login('admin@example.com', 'admin123');
  
  // Wait for mocked API response
  await basePage.waitForApiResponse('/api/login');
});

test('performance monitoring test', async ({ page }) => {
  const basePage = new BasePage(page);
  const loginPage = new LoginPage(page);
  
  await basePage.navigate('/login');
  await loginPage.login('admin@example.com', 'admin123');
  
  // Get performance metrics
  const metrics = await basePage.getPerformanceMetrics();
  expect(metrics.loadTime).toBeLessThan(3000);
  expect(metrics.firstContentfulPaint).toBeLessThan(1500);
});

test('browser storage test', async ({ page }) => {
  const basePage = new BasePage(page);
  const loginPage = new LoginPage(page);
  
  // Set up test data in localStorage
  await basePage.navigate('/login');
  await basePage.setLocalStorage('testMode', 'true');
  
  await loginPage.login('admin@example.com', 'admin123');
  
  // Verify storage after login
  const authToken = await basePage.getLocalStorage('authToken');
  expect(authToken).toBeTruthy();
  
  // Clean up
  await basePage.clearBrowserStorage();
});

test('file operations test', async ({ page }) => {
  const basePage = new BasePage(page);
  
  await basePage.navigate('/profile');
  
  // Upload file using test-support utility
  const fileInput = page.locator('input[type="file"]');
  await basePage.uploadFile(fileInput, 'test-files/avatar.jpg');
  
  // Download file using test-support utility
  const download = await basePage.downloadFile(async () => {
    await page.click('text=Export Data');
  });
  
  expect(download.suggestedFilename()).toBe('user-data.csv');
});
```

### Page-Specific Actions (in LoginPage)

```typescript
// These actions belong in page classes, not BasePage
await loginPage.fillUsername('admin@example.com');
await loginPage.fillPassword('admin123');
await loginPage.clickLogin();
await loginPage.login('admin@example.com', 'admin123');

// Direct Playwright methods for page-specific actions
await loginPage.usernameInput.fill('username');
await loginPage.loginButton.click();
await loginPage.errorMessage.isVisible();
```

### API Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should login via API', async ({ request }) => {
  const response = await request.post('/api/login', {
    data: {
      username: 'admin@example.com',
      password: 'admin123'
    }
  });
  
  expect(response.status()).toBe(200);
});
```

## 🔧 Configuration

### Playwright Configuration

The main configuration supports:
- Multiple browsers (Chrome, Firefox, Safari)
- Parallel execution
- Automatic retries
- Screenshot/video capture on failure
- HTML reporting

## 📊 Reporting

Tests generate HTML reports:
- **HTML Report** - Interactive test results (`npm run test:report`)
- **Screenshots** - Failure captures
- **Videos** - Test execution recordings

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🔍 Best Practices

### Page Object Model (POM)

**Structure and Organization:**
```typescript
// ✅ Good: Extend BasePage for common functionality
export class LoginPage extends BasePage {
  private readonly usernameInput = this.page.locator('[data-testid="username"]');
  private readonly passwordInput = this.page.locator('[data-testid="password"]');
  
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.clickSubmit();
  }
}

// ❌ Avoid: Direct page interactions in tests
test('login', async ({ page }) => {
  await page.fill('#username', 'user'); // Don't do this
});
```

**Locator Best Practices:**
- **Prefer data-testid:** `[data-testid="submit-button"]`
- **Use semantic selectors:** `role=button[name="Submit"]`
- **Avoid CSS selectors:** `.btn-primary` (fragile)
- **Chain locators:** `page.locator('.form').locator('button')`

**Page Validation:**
```typescript
async validatePageLoaded(): Promise<void> {
  await expect(this.page).toHaveTitle(/Dashboard/);
  await expect(this.headerElement).toBeVisible();
  await this.waitForNetworkIdle();
}
```

### Test Organization and Structure

**Test Grouping:**
```typescript
describe('User Authentication', () => {
  describe('Valid Credentials', () => {
    test('should login with admin user', async ({ loginPage }) => {
      // Test implementation
    });
    
    test('should login with regular user', async ({ loginPage }) => {
      // Test implementation
    });
  });
  
  describe('Invalid Credentials', () => {
    test('should show error for wrong password', async ({ loginPage }) => {
      // Test implementation
    });
  });
});
```

**Setup and Cleanup:**
```typescript
describe('Dashboard Tests', () => {
  let testUser: TestUser;
  
  beforeAll(async () => {
    // Create test data once for all tests
    testUser = await UserFactory.createTestUser();
  });
  
  afterAll(async () => {
    // Cleanup test data
    await UserFactory.deleteTestUser(testUser.id);
  });
  
  beforeEach(async ({ loginPage }) => {
    // Login before each test
    await loginPage.loginAs(testUser);
  });
});
```

### Data Management

**Test Data Organization:**
```typescript
// ✅ Good: Use data files and factories
const testUsers = await DataUtils.loadJsonData('users.json');
const dynamicUser = UserFactory.create({ role: 'admin' });

// ❌ Avoid: Hardcoded data in tests
const user = { username: 'testuser123', password: 'password123' };
```

**Data-Driven Testing:**
```typescript
// Load test data
const loginScenarios = await DataUtils.loadCsvData('login-scenarios.csv');

// Generate tests dynamically
for (const scenario of loginScenarios) {
  test(`Login: ${scenario.description}`, async ({ loginPage }) => {
    await loginPage.login(scenario.username, scenario.password);
    
    if (scenario.shouldSucceed) {
      await expect(loginPage.page).toHaveURL(/dashboard/);
    } else {
      await expect(loginPage.errorMessage).toBeVisible();
    }
  });
}
```

### Error Handling and Resilience

**Retry Strategies:**
```typescript
// Configure retries in playwright.config.ts
retries: process.env.CI ? 2 : 0,

// Custom retry logic
await expect(async () => {
  const response = await apiUtils.get('/health');
  expect(response.status).toBe(200);
}).toPass({ timeout: 30000 });
```

**Graceful Degradation:**
```typescript
async takeScreenshotOnFailure(testInfo: TestInfo): Promise<void> {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await this.page.screenshot();
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
}
```

### Performance Optimization

**Parallel Execution:**
```typescript
// Configure workers
workers: process.env.CI ? 4 : undefined,

// Use test.describe.configure for specific tests
test.describe.configure({ mode: 'parallel' });
```

**Resource Management:**
```typescript
// Reuse browser contexts
test.describe('API Tests', () => {
  let apiContext: APIRequestContext;
  
  beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: process.env.API_URL,
    });
  });
  
  afterAll(async () => {
    await apiContext.dispose();
  });
});
```

### Accessibility Testing

**Basic Accessibility Checks:**
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/dashboard');
  await injectAxe(page);
  await checkA11y(page);
});
```

### API Testing Best Practices

**Request/Response Validation:**
```typescript
test('should create user', async ({ apiUtils }) => {
  const userData = UserFactory.createUserData();
  
  const response = await apiUtils.post('/users', userData);
  
  // Validate response structure
  expect(response.status).toBe(201);
  expect(response.body).toMatchSchema(userSchema);
  expect(response.body.id).toBeDefined();
  
  // Cleanup
  await apiUtils.delete(`/users/${response.body.id}`);
});
```

### Visual Testing Guidelines

**Screenshot Comparison:**
```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Take full page screenshot
  await expect(page).toHaveScreenshot('dashboard-full.png', {
    fullPage: true,
    threshold: 0.2
  });
  
  // Element-specific screenshot
  await expect(page.locator('.chart')).toHaveScreenshot('chart.png');
});
```

### Security Considerations

**Sensitive Data Handling:**
```typescript
// ✅ Good: Use environment variables
const adminPassword = process.env.ADMIN_PASSWORD;

// ❌ Avoid: Hardcoded credentials
const password = 'admin123'; // Don't do this

// Mask sensitive data in logs
test('login with credentials', async ({ page }) => {
  await page.fill('[data-testid="password"]', process.env.TEST_PASSWORD!, {
    // Mask in trace
    force: true
  });
});
```

### Maintenance and Debugging

**Test Naming Conventions:**
```typescript
// ✅ Good: Descriptive test names
test('should display validation error when email format is invalid');
test('should redirect to dashboard after successful login');

// ❌ Avoid: Vague test names
test('test login');
test('check validation');
```

**Debugging Helpers:**
```typescript
// Add debugging utilities
async debugPause(): Promise<void> {
  if (process.env.DEBUG) {
    await this.page.pause();
  }
}

// Log important actions
async login(username: string, password: string): Promise<void> {
  console.log(`Logging in as: ${username}`);
  await this.usernameInput.fill(username);
  await this.passwordInput.fill(password);
  await this.submitButton.click();
  console.log('Login form submitted');
}

## 🐛 Troubleshooting

### Common Issues

#### Installation Problems

**Node.js version issues:**
```bash
# Check Node.js version
node --version

# Update Node.js to LTS version
# Visit https://nodejs.org or use nvm
nvm install --lts
nvm use --lts
```

**Browser installation fails:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install
npx playwright install --with-deps

# On Linux, install system dependencies
sudo npx playwright install-deps
```

**Permission errors (Linux/macOS):**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Test Execution Issues

**Tests timing out:**
```bash
# Increase timeout in playwright.config.ts
use: { 
  actionTimeout: 60000,
  navigationTimeout: 60000 
}

# Or set timeout per test
test.setTimeout(120000);
```

**Browser crashes or hangs:**
```bash
# Run with different browser
npx playwright test --project=firefox

# Disable GPU acceleration
npx playwright test --browser-args="--disable-gpu"

# Run in headed mode for debugging
npx playwright test --headed --slowMo=1000
```

**Port conflicts:**
```bash
# Check what's using the port
netstat -tulpn | grep :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Change ports in .env file
BASE_URL=http://localhost:3001
API_URL=http://localhost:3002
```

**Memory issues:**
```bash
# Reduce parallel workers
npx playwright test --workers=1

# Or configure in playwright.config.ts
workers: process.env.CI ? 2 : undefined
```

#### Environment Issues

**Environment variables not loading:**
```bash
# Verify .env file exists and has correct format
cat .env  # Linux/macOS
type .env  # Windows

# Check for BOM or encoding issues
file .env  # Should show ASCII text
```

**Database connection issues:**
```bash
# Test database connectivity
npm run test:db -- --grep "connection"

# Check database service status
# Adjust based on your database setup
```

### Debug Mode and Inspection

**Interactive debugging:**
```bash
# Run single test in debug mode
npx playwright test login.ui.spec.ts --debug

# Debug specific line
npx playwright test --debug --grep "should login"
```

**Visual debugging:**
```bash
# Run with browser visible
npx playwright test --headed

# Slow down execution
npx playwright test --headed --slowMo=2000

# Record video of test execution
npx playwright test --video=on
```

**Trace and screenshots:**
```bash
# Generate trace for failed tests
npx playwright test --trace=on-first-retry

# Take screenshots on failure
npx playwright test --screenshot=only-on-failure

# View trace file
npx playwright show-trace trace.zip
```

### Performance Issues

**Slow test execution:**
```bash
# Run tests in parallel
npx playwright test --workers=4

# Skip unnecessary setup
npx playwright test --grep-invert "slow"

# Use faster browser
npx playwright test --project=chromium
```

**Memory leaks:**
```bash
# Monitor memory usage
npx playwright test --reporter=json | jq '.stats'

# Close contexts properly in tests
await context.close();
```

### CI/CD Issues

**GitHub Actions failures:**
```yaml
# Add system dependencies
- name: Install dependencies
  run: |
    sudo apt-get update
    sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev libdrm2-dev

# Increase timeout
- name: Run tests
  run: npx playwright test
  timeout-minutes: 30
```

**Docker issues:**
```dockerfile
# Use official Playwright image
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set proper user permissions
USER pwuser
```

### Getting Help

1. **Check Playwright documentation:** https://playwright.dev/docs/troubleshooting
2. **Search GitHub issues:** https://github.com/microsoft/playwright/issues
3. **Community Discord:** https://discord.gg/playwright-dev
4. **Stack Overflow:** Tag questions with `playwright`

### Logging and Diagnostics

**Enable debug logging:**
```bash
# Set debug environment variable
DEBUG=pw:api npx playwright test

# Verbose logging
npx playwright test --reporter=list --verbose
```

**Generate diagnostic report:**
```bash
# Create detailed test report
npx playwright test --reporter=html,json

# System information
npx playwright --version
node --version
npm --version
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Page Object Model Guide](https://playwright.dev/docs/pom)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details