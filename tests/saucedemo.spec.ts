import { test, expect } from '@playwright/test';

test.describe('Saucedemo Tests', () => {
  test('should login and add 3 items to cart', async ({ page }) => {
    // Navigate to the website
    await page.goto('https://www.saucedemo.com/');
    
    // Login
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    
    // Verify successful login by checking if inventory container is visible
    await expect(page.locator('#inventory_container')).toBeVisible();
    
    // Add 3 items to cart
    const addToCartButtons = page.locator('[data-test^="add-to-cart"]');
    for (let i = 0; i < 3; i++) {
      await addToCartButtons.nth(i).click();
    }
    
    // Verify cart count is 3
    const cartBadge = page.locator('.shopping_cart_badge');
    await expect(cartBadge).toHaveText('3');
  });
});
