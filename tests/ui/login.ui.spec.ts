import { LoginPage } from '@pages/LoginPage';
import { test, expect } from '@playwright/test';
import {CSVUtils} from 'utils/helper'

test.describe('E2E Test', () => {

test.beforeAll(async ({ page }) => {
  const loginpage= new LoginPage(page);
  loginpage.navigate();
  await expect(page).toHaveURL('https://www.saucedemo.com/');
  const readdata =  new CSVUtils().readCSV('data/testdata.csv');  
  
});

  test('test', async ({ page }) => {
  await page.goto('/inventory.html');
  await page.locator('[data-test="item-4-title-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toBeVisible();
  await page.locator('[data-test="add-to-cart"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toContainText('Sauce Labs Backpack');
  await page.locator('[data-test="shopping-cart-link"]').click();
  
  await expect(page.locator('[data-test="inventory-item"]')).toBeVisible();
  await page.locator('[data-test="checkout"]').click();
})

test.afterAll(async ({ page }) => {
  await page.close();
});


});