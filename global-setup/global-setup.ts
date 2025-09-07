import { LoginPage } from '@pages/LoginPage';
import { chromium, FullConfig } from '@playwright/test';
import environments from 'config/env.config';
import TEST_CONFIG from '@config/test.config'; 

async function globalSetup(config: FullConfig) {
  console.log('Setting up global authentication...');
  
  const browser = await chromium.launch({ 
    headless: environments.headless 
  });
  const page = await browser.newPage();
  const loginPage = new LoginPage(page);

  try {
    // Navigate to the login page
    await page.goto(environments.baseUrl);
    await loginPage.login(TEST_CONFIG.ADMIN.username, TEST_CONFIG.ADMIN.password);
    await page.context().storageState({
      path: '.auth/user.json'
    });
    
    console.log('Global authentication setup completed successfully');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
