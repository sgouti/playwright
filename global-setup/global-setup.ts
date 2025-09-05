import { chromium, FullConfig } from '@playwright/test';
import { config } from '@config/env.config';
import { TEST_CONFIG } from '@config/test.config';
import { getDatabase, closeDatabaseConnection } from '@utils/DatabaseUtils';
import { createApiUtils } from '@utils/ApiUtils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global setup function that runs before all tests
 * Handles authentication, database seeding, and environment preparation
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Starting global setup...');
  
  try {
    // Create necessary directories
    await createDirectories();
    
    // Setup database
    await setupDatabase();
    
    // Setup authentication
    await setupAuthentication();
    
    // Setup test data
    await setupTestData();
    
    // Validate environment
    await validateEnvironment();
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

/**
 * Create necessary directories for test execution
 */
async function createDirectories(): Promise<void> {
  console.log('📁 Creating directories...');
  
  const directories = [
    TEST_CONFIG.SCREENSHOT_PATH,
    TEST_CONFIG.PATHS.DOWNLOADS,
    TEST_CONFIG.PATHS.UPLOADS,
    TEST_CONFIG.PATHS.REPORTS,
    TEST_CONFIG.LOG_PATH,
    path.join(TEST_CONFIG.SCREENSHOT_PATH, 'failures'),
    path.join(TEST_CONFIG.SCREENSHOT_PATH, 'baselines'),
  ];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  Created directory: ${dir}`);
    }
  }
}

/**
 * Setup database connection and seed test data
 */
async function setupDatabase(): Promise<void> {
  console.log('🗄️ Setting up database...');
  
  try {
    const db = await getDatabase();
    
    // Clear existing test data
    await db.cleanup();
    
    // Seed test users
    await db.seedTestData('users', [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: 'hashed_admin_password',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        username: 'user',
        email: 'user@example.com',
        password: 'hashed_user_password',
        role: 'user',
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        username: 'guest',
        email: 'guest@example.com',
        password: 'hashed_guest_password',
        role: 'guest',
        active: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    
    // Seed test products
    await db.seedTestData('products', [
      {
        id: 1,
        name: 'Test Product 1',
        description: 'Description for test product 1',
        price: 99.99,
        category: 'electronics',
        inStock: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Test Product 2',
        description: 'Description for test product 2',
        price: 149.99,
        category: 'books',
        inStock: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    
    console.log('  Database seeded successfully');
  } catch (error) {
    console.warn('  Database setup failed (using mock data):', error);
  }
}

/**
 * Setup authentication and store auth tokens
 */
async function setupAuthentication(): Promise<void> {
  console.log('🔐 Setting up authentication...');
  
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create API utils for authentication
    const apiUtils = await createApiUtils(context.request);
    
    // Authenticate different user types and store tokens
    const authTokens: Record<string, string> = {};
    
    for (const [userType, credentials] of Object.entries(TEST_CONFIG.TEST_USERS)) {
      try {
        // Mock authentication - in real scenario, make actual API call
        const mockToken = `mock_token_${userType.toLowerCase()}_${Date.now()}`;
        authTokens[userType.toLowerCase()] = mockToken;
        
        console.log(`  Generated auth token for ${userType}`);
      } catch (error) {
        console.warn(`  Failed to authenticate ${userType}:`, error);
      }
    }
    
    // Store auth tokens for use in tests
    const authFile = path.join(TEST_CONFIG.PATHS.REPORTS, 'auth-tokens.json');
    fs.writeFileSync(authFile, JSON.stringify(authTokens, null, 2));
    
    // Store browser storage state for authenticated sessions
    await setupBrowserStorageState(page);
    
    await browser.close();
    console.log('  Authentication setup completed');
  } catch (error) {
    console.warn('  Authentication setup failed:', error);
  }
}

/**
 * Setup browser storage state for authenticated sessions
 */
async function setupBrowserStorageState(page: any): Promise<void> {
  try {
    // Navigate to login page and perform authentication
    await page.goto(config.baseUrl + TEST_CONFIG.ENDPOINTS.LOGIN);
    
    // Mock login process - in real scenario, perform actual login
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock_auth_token');
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('isAuthenticated', 'true');
    });
    
    // Save storage state for reuse in tests
    const storageStatePath = path.join(TEST_CONFIG.PATHS.REPORTS, 'storage-state.json');
    await page.context().storageState({ path: storageStatePath });
    
    console.log('  Browser storage state saved');
  } catch (error) {
    console.warn('  Failed to setup browser storage state:', error);
  }
}

/**
 * Setup test data files
 */
async function setupTestData(): Promise<void> {
  console.log('📊 Setting up test data...');
  
  // Create sample JSON test data
  const jsonTestData = {
    users: [
      { username: 'testuser1', email: 'test1@example.com', role: 'user' },
      { username: 'testuser2', email: 'test2@example.com', role: 'admin' },
    ],
    products: [
      { name: 'Product A', price: 29.99, category: 'electronics' },
      { name: 'Product B', price: 49.99, category: 'books' },
    ],
    testScenarios: [
      { scenario: 'valid_login', username: 'admin', password: 'admin123', expectedResult: 'success' },
      { scenario: 'invalid_login', username: 'invalid', password: 'wrong', expectedResult: 'error' },
    ],
  };
  
  const jsonFilePath = path.join(TEST_CONFIG.TEST_DATA_PATH, 'test-data.json');
  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonTestData, null, 2));
  
  // Create sample CSV test data
  const csvTestData = `username,password,role,expected_result
admin,admin123,admin,success
user,user123,user,success
guest,guest123,guest,success
invalid,wrong,user,error`;
  
  const csvFilePath = path.join(TEST_CONFIG.TEST_DATA_PATH, 'login-test-data.csv');
  fs.writeFileSync(csvFilePath, csvTestData);
  
  // Create sample upload files
  const uploadDir = TEST_CONFIG.PATHS.UPLOADS;
  const sampleFile = path.join(uploadDir, 'sample-upload.txt');
  fs.writeFileSync(sampleFile, 'This is a sample file for upload testing.');
  
  const sampleImage = path.join(uploadDir, 'sample-image.txt');
  fs.writeFileSync(sampleImage, 'Mock image file content for testing.');
  
  console.log('  Test data files created');
}

/**
 * Validate environment and dependencies
 */
async function validateEnvironment(): Promise<void> {
  console.log('🔍 Validating environment...');
  
  // Check if base URL is accessible
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log(`  Checking base URL: ${config.baseUrl}`);
    const response = await page.goto(config.baseUrl, { timeout: 10000 });
    
    if (response && response.ok()) {
      console.log('  ✅ Base URL is accessible');
    } else {
      console.warn('  ⚠️ Base URL returned non-OK status');
    }
    
    await browser.close();
  } catch (error) {
    console.warn('  ⚠️ Base URL validation failed:', error);
  }
  
  // Validate API endpoint
  try {
    const apiUtils = await createApiUtils();
    console.log(`  Checking API URL: ${config.apiUrl}`);
    
    // Try to hit a health endpoint or any endpoint
    try {
      await apiUtils.get('/health', { validateStatus: false, timeout: 5000 });
      console.log('  ✅ API endpoint is accessible');
    } catch {
      console.warn('  ⚠️ API endpoint validation failed (this is expected for mock setup)');
    }
    
    await apiUtils.dispose();
  } catch (error) {
    console.warn('  ⚠️ API validation failed:', error);
  }
  
  // Check required directories exist
  const requiredDirs = [
    TEST_CONFIG.TEST_DATA_PATH,
    TEST_CONFIG.SCREENSHOT_PATH,
    TEST_CONFIG.PATHS.DOWNLOADS,
  ];
  
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      console.log(`  ✅ Directory exists: ${dir}`);
    } else {
      console.warn(`  ⚠️ Directory missing: ${dir}`);
    }
  }
  
  console.log('  Environment validation completed');
}

/**
 * Cleanup function for global setup
 */
export async function globalSetupCleanup(): Promise<void> {
  console.log('🧹 Cleaning up global setup...');
  
  try {
    // Close database connections
    await closeDatabaseConnection();
    
    // Clean up temporary files if needed
    const tempFiles = [
      path.join(TEST_CONFIG.PATHS.REPORTS, 'temp-setup.json'),
    ];
    
    for (const file of tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`  Removed temp file: ${file}`);
      }
    }
    
    console.log('  Global setup cleanup completed');
  } catch (error) {
    console.warn('  Global setup cleanup failed:', error);
  }
}

/**
 * Get authentication token for user type
 */
export function getAuthToken(userType: string): string | null {
  try {
    const authFile = path.join(TEST_CONFIG.PATHS.REPORTS, 'auth-tokens.json');
    if (fs.existsSync(authFile)) {
      const tokens = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      return tokens[userType.toLowerCase()] || null;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return null;
}

/**
 * Get storage state path
 */
export function getStorageStatePath(): string {
  return path.join(TEST_CONFIG.PATHS.REPORTS, 'storage-state.json');
}

export default globalSetup;