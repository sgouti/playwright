import { test, expect } from '@fixtures/fixtures';
import { DataUtils, DataDrivenTestConfig } from '@utils/DataUtils';

test.describe('Data-Driven Login Tests', () => {
  // Test with JSON data
  test.describe('JSON Data Source Tests', () => {
    let jsonTestCases: any[];

    test.beforeAll(async () => {
      const config: DataDrivenTestConfig = {
        dataSource: 'users.json',
        format: 'json'
      };
      
      const userData = await DataUtils.loadTestData(config);
      jsonTestCases = DataUtils.generateParameterizedTests(userData, 'username');
    });

    for (let i = 0; i < (jsonTestCases?.length || 0); i++) {
      test(`JSON Test: ${jsonTestCases?.[i]?.name || `Test ${i + 1}`}`, async ({ loginPage }) => {
        const testCase = jsonTestCases[i];
        const userData = testCase.data;

        await loginPage.navigate();
        await loginPage.login(userData.username, userData.password);
        
        if (userData.expectedResult === 'success') {
          await loginPage.waitForLoginComplete();
          expect(await loginPage.isLoggedIn()).toBe(true);
        } else {
          expect(await loginPage.hasErrorMessage()).toBe(true);
        }
      });
    }
  });

  // Test with CSV data
  test.describe('CSV Data Source Tests', () => {
    let csvTestCases: any[];

    test.beforeAll(async () => {
      const config: DataDrivenTestConfig = {
        dataSource: 'login-test-data.csv',
        format: 'csv',
        testNameField: 'testDescription'
      };
      
      const csvData = await DataUtils.loadTestData(config);
      csvTestCases = DataUtils.generateParameterizedTests(csvData, 'testDescription');
    });

    for (let i = 0; i < (csvTestCases?.length || 0); i++) {
      test(`CSV Test: ${csvTestCases?.[i]?.name || `Test ${i + 1}`}`, async ({ loginPage }) => {
        const testCase = csvTestCases[i];
        const userData = testCase.data;

        await loginPage.navigate();
        await loginPage.login(userData.username, userData.password);
        
        if (userData.expectedResult === 'success') {
          await loginPage.waitForLoginComplete();
          expect(await loginPage.isLoggedIn()).toBe(true);
        } else {
          expect(await loginPage.hasErrorMessage()).toBe(true);
        }
      });
    }
  });

  // Test with filtered data
  test.describe('Filtered Data Tests', () => {
    let validUserTests: any[];
    let invalidUserTests: any[];

    test.beforeAll(async () => {
      const validConfig: DataDrivenTestConfig = {
        dataSource: 'login-test-data.csv',
        format: 'csv',
        filterBy: { expectedResult: 'success' },
        testNameField: 'testDescription'
      };

      const invalidConfig: DataDrivenTestConfig = {
        dataSource: 'login-test-data.csv',
        format: 'csv',
        filterBy: { expectedResult: 'error' },
        testNameField: 'testDescription'
      };
      
      const validData = await DataUtils.loadTestData(validConfig);
      const invalidData = await DataUtils.loadTestData(invalidConfig);
      
      validUserTests = DataUtils.generateParameterizedTests(validData, 'testDescription');
      invalidUserTests = DataUtils.generateParameterizedTests(invalidData, 'testDescription');
    });

    test.describe('Valid Login Scenarios', () => {
      for (let i = 0; i < (validUserTests?.length || 0); i++) {
        test(`Valid: ${validUserTests?.[i]?.name || `Test ${i + 1}`}`, async ({ loginPage }) => {
          const testCase = validUserTests[i];
          const userData = testCase.data;

          await loginPage.navigate();
          await loginPage.login(userData.username, userData.password);
          await loginPage.waitForLoginComplete();
          expect(await loginPage.isLoggedIn()).toBe(true);
        });
      }
    });

    test.describe('Invalid Login Scenarios', () => {
      for (let i = 0; i < (invalidUserTests?.length || 0); i++) {
        test(`Invalid: ${invalidUserTests?.[i]?.name || `Test ${i + 1}`}`, async ({ loginPage }) => {
          const testCase = invalidUserTests[i];
          const userData = testCase.data;

          await loginPage.navigate();
          await loginPage.login(userData.username, userData.password);
          expect(await loginPage.hasErrorMessage()).toBe(true);
        });
      }
    });
  });

  // Test with data transformation
  test.describe('Transformed Data Tests', () => {
    let transformedTests: any[];

    test.beforeAll(async () => {
      const config: DataDrivenTestConfig = {
        dataSource: 'users.json',
        format: 'json',
        transformData: (data) => ({
          ...data,
          testName: `Login test for ${data.username} (${data.role})`,
          timeout: data.role === 'admin' ? 10000 : 5000
        })
      };
      
      const transformedData = await DataUtils.loadTestData(config);
      transformedTests = DataUtils.generateParameterizedTests(transformedData, 'testName');
    });

    for (let i = 0; i < (transformedTests?.length || 0); i++) {
      test(`Transformed: ${transformedTests?.[i]?.name || `Test ${i + 1}`}`, async ({ loginPage }) => {
        const testCase = transformedTests[i];
        const userData = testCase.data;

        // Use custom timeout from transformed data
        test.setTimeout(userData.timeout);

        await loginPage.navigate();
        await loginPage.login(userData.username, userData.password);
        
        if (userData.expectedResult === 'success') {
          await loginPage.waitForLoginComplete();
          expect(await loginPage.isLoggedIn()).toBe(true);
        } else {
          expect(await loginPage.hasErrorMessage()).toBe(true);
        }
      });
    }
  });
});