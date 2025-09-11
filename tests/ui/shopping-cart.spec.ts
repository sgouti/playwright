import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

test.describe('Sauce Demo Shopping Cart Test', () => {
    test('should complete purchase flow with multiple items', async ({ page }) => {
        // Initialize page objects
        const loginPage = new LoginPage(page);
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        // Login
        await loginPage.navigate();
        await loginPage.login('standard_user', 'secret_sauce');

        // Add items to cart
        const itemsToAdd = ['backpack', 'bikeLight', 'boltTShirt'] as const;
        for (const item of itemsToAdd) {
            await inventoryPage.addItemToCart(item);
        }

        // Go to cart
        await inventoryPage.goToCart();

        // Verify items in cart
        await expect(await cartPage.getCartItemsCount()).toBe(3);
        await expect(await cartPage.isItemInCart('Sauce Labs Backpack')).toBe(true);
        await expect(await cartPage.isItemInCart('Sauce Labs Bike Light')).toBe(true);
        await expect(await cartPage.isItemInCart('Sauce Labs Bolt T-Shirt')).toBe(true);

        // Proceed to checkout
        await cartPage.proceedToCheckout();

        // Fill shipping information
        await checkoutPage.fillShippingInfo('John', 'Doe', '12345');
        await checkoutPage.continueToPurchase();

        // Verify items in checkout
        await expect(await checkoutPage.getCheckoutItemsCount()).toBe(3);
        await expect(await checkoutPage.isItemInCheckout('Sauce Labs Backpack')).toBe(true);
        await expect(await checkoutPage.isItemInCheckout('Sauce Labs Bike Light')).toBe(true);
        await expect(await checkoutPage.isItemInCheckout('Sauce Labs Bolt T-Shirt')).toBe(true);

        // Complete purchase
        await checkoutPage.finishPurchase();

        // Verify successful purchase
        await expect(page.locator('h2', { hasText: 'Thank you for your order!' })).toBeVisible();
    });
});
