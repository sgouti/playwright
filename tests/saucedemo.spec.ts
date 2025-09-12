import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { TEST_CONFIG } from '../config/test.config';

test.describe('Saucedemo Tests', () => {
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    
    // Navigate to the website
    await loginPage.navigate();
  });

  test('should login and add 3 items to cart', async ({ page }) => {
    // Login with valid credentials from config
    await loginPage.login(TEST_CONFIG.ADMIN.username, TEST_CONFIG.ADMIN.password);
    
    // Verify successful login by checking if inventory page is loaded
    await inventoryPage.verifyInventoryPageLoaded();
    
    // Add 3 specific items to cart for more predictable testing
    await inventoryPage.addItemToCartByDataTest('sauce-labs-backpack');
    await inventoryPage.addItemToCartByDataTest('sauce-labs-bike-light');
    await inventoryPage.addItemToCartByDataTest('sauce-labs-bolt-t-shirt');
    
    // Verify cart count is 3
    await inventoryPage.verifyCartItemCount(3);
    
    // Additional validation: verify cart badge shows correct count
    const cartCount = await inventoryPage.getCartItemCount();
    expect(cartCount).toBe('3');
  });
});
