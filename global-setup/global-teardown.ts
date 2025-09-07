import { FullConfig, chromium } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Launch a browser instance if needed for any cleanup
  const browser = await chromium.launch();
  
  try {
    // Add any cleanup tasks here if needed
    // For example: logout, clear data, etc.
    
  } finally {
    // Make sure browser is always closed
    await browser.close();
  }
}

export default globalTeardown;
