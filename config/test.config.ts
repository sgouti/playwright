/**
 * Test configuration constants and settings
 */

export const TEST_CONFIG = {
  // Timeouts
  DEFAULT_TIMEOUT: 30000,
  LONG_TIMEOUT: 60000,
  SHORT_TIMEOUT: 5000,
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Screenshot settings
  SCREENSHOT_PATH: './test-results/screenshots',
  SCREENSHOT_QUALITY: 90,
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    LOAD_TIME: 3000,
    FIRST_CONTENTFUL_PAINT: 1500,
    LARGEST_CONTENTFUL_PAINT: 2500,
    CUMULATIVE_LAYOUT_SHIFT: 0.1,
  },
  
  // API settings
  API_TIMEOUT: 10000,
  API_RETRY_COUNT: 2,
  
  // Database settings
  DB_TIMEOUT: 15000,
  DB_POOL_SIZE: 10,
  
  // Test data settings
  TEST_DATA_PATH: './data',
  CLEANUP_TEST_DATA: true,
  
  // Browser settings
  BROWSER_SETTINGS: {
    VIEWPORT: {
      width: 1920,
      height: 1080,
    },
    DEVICE_SCALE_FACTOR: 1,
    IS_MOBILE: false,
    HAS_TOUCH: false,
  },
  
  // Logging settings
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',
  LOG_PATH: './test-results/logs',
  
  // Test user credentials (for demo purposes - use environment variables in real projects)
  TEST_USERS: {
    ADMIN: {
      username: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    },
    USER: {
      username: 'user@example.com',
      password: 'user123',
      role: 'user',
    },
    GUEST: {
      username: 'guest@example.com',
      password: 'guest123',
      role: 'guest',
    },
  },
  
  // Test URLs and endpoints
  ENDPOINTS: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
    USERS: '/api/users',
    PRODUCTS: '/api/products',
  },
  
  // File paths
  PATHS: {
    DOWNLOADS: './test-results/downloads',
    UPLOADS: './data/uploads',
    REPORTS: './test-results/reports',
  },
} as const;

export type TestConfig = typeof TEST_CONFIG;
export default TEST_CONFIG;