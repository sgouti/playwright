import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class InventoryPage extends BasePage {
  readonly inventoryContainer: Locator;
  readonly addToCartButtons: Locator;
  readonly cartBadge: Locator;
  readonly cartIcon: Locator;
  readonly inventoryItems: Locator;

  constructor(page: Page) {
    super(page);
    this.inventoryContainer = page.locator('#inventory_container');
    this.addToCartButtons = page.locator('[data-test^="add-to-cart"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartIcon = page.locator('.shopping_cart_link');
    this.inventoryItems = page.locator('.inventory_item');
  }

  /**
   * Verify that the inventory page is loaded successfully
   */
  async verifyInventoryPageLoaded() {
    await expect(this.inventoryContainer).toBeVisible();
  }

  /**
   * Add a specific item to cart by index
   */
  async addItemToCart(itemIndex: number) {
    await this.addToCartButtons.nth(itemIndex).click();
    // Wait for the page to update after adding item
    await this.page.waitForTimeout(500);
  }

  /**
   * Add a specific item to cart by data-test attribute (more reliable)
   */
  async addItemToCartByDataTest(itemDataTest: string) {
    const itemButton = this.page.locator(`[data-test="add-to-cart-${itemDataTest}"]`);
    await itemButton.click();
    // Wait for the page to update after adding item
    await this.page.waitForTimeout(500);
  }

  /**
   * Add multiple items to cart
   */
  async addMultipleItemsToCart(numberOfItems: number) {
    for (let i = 0; i < numberOfItems; i++) {
      await this.addItemToCart(i);
    }
  }

  /**
   * Get the cart item count
   */
  async getCartItemCount(): Promise<string> {
    return await this.cartBadge.textContent() || '0';
  }

  /**
   * Verify cart item count
   */
  async verifyCartItemCount(expectedCount: number) {
    await expect(this.cartBadge).toHaveText(expectedCount.toString());
  }

  /**
   * Click on cart icon to navigate to cart
   */
  async goToCart() {
    await this.cartIcon.click();
  }

  /**
   * Get the name of an inventory item by index
   */
  async getItemName(itemIndex: number): Promise<string> {
    const itemName = this.inventoryItems.nth(itemIndex).locator('.inventory_item_name');
    return await itemName.textContent() || '';
  }

  /**
   * Get the price of an inventory item by index
   */
  async getItemPrice(itemIndex: number): Promise<string> {
    const itemPrice = this.inventoryItems.nth(itemIndex).locator('.inventory_item_price');
    return await itemPrice.textContent() || '';
  }
}