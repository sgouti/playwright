# Parameterized Testing Guide

This guide demonstrates how to implement data-driven and parameterized testing using the enhanced DataUtils and TestGeneratorUtils classes.

## Overview

The parameterized testing framework supports:
- Multiple data formats (JSON, CSV)
- Dynamic test generation
- Data filtering and transformation
- Boundary value testing
- Equivalence class testing
- Pairwise combination testing
- Negative testing scenarios

## Basic Usage

### Loading Test Data

```typescript
import { DataUtils, DataDrivenTestConfig } from '@utils/DataUtils';

// Load JSON data
const jsonData = await DataUtils.loadJsonData('users.json');

// Load CSV data
const csvData = await DataUtils.loadCsvData('login-test-data.csv');

// Load with configuration
const config: DataDrivenTestConfig = {
  dataSource: 'api-test-data.json',
  format: 'json',
  filterBy: { method: 'GET' },
  transformData: (data) => ({ ...data, timeout: 5000 })
};
const testData = await DataUtils.loadTestData(config);
```

### Generating Parameterized Tests

```typescript
// Generate test cases from data
const testCases = DataUtils.generateParameterizedTests(testData, 'testName');

// Execute parameterized tests
for (let i = 0; i < testCases.length; i++) {
  test(`${testCases[i].name}`, async ({ page }) => {
    const data = testCases[i].data;
    // Test implementation using data
  });
}
```

## Advanced Test Generation

### Boundary Value Testing

```typescript
import { TestGeneratorUtils } from '@utils/TestGeneratorUtils';

const boundaryTests = TestGeneratorUtils.generateBoundaryTests(
  'age',
  { min: 18, max: 120 },
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com'
  },
  'Age boundary validation'
);
```

### Equivalence Class Testing

```typescript
const equivalenceClasses = {
  'valid emails': {
    values: ['user@example.com', 'test@domain.co.uk'],
    expectedResult: 'success'
  },
  'invalid format': {
    values: ['invalid-email', '@example.com'],
    expectedResult: 'error'
  }
};

const equivalenceTests = TestGeneratorUtils.generateEquivalenceTests(
  'email',
  equivalenceClasses,
  baseTestData,
  'Email validation'
);
```

### Pairwise Combination Testing

```typescript
const parameters = {
  role: ['admin', 'user', 'guest'],
  status: ['active', 'inactive'],
  permissions: ['read', 'write', 'admin']
};

const pairwiseTests = TestGeneratorUtils.generatePairwiseTests(
  parameters,
  baseTestData,
  'User role combination'
);
```

### Negative Testing

```typescript
const invalidValues = ['', null, 'invalid-format', '123'];
const expectedErrors = [
  'Field is required',
  'Field cannot be null',
  'Invalid format',
  'Invalid type'
];

const negativeTests = TestGeneratorUtils.generateNegativeTests(
  'email',
  invalidValues,
  baseTestData,
  expectedErrors,
  'Email negative validation'
);
```

## Data File Formats

### JSON Format

```json
{
  "userTests": [
    {
      "testName": "Valid admin login",
      "username": "admin@example.com",
      "password": "admin123",
      "role": "admin",
      "expectedResult": "success"
    }
  ]
}
```

### CSV Format

```csv
testName,username,password,role,expectedResult
Valid admin login,admin@example.com,admin123,admin,success
Invalid password,admin@example.com,wrong,admin,error
```

## Test Configuration Examples

### UI Test Configuration

```typescript
test.describe('Data-Driven UI Tests', () => {
  let testCases: any[];

  test.beforeAll(async () => {
    const config: DataDrivenTestConfig = {
      dataSource: 'login-test-data.csv',
      format: 'csv',
      filterBy: { expectedResult: 'success' },
      testNameField: 'testName'
    };
    
    const data = await DataUtils.loadTestData(config);
    testCases = DataUtils.generateParameterizedTests(data, 'testName');
  });

  for (let i = 0; i < (testCases?.length || 0); i++) {
    test(`${testCases[i].name}`, async ({ loginPage }) => {
      const testData = testCases[i].data;
      await loginPage.login(testData.username, testData.password);
      expect(await loginPage.isLoggedIn()).toBe(true);
    });
  }
});
```

### API Test Configuration

```typescript
test.describe('Data-Driven API Tests', () => {
  let apiTests: any[];

  test.beforeAll(async () => {
    const apiTestData = await DataUtils.getTestDataByCategory('api-test-data.json', 'userApiTests');
    apiTests = DataUtils.generateParameterizedTests(apiTestData, 'testName');
  });

  for (let i = 0; i < (apiTests?.length || 0); i++) {
    test(`${apiTests[i].name}`, async ({ apiUtils }) => {
      const testData = apiTests[i].data;
      
      const response = await apiUtils[testData.method.toLowerCase()](
        testData.endpoint, 
        testData.payload
      );
      
      expect(response.status).toBe(testData.expectedStatus);
    });
  }
});
```

### Database Test Configuration

```typescript
test.describe('Data-Driven Database Tests', () => {
  let dbTests: any[];

  test.beforeAll(async () => {
    const dbTestData = await DataUtils.getTestDataByCategory('database-test-data.json', 'userQueries');
    dbTests = DataUtils.generateParameterizedTests(dbTestData, 'testName');
  });

  for (let i = 0; i < (dbTests?.length || 0); i++) {
    test(`${dbTests[i].name}`, async ({ dbUtils }) => {
      const testData = dbTests[i].data;
      
      const result = await dbUtils.query(testData.query, testData.parameters);
      
      if (testData.expectedRowCount !== undefined) {
        expect(result.length).toBe(testData.expectedRowCount);
      }
    });
  }
});
```

## Best Practices

### 1. Test Data Organization

- Keep test data files organized by feature or test type
- Use descriptive file names and test names
- Include expected results in test data
- Separate positive and negative test cases

### 2. Test Generation Strategy

- Use boundary value testing for numeric inputs
- Use equivalence class testing for categorical inputs
- Use pairwise testing for multiple parameter combinations
- Use negative testing for error scenarios

### 3. Performance Considerations

- Limit the number of generated test cases for large datasets
- Use filtering to focus on relevant test scenarios
- Consider test execution time when generating dynamic tests
- Use test.step() for sub-test organization

### 4. Maintenance

- Keep test data synchronized with application changes
- Use data transformation functions for format changes
- Validate test data structure before execution
- Document test data requirements and formats

## Troubleshooting

### Common Issues

1. **Test data not found**: Ensure file paths are correct and files exist
2. **Invalid data format**: Validate JSON syntax and CSV structure
3. **Missing test fields**: Use DataUtils.validateTestData() to check required fields
4. **Performance issues**: Limit test case generation and use filtering

### Debugging Tips

- Use console.log to inspect loaded test data
- Validate test data structure before generating tests
- Check file paths and permissions
- Use try-catch blocks for error handling

## Examples

See the following test files for complete examples:
- `tests/ui/login.ui.spec.ts` - Authentication and UI tests
- `tests/ui/data-driven.ui.spec.ts` - Basic data-driven UI tests (if available)
- `tests/api/users.api.spec.ts` - Data-driven API tests (if available)
- `tests/db/database.db.spec.ts` - Data-driven database tests (if available)

## Integration with Test Configuration

Use the centralized test configuration for consistent settings:

```typescript
import { test, expect } from '@playwright/test';
import TEST_CONFIG from '../../config/test.config';

test.describe('Data-Driven Tests with Config', () => {
  test('should use configured timeouts', async ({ page }) => {
    // Use centralized timeout configuration
    await page.goto('/', { timeout: TEST_CONFIG.DEFAULT_TIMEOUT });
    
    // Use configured paths
    const downloadPath = TEST_CONFIG.PATHS.DOWNLOADS;
    
    // Use configured credentials
    const { username, password } = TEST_CONFIG.ADMIN;
  });
});
```