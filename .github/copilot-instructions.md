# Playwright Test Generator Workflow

Follow this optimized workflow for every scenario:

1. **Receive Scenario:** Wait for the user to provide a test scenario.

2. **Do Not Generate Test Code Immediately:**  
   Never write Playwright test code based on the scenario alone.

3. **Step-by-Step Execution:**  
   - Use Playwright MCP tools to perform each step interactively using  **in incognito mode**.
   - use **playwright.config.ts** file to fetch any global config like baseURL, headless, etc.
   - Before each action, **display the selector you plan to use** (e.g., "Clicking button with selector: text=Submit").
   - **Always use Playwright CSS selectors** (e.g., `page.locator('...')`), not JavaScript-based selectors.
   - Prefer robust selectors like `text=`, `aria-label=`, `role=`, or unique attributes.
   - **Do not interact directly with `<img>` or `<svg>` elements**. Instead, use the nearest interactive element (button, link, input) associated with them.
   - If MCP cannot complete an action, **prompt the user for manual input** (selector, next step, clarification), then continue.

4. **Action & Input History:**  
   - Record actions, selectors, and any user-provided corrections or manual inputs.
   - After each action, confirm with the user that the step was successful before proceeding.
   - If an action fails, ask the user for help to correct it, then retry.
   - use .env file to fetch any sensitive data like username, password, etc.

5. **Test Generation:**  
   - After confirming all steps, generate a Playwright test file (TypeScript, using `@playwright/test`), using discovered selectors and flows.
   - Save the test in the `tests` directory.
   - **Ensure every test script is fully independent**, setting up its own preconditions and not depending on other tests.
   - **Use appropriate test hooks** (`beforeEach`, `afterEach`, `beforeAll`, `afterAll`) when required for setup and cleanup.

6.**Refactor to Playwright POM Standard:**  
   - **Before creating any new pages or functions in the pages directory, check for existing pages and functions for re-usability**.
   - Review the `pages/` directory to identify existing page objects that can be reused or extended.
   - Look for common elements (login forms, navigation, buttons) that already exist in other page objects.
   - Only create new page classes if no suitable existing ones can be reused or extended.
   - After successful execution, refactor scripts to follow the Playwright Page Object Model (POM).
   - Place reusable elements and functions in `pages/` directory as page classes.
   - Tests must use these page objects for all interactions and assertions.

7. **Test Execution & Iteration:**  
   - Execute the generated test.
   - If it fails, analyze and adjust actions/selectors (ask user for help if needed), then regenerate and rerun until it passes with maximum retry should be 5.

8. **Best Practices:**  
   - Always display selector before acting.
   - Use only robust, maintainable selectors.
   - Avoid direct interaction with non-interactive elements; use their nearest interactive parent or associated element.
   - Every test must be self-contained and runnable in isolation.
   - Encapsulate element selectors and actions in page objects for maintainability.
   - Maximize code reuse by checking existing page objects before creating new ones.
   - **Use test hooks appropriately** for setup and cleanup operations.

---

## Test Hooks Usage Guidelines

**When to use test hooks:**
- `beforeEach`: Login, navigation, or setup needed before every test
- `afterEach`: Logout, cleanup, or reset state after each test  
- `beforeAll`: One-time setup (database connections, test data creation)
- `afterAll`: One-time cleanup (closing connections, deleting test data)

---

## Example: Playwright POM Standard Structure

**Directory Layout:**
```
project-root/
├── tests/
│   └── login.spec.ts
├── pages/
│   └── LoginPage.ts
├── playwright.config.ts
```

**pages/LoginPage.ts**
```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Log in' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

**tests/login.spec.ts (Basic Example)**
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import config from '../config';

const landpageURL = '/dashboard';
test('user can log in', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(config.username, config.password);
  await expect(page).toHaveURL(landpageURL);
});
```

**tests/dashboard.spec.ts (Example with hooks)**
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import config from '../config';

test.describe('Dashboard Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Setup before each test
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Login before each test
    await loginPage.goto();
    await loginPage.login(config.username, config.password);
    await expect(page).toHaveURL('/dashboard');
  });

  test.afterEach(async ({ page }) => {
    // print console logs after each test
     await utils.printConsoleErrorLogs();
  });

  test('should display user profile', async ({ page }) => {
    await expect(dashboardPage.userProfile).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await dashboardPage.navigateToSettings();
    await expect(page).toHaveURL('/settings');
  });
});
```

**tests/api-integration.spec.ts (Example with beforeAll/afterAll)**
```typescript
import { test, expect } from '@playwright/test';
import { APIRequestContext } from '@playwright/test';

test.describe('API Integration Tests', () => {
  let apiContext: APIRequestContext;
  let testUserId: string;

  test.beforeAll(async ({ playwright }) => {
    // One-time setup - create API context
    apiContext = await playwright.request.newContext({
      baseURL: 'https://api.example.com',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
    });

    // Create test user for all tests
    const response = await apiContext.post('/users', {
      data: { name: 'Test User', email: 'test@example.com' }
    });
    const user = await response.json();
    testUserId = user.id;
  });

  test.afterAll(async () => {
    // One-time cleanup - delete test user
    if (testUserId) {
      await apiContext.delete(`/users/${testUserId}`);
    }
    await apiContext.dispose();
  });

  test('should fetch user data', async () => {
    const response = await apiContext.get(`/users/${testUserId}`);
    expect(response.ok()).toBeTruthy();
  });

  test('should update user data', async () => {
    const response = await apiContext.patch(`/users/${testUserId}`, {
      data: { name: 'Updated Name' }
    });
    expect(response.ok()).toBeTruthy();
  });
});
```

**Patterns:**
- Element and function reuse through page objects.
- Robust selectors for reliability.
- Each test fully independent and self-contained.
- Check existing page objects before creating new ones for maximum reusability.
- **Appropriate use of test hooks for setup and cleanup operations.**

---

**Summary:**  
This workflow ensures robust, maintainable Playwright test automation using reliable selectors, interactive/manual fallback, and the POM standard. Each test script is independent and ready for scalable development with maximum code reuse and proper setup/cleanup through test hooks.