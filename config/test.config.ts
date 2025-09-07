/**
 * Test configuration constants and settings
 */

export const TEST_CONFIG = {
  ADMIN: {
    username: 'standard_user',
    password: 'secret_sauce',
    role: 'admin',
  },
  
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

  // Logging settings
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',
  LOG_PATH: './test-results/logs',


  // File paths
  PATHS: {
    DOWNLOADS: './test-results/downloads',
    UPLOADS: './data/uploads',
    REPORTS: './test-results/reports',
  },
} as const;

export type TestConfig = typeof TEST_CONFIG;
export default TEST_CONFIG;