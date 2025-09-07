# Test Execution Guide

This comprehensive guide covers all aspects of running, debugging, and analyzing Playwright tests in this sample project.

## 🚀 Quick Start

### Basic Test Execution

```bash
# Run all tests
npm test

# Run all tests with npm scripts
npm run test:ui          # UI tests only
npm run test:api         # API tests only
```

### Test Type Examples

```bash
# Run specific test categories
npx playwright test tests/ui/           # All UI tests
npx playwright test tests/api/          # All API tests

# Run specific test files
npx playwright test tests/ui/login.ui.spec.ts
npx playwright test tests/api/users.api.spec.ts
```

## 🎯 Advanced Test Selection

### By Test Name and Pattern

```bash
# Run tests matching pattern
npx playwright test --grep "login"
npx playwright test --grep "should.*successfully"
npx playwright test --grep "@smoke"

# Exclude tests matching pattern
npx playwright test --grep-invert "slow"
npx playwright test --grep-invert "@skip"

# Combine patterns
npx playwright test --grep "login" --grep-invert "slow"
```

### By Tags and Annotations

```bash
# Run tests with specific tags
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@critical"

# Run tests by annotation
npx playwright test --grep "@slow"
npx playwright test --grep "@flaky"
```

### By File and Directory

```bash
# Run specific files
npx playwright test login.ui.spec.ts dashboard.ui.spec.ts

# Run all tests in directory
npx playwright test tests/ui/

# Run tests matching file pattern
npx playwright test "**/*.api.spec.ts"
npx playwright test "tests/**/*login*"
```

## 🌐 Browser and Device Configuration

### Browser Selection

```bash
# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox  
npx playwright test --project=webkit
npx playwright test --project=edge

# Run in multiple browsers
npx playwright test --project=chromium --project=firefox

# List available projects
npx playwright test --list-projects
```

### Device and Viewport Testing

```bash
# Run mobile tests
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"

# Run tablet tests  
npx playwright test --project="iPad"
npx playwright test --project="Galaxy Tab"

# Custom viewport
npx playwright test --config=playwright.mobile.config.ts
```

### Headed vs Headless Mode

```bash
# Run in headed mode (visible browser)
npx playwright test --headed
npm run test:headed

# Run with slow motion for debugging
npx playwright test --headed --slowMo=1000

# Run in headless mode (default)
npx playwright test --headless
```

## 🐛 Debugging and Development

### Interactive Debugging

```bash
# Debug mode (opens Playwright Inspector)
npx playwright test --debug
npm run test:debug

# Debug specific test
npx playwright test login.ui.spec.ts --debug

# Debug from specific line
npx playwright test --debug --grep "should login"
```

### Trace Generation and Analysis

```bash
# Generate trace for all tests
npx playwright test --trace=on

# Generate trace only on failure
npx playwright test --trace=on-first-retry

# Generate trace for retries
npx playwright test --trace=retain-on-failure

# View trace file
npx playwright show-trace trace.zip
npx playwright show-trace test-results/login-ui-spec-login-test/trace.zip
```

### Screenshots and Videos

```bash
# Take screenshots on failure
npx playwright test --screenshot=only-on-failure

# Take screenshots for all tests
npx playwright test --screenshot=on

# Record videos
npx playwright test --video=on
npx playwright test --video=retain-on-failure

# Custom screenshot options
npx playwright test --screenshot=on --video=on --trace=on
```

### Step-by-Step Debugging

```bash
# Pause execution for manual inspection
npx playwright test --headed --debug

# Use page.pause() in tests for breakpoints
# Add this line in your test code:
# await page.pause();
```

## ⚡ Performance and Parallel Execution

### Worker Configuration

```bash
# Run with specific number of workers
npx playwright test --workers=4
npx playwright test --workers=1  # Serial execution

# Run with percentage of CPU cores
npx playwright test --workers=50%

# Disable parallel execution
npx playwright test --workers=1
```

### Sharding for Large Test Suites

```bash
# Split tests across multiple machines
npx playwright test --shard=1/3  # Run 1st third
npx playwright test --shard=2/3  # Run 2nd third  
npx playwright test --shard=3/3  # Run 3rd third

# Useful for CI/CD parallel execution
```

### Timeout Configuration

```bash
# Set global timeout
npx playwright test --timeout=60000

# Set timeout per test
npx playwright test --timeout=30000

# Disable timeout (use with caution)
npx playwright test --timeout=0
```

## 📊 Reporting and Output

### Built-in Reporters

```bash
# HTML reporter (default)
npx playwright test --reporter=html
npm run test:report  # View HTML report

# List reporter (console output)
npx playwright test --reporter=list

# JSON reporter
npx playwright test --reporter=json

# JUnit reporter (for CI/CD)
npx playwright test --reporter=junit

# Multiple reporters
npx playwright test --reporter=list,json,html
```

### Custom Report Configuration

```bash
# Generate reports in specific directory
npx playwright test --reporter=html --output=./custom-reports

# JSON output to file
npx playwright test --reporter=json --output=results.json

# Combine with other options
npx playwright test --reporter=html,junit --headed
```

### Report Analysis

```bash
# Open HTML report
npx playwright show-report

# Open specific report
npx playwright show-report ./playwright-report

# View report from different directory
npx playwright show-report /path/to/report
```

## 🔧 Configuration Options

### Environment Variables

```bash
# Set environment for tests
TEST_ENV=staging npm test
BASE_URL=https://staging.example.com npm test

# Debug environment
DEBUG=pw:api npm test
DEBUG=pw:browser npm test

# Playwright specific
PLAYWRIGHT_BROWSERS_PATH=/custom/path npm test
```

### Configuration Files

```bash
# Use specific config file
npx playwright test --config=playwright.staging.config.ts
npx playwright test --config=playwright.mobile.config.ts

# Override config settings
npx playwright test --config=playwright.config.ts --project=chromium
```

### Global Setup and Teardown

```bash
# Run with global setup
npx playwright test --global-setup=./global-setup/setup.ts

# Run with global teardown  
npx playwright test --global-teardown=./global-setup/teardown.ts

# Both setup and teardown
npx playwright test \
  --global-setup=./global-setup/setup.ts \
  --global-teardown=./global-setup/teardown.ts
```

## 🧪 Test Examples and Patterns

### UI Test Examples

#### Basic UI Test with Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login Functionality', () => {
  test('successful login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    // Navigate to login page
    await loginPage.navigate();
    
    // Perform login
    await loginPage.login('admin@example.com', 'admin123');
    
    // Verify successful login
    await expect(page).toHaveURL(/dashboard|home/);
  });

  test('login failure with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.navigate();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Verify error message appears
    await expect(loginPage.errorMessage).toBeVisible();
  });
});
```

#### Data-Driven UI Test

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const testUsers = await DataUtils.loadJsonData('users.json');

test.describe('Data-Driven Login Tests', () => {
  for (const user of testUsers.validUsers) {
    test(`should login successfully as ${user.role}`, async ({ loginPage, dashboardPage }) => {
      await loginPage.navigate();
      await loginPage.login(user.username, user.password);
      await loginPage.waitForLoginComplete();
      
      await expect(dashboardPage.page).toHaveURL(/dashboard/);
      
      // Role-specific validations
      if (user.role === 'admin') {
        await expect(dashboardPage.adminPanel).toBeVisible();
      }
    });
  }

  for (const user of testUsers.invalidUsers) {
    test(`should reject login for ${user.description}`, async ({ loginPage }) => {
      await loginPage.navigate();
      await loginPage.login(user.username, user.password);
      
      await expect(loginPage.errorMessage).toBeVisible();
      await expect(loginPage.errorMessage).toHaveText(user.expectedError);
    });
  }
});
```

### API Test Examples

#### RESTful API Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('User API Tests', () => {
  test('should create user via POST', async ({ apiUtils }) => {
    const newUser = {
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };

    const response = await apiUtils.post('/users', newUser);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(newUser.username);
    expect(response.body.email).toBe(newUser.email);
    
    // Cleanup
    await apiUtils.delete(`/users/${response.body.id}`);
  });

  test('should retrieve user via GET', async ({ apiUtils }) => {
    // Create test user first
    const createResponse = await apiUtils.post('/users', {
      username: 'getuser',
      email: 'get@example.com'
    });
    
    const userId = createResponse.body.id;
    
    // Retrieve user
    const getResponse = await apiUtils.get(`/users/${userId}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(userId);
    expect(getResponse.body.username).toBe('getuser');
    
    // Cleanup
    await apiUtils.delete(`/users/${userId}`);
  });

  test('should handle API errors gracefully', async ({ apiUtils }) => {
    // Test 404 error
    const response = await apiUtils.get('/users/nonexistent');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
    
    // Test validation error
    const invalidUser = { username: '' }; // Missing required fields
    const createResponse = await apiUtils.post('/users', invalidUser);
    expect(createResponse.status).toBe(400);
    expect(createResponse.body.errors).toBeDefined();
  });
});
```

#### API Authentication Testing

```typescript
test.describe('Authenticated API Tests', () => {
  test('should access protected endpoint with valid token', async ({ apiUtils }) => {
    // Login to get token
    const loginResponse = await apiUtils.post('/auth/login', {
      username: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.body.token;
    
    // Use token for authenticated request
    const response = await apiUtils.get('/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('should reject access without valid token', async ({ apiUtils }) => {
    const response = await apiUtils.get('/admin/users');
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });
});
```

### Database Test Examples

```typescript
import { test, expect } from '@playwright/test';

test.describe('Database Tests', () => {
  test('should connect to database successfully', async ({ dbUtils }) => {
    const isConnected = await dbUtils.testConnection();
    expect(isConnected).toBe(true);
  });

  test('should execute query and return results', async ({ dbUtils }) => {
    const query = 'SELECT COUNT(*) as count FROM users WHERE active = ?';
    const results = await dbUtils.executeQuery(query, [true]);
    
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('count');
  });

  test('should handle database transactions', async ({ dbUtils }) => {
    await dbUtils.beginTransaction();
    
    try {
      // Insert test data
      await dbUtils.executeQuery(
        'INSERT INTO users (username, email) VALUES (?, ?)',
        ['testuser', 'test@example.com']
      );
      
      // Verify insertion
      const results = await dbUtils.executeQuery(
        'SELECT * FROM users WHERE username = ?',
        ['testuser']
      );
      
      expect(results.length).toBe(1);
      expect(results[0].username).toBe('testuser');
      
      // Rollback transaction (cleanup)
      await dbUtils.rollbackTransaction();
    } catch (error) {
      await dbUtils.rollbackTransaction();
      throw error;
    }
  });
});
```

### Performance Test Examples

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page, performanceUtils }) => {
    await performanceUtils.startTracing();
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    const metrics = await performanceUtils.getMetrics();
    
    // Performance assertions
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
    expect(metrics.firstContentfulPaint).toBeLessThan(1500);
    expect(metrics.largestContentfulPaint).toBeLessThan(2500);
    expect(metrics.cumulativeLayoutShift).toBeLessThan(0.1);
  });

  test('should handle concurrent users', async ({ context, performanceUtils }) => {
    const pages = [];
    const loadTimes = [];
    
    // Simulate 5 concurrent users
    for (let i = 0; i < 5; i++) {
      pages.push(await context.newPage());
    }
    
    // Load pages concurrently
    const promises = pages.map(async (page, index) => {
      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      loadTimes.push(loadTime);
    });
    
    await Promise.all(promises);
    
    // Verify all pages loaded within acceptable time
    const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    expect(averageLoadTime).toBeLessThan(5000);
    expect(Math.max(...loadTimes)).toBeLessThan(8000);
    
    // Cleanup
    await Promise.all(pages.map(page => page.close()));
  });
});
```

## 📊 Advanced Reporting and Analysis

### HTML Report Features

```bash
# Generate and open HTML report
npm run test:report

# HTML report includes:
# - Test results with pass/fail status
# - Screenshots and videos for failures
# - Trace files for debugging
# - Performance metrics
# - Test duration and retry information
```

### Custom Reporting

```typescript
// Custom reporter example
class CustomReporter {
  onTestEnd(test, result) {
    if (result.status === 'failed') {
      console.log(`❌ ${test.title} failed in ${result.duration}ms`);
      console.log(`Error: ${result.error.message}`);
    } else {
      console.log(`✅ ${test.title} passed in ${result.duration}ms`);
    }
  }
}
```

### Report Analysis Commands

```bash
# View specific test results
npx playwright show-report --grep "login"

# Filter reports by status
npx playwright show-report --filter="failed"

# Export report data
npx playwright test --reporter=json --output=results.json

# Generate coverage report (if configured)
npx playwright test --coverage
```

### CI/CD Integration Reports

```bash
# Generate JUnit XML for Jenkins/GitLab
npx playwright test --reporter=junit --output=junit-results.xml

# Generate Allure report data
npx playwright test --reporter=allure-playwright

# Multiple formats for CI
npx playwright test --reporter=list,junit,json
```

## 🔍 Debugging Techniques

### Interactive Debugging Workflow

1. **Start with headed mode:**
   ```bash
   npx playwright test --headed --slowMo=1000
   ```

2. **Add breakpoints in code:**
   ```typescript
   test('debug example', async ({ page }) => {
     await page.goto('/login');
     await page.pause(); // Execution stops here
     await page.fill('#username', 'test');
   });
   ```

3. **Use Playwright Inspector:**
   ```bash
   npx playwright test --debug
   ```

4. **Generate and analyze traces:**
   ```bash
   npx playwright test --trace=on
   npx playwright show-trace trace.zip
   ```

### Common Debugging Scenarios

#### Element Not Found Issues

```typescript
// Debug element selection
test('debug element selection', async ({ page }) => {
  await page.goto('/login');
  
  // Check if element exists
  const element = page.locator('[data-testid="username"]');
  console.log('Element count:', await element.count());
  
  // Wait for element with timeout
  await element.waitFor({ timeout: 10000 });
  
  // Take screenshot for visual verification
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

#### Timing Issues

```typescript
// Debug timing problems
test('debug timing', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Wait for specific element
  await page.waitForSelector('[data-testid="dashboard-content"]');
  
  // Custom wait condition
  await page.waitForFunction(() => {
    return document.querySelector('.loading-spinner') === null;
  });
});
```

#### API Response Issues

```typescript
// Debug API interactions
test('debug API calls', async ({ page }) => {
  // Listen to all network requests
  page.on('request', request => {
    console.log('Request:', request.method(), request.url());
  });
  
  page.on('response', response => {
    console.log('Response:', response.status(), response.url());
  });
  
  await page.goto('/api-dependent-page');
});
```

## 🚀 Performance Optimization

### Test Execution Speed

```bash
# Run tests in parallel
npx playwright test --workers=4

# Skip slow tests during development
npx playwright test --grep-invert "@slow"

# Use faster browser for development
npx playwright test --project=chromium

# Disable video/screenshots for speed
npx playwright test --video=off --screenshot=off
```

### Resource Management

```typescript
// Optimize test setup
test.describe('Optimized Tests', () => {
  let sharedContext;
  
  test.beforeAll(async ({ browser }) => {
    // Create shared context for all tests
    sharedContext = await browser.newContext();
  });
  
  test.afterAll(async () => {
    await sharedContext.close();
  });
  
  test('fast test 1', async () => {
    const page = await sharedContext.newPage();
    // Test implementation
    await page.close();
  });
});
```

This comprehensive test execution guide provides all the necessary information for running, debugging, and analyzing tests effectively in the Playwright sample project.