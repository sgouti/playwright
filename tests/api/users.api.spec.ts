import { apiTest as test, expect } from '@fixtures/fixtures';
import { DataUtils, DataDrivenTestConfig } from '@utils/DataUtils';
import { ValidationUtils } from '@utils/ValidationUtils';

test.describe('Data-Driven API Tests', () => {
  test.beforeAll(async () => {
    console.log('🚀 Starting Data-Driven API test suite');
  });

  // User API Tests from JSON data
  test.describe('User API Tests', () => {
    let userApiTests: any[];

    test.beforeAll(async () => {
      const userTests = await DataUtils.getTestDataByCategory('api-test-data.json', 'userApiTests');
      userApiTests = DataUtils.generateParameterizedTests(userTests, 'testName');
    });

    for (let i = 0; i < (userApiTests?.length || 0); i++) {
      test(`${userApiTests?.[i]?.name || `API Test ${i + 1}`}`, async ({ apiUtils }) => {
        const testCase = userApiTests[i];
        const testData = testCase.data;

        let response;
        
        switch (testData.method) {
          case 'GET':
            response = await apiUtils.get(testData.endpoint);
            break;
          case 'POST':
            response = await apiUtils.post(testData.endpoint, testData.payload);
            break;
          case 'PUT':
            response = await apiUtils.put(testData.endpoint, testData.payload);
            break;
          case 'DELETE':
            response = await apiUtils.delete(testData.endpoint);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${testData.method}`);
        }

        // Verify status code
        expect(response.status).toBe(testData.expectedStatus);

        // Verify response fields if expected
        if (testData.expectedFields && testData.expectedFields.length > 0) {
          testData.expectedFields.forEach((field: string) => {
            expect(response.body).toHaveProperty(field);
          });
        }

        // Additional validations based on test type
        if (testData.method === 'POST' && testData.expectedStatus === 201) {
          expect(response.body).toHaveProperty('id');
        }
        
        if (testData.method === 'GET' && testData.expectedStatus === 200) {
          expect(response.body).toBeDefined();
        }
      });
    }
  });

  // Product API Tests
  test.describe('Product API Tests', () => {
    let productApiTests: any[];

    test.beforeAll(async () => {
      const productTests = await DataUtils.getTestDataByCategory('api-test-data.json', 'productApiTests');
      productApiTests = DataUtils.generateParameterizedTests(productTests, 'testName');
    });

    for (let i = 0; i < (productApiTests?.length || 0); i++) {
      test(`${productApiTests?.[i]?.name || `Product API Test ${i + 1}`}`, async ({ apiUtils }) => {
        const testCase = productApiTests[i];
        const testData = testCase.data;

        const response = await apiUtils.get(testData.endpoint);
        
        expect(response.status).toBe(testData.expectedStatus);
        
        if (testData.expectedFields && testData.expectedFields.length > 0) {
          testData.expectedFields.forEach((field: string) => {
            expect(response.body).toHaveProperty(field);
          });
        }
      });
    }
  });

  // Combined API Tests with multiple data sources
  test.describe('Combined API Test Scenarios', () => {
    let combinedTests: any[];

    test.beforeAll(async () => {
      const userConfig: DataDrivenTestConfig = {
        dataSource: 'api-test-data.json',
        format: 'json',
        filterBy: { method: 'GET' },
        transformData: (data) => ({
          ...data,
          testCategory: 'user-api',
          testName: `GET ${data.testName}`
        })
      };

      const productConfig: DataDrivenTestConfig = {
        dataSource: 'api-test-data.json',
        format: 'json',
        transformData: (data) => ({
          ...data,
          testCategory: 'product-api'
        })
      };

      const userTests = await DataUtils.getTestDataByCategory('api-test-data.json', 'userApiTests');
      const productTests = await DataUtils.getTestDataByCategory('api-test-data.json', 'productApiTests');
      
      const filteredUserTests = userTests.filter(test => test.method === 'GET');
      const allTests = [...filteredUserTests, ...productTests];
      
      combinedTests = DataUtils.generateParameterizedTests(allTests, 'testName');
    });

    for (let i = 0; i < (combinedTests?.length || 0); i++) {
      test(`Combined: ${combinedTests?.[i]?.name || `Combined Test ${i + 1}`}`, async ({ apiUtils }) => {
        const testCase = combinedTests[i];
        const testData = testCase.data;

        let response;
        
        switch (testData.method) {
          case 'GET':
            response = await apiUtils.get(testData.endpoint);
            break;
          case 'POST':
            response = await apiUtils.post(testData.endpoint, testData.payload);
            break;
          case 'PUT':
            response = await apiUtils.put(testData.endpoint, testData.payload);
            break;
          case 'DELETE':
            response = await apiUtils.delete(testData.endpoint);
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${testData.method}`);
        }

        expect(response.status).toBe(testData.expectedStatus);
        
        // Endpoint-specific validations
        if (testData.endpoint.includes('/users') && response.status === 200) {
          expect(response.body).toBeDefined();
        }
        
        if (testData.endpoint.includes('/products') && response.status === 200) {
          expect(response.body).toHaveProperty('products');
        }
      });
    }
  });

  // Legacy tests for backward compatibility
  test.describe('Legacy API Tests', () => {
    test('should get all users', async ({ apiUtils }) => {
      const response = await apiUtils.get('/users');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should validate API response schema', async ({ apiUtils }) => {
      const response = await apiUtils.get('/users/1');
      
      expect(response.status).toBe(200);
      
      const expectedSchema = {
        id: 'number',
        username: 'string',
        email: 'string',
        role: 'string'
      };
      
      expect(apiUtils.validateResponseSchema(response, expectedSchema)).toBe(true);
    });
  });
});