import { HomePage } from '@pages/homepage';
import { LoginPage } from '@pages/LoginPage';
import { test, expect } from '@playwright/test';
import { readCSV } from 'utils/helper'

test.describe('E2E Test', async() => {
  let loginpage: LoginPage;
  let homePage: HomePage;
  const testData = await readCSV("data/testdata.csv");

  test.beforeEach(async ({ page,baseURL }) => {
    console.log('Testing started');
    loginpage = new LoginPage(page);
    homePage = new HomePage(page);
    await loginpage.navigate(baseURL);
  });


  testData.forEach((data, index) => {
  test(`login with user +${index}`, async ({ page }) => {
      console.log(`login with user +${index} Testing started`);
      await loginpage.login(data.username, data.password);
      await expect(page).toHaveURL(/.*inventory.html/);
      await homePage.logout(); 
      console.log(`login with user +${index} Testing completed`); 
    });
  });



});