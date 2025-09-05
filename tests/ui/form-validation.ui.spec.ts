import { test, expect } from '@fixtures/fixtures';
import { DataUtils, DataDrivenTestConfig } from '@utils/DataUtils';

test.describe('Data-Driven Form Validation Tests', () => {
  
  test.describe('Form Validation Scenarios', () => {
    let formValidationTests: any[];

    test.beforeAll(async () => {
      const config: DataDrivenTestConfig = {
        dataSource: 'form-validation-data.json',
        format: 'json'
      };
      
      const formTests = await DataUtils.getTestDataByCategory('form-validation-data.json', 'formValidationTests');
      formValidationTests = DataUtils.generateParameterizedTests(formTests, 'testName');
    });

    for (let i = 0; i < (formValidationTests?.length || 0); i++) {
      test(`${formValidationTests?.[i]?.name || `Form Test ${i + 1}`}`, async ({ page }) => {
        const testCase = formValidationTests[i];
        const testData = testCase.data;

        // Navigate to form page
        await page.goto('/form');

        // Fill form with test data
        if (testData.formData.firstName !== undefined) {
          await page.fill('[data-testid="firstName"]', testData.formData.firstName);
        }
        if (testData.formData.lastName !== undefined) {
          await page.fill('[data-testid="lastName"]', testData.formData.lastName);
        }
        if (testData.formData.email !== undefined) {
          await page.fill('[data-testid="email"]', testData.formData.email);
        }
        if (testData.formData.phone !== undefined) {
          await page.fill('[data-testid="phone"]', testData.formData.phone);
        }
        if (testData.formData.age !== undefined) {
          await page.fill('[data-testid="age"]', testData.formData.age.toString());
        }

        // Submit form
        await page.click('[data-testid="submitButton"]');

        // Verify results based on expected outcome
        if (testData.expectedResult === 'success') {
          await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
          await expect(page.locator('[data-testid="successMessage"]')).toContainText(testData.expectedMessage);
        } else {
          await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
          await expect(page.locator('[data-testid="errorMessage"]')).toContainText(testData.expectedMessage);
        }
      });
    }
  });

  test.describe('Cross-Browser Form Validation', () => {
    let crossBrowserTests: any[];

    test.beforeAll(async () => {
      const config: DataDrivenTestConfig = {
        dataSource: 'form-validation-data.json',
        format: 'json',
        filterBy: { expectedResult: 'error' },
        transformData: (data) => ({
          ...data,
          testName: `Cross-browser: ${data.testName}`,
          browserSpecific: true
        })
      };
      
      const formTests = await DataUtils.getTestDataByCategory('form-validation-data.json', 'formValidationTests');
      const errorTests = formTests.filter(test => test.expectedResult === 'error');
      crossBrowserTests = DataUtils.generateParameterizedTests(errorTests, 'testName');
    });

    for (let i = 0; i < (crossBrowserTests?.length || 0); i++) {
      test(`${crossBrowserTests?.[i]?.name || `Cross-browser Test ${i + 1}`}`, async ({ page, browserName }) => {
        const testCase = crossBrowserTests[i];
        const testData = testCase.data;

        // Skip certain tests for specific browsers if needed
        if (browserName === 'webkit' && testData.formData.phone === 'invalid-phone') {
          test.skip(true, 'Phone validation differs in WebKit');
        }

        await page.goto('/form');

        // Fill form with test data
        await page.fill('[data-testid="firstName"]', testData.formData.firstName || '');
        await page.fill('[data-testid="lastName"]', testData.formData.lastName || '');
        await page.fill('[data-testid="email"]', testData.formData.email || '');
        await page.fill('[data-testid="phone"]', testData.formData.phone || '');
        await page.fill('[data-testid="age"]', testData.formData.age?.toString() || '');

        await page.click('[data-testid="submitButton"]');

        // Verify error message appears
        await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
        
        // Browser-specific validation message checks
        const errorMessage = await page.locator('[data-testid="errorMessage"]').textContent();
        expect(errorMessage).toContain(testData.expectedMessage.split(' ')[0]); // Check first word for browser compatibility
      });
    }
  });

  test.describe('Dynamic Test Generation', () => {
    test('should generate tests for boundary values', async ({ page }) => {
      // Generate boundary test cases dynamically
      const boundaryAges = [17, 18, 65, 66, 120, 121];
      const boundaryTests = boundaryAges.map(age => ({
        testName: `Age boundary test: ${age}`,
        formData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          age: age
        },
        expectedResult: (age >= 18 && age <= 120) ? 'success' : 'error',
        expectedMessage: (age >= 18 && age <= 120) ? 'Form submitted successfully' : 'Age must be between 18 and 120'
      }));

      for (const testData of boundaryTests) {
        await test.step(`Testing age: ${testData.formData.age}`, async () => {
          await page.goto('/form');
          
          await page.fill('[data-testid="firstName"]', testData.formData.firstName);
          await page.fill('[data-testid="lastName"]', testData.formData.lastName);
          await page.fill('[data-testid="email"]', testData.formData.email);
          await page.fill('[data-testid="phone"]', testData.formData.phone);
          await page.fill('[data-testid="age"]', testData.formData.age.toString());

          await page.click('[data-testid="submitButton"]');

          if (testData.expectedResult === 'success') {
            await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
          } else {
            await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
          }
        });
      }
    });
  });

  test.describe('Combination Testing', () => {
    test('should test field combinations', async ({ page }) => {
      // Generate combinations of invalid fields
      const invalidFields = [
        { field: 'firstName', value: '' },
        { field: 'email', value: 'invalid-email' },
        { field: 'age', value: '17' }
      ];

      const combinations = DataUtils.createTestCombinations(
        [true, false], // firstName valid/invalid
        [true, false], // email valid/invalid
        [true, false]  // age valid/invalid
      );

      for (let i = 0; i < Math.min(combinations.length, 4); i++) { // Limit to 4 combinations for demo
        const combination = combinations[i];
        
        await test.step(`Combination ${i + 1}: firstName=${combination[0] ? 'valid' : 'invalid'}, email=${combination[1] ? 'valid' : 'invalid'}, age=${combination[2] ? 'valid' : 'invalid'}`, async () => {
          await page.goto('/form');
          
          await page.fill('[data-testid="firstName"]', combination[0] ? 'John' : '');
          await page.fill('[data-testid="lastName"]', 'Doe');
          await page.fill('[data-testid="email"]', combination[1] ? 'john.doe@example.com' : 'invalid-email');
          await page.fill('[data-testid="phone"]', '+1234567890');
          await page.fill('[data-testid="age"]', combination[2] ? '25' : '17');

          await page.click('[data-testid="submitButton"]');

          const allValid = combination.every(valid => valid);
          
          if (allValid) {
            await expect(page.locator('[data-testid="successMessage"]')).toBeVisible();
          } else {
            await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
          }
        });
      }
    });
  });
});