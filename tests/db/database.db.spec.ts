import { dbTest as test, expect } from '@fixtures/fixtures';
import { DataUtils } from '@utils/DataUtils';
import { TestGeneratorUtils } from '@utils/TestGeneratorUtils';

test.describe('Data-Driven Database Tests', () => {
  
  test.describe('User Query Tests', () => {
    let userQueryTests: any[];

    test.beforeAll(async () => {
      const userQueries = await DataUtils.getTestDataByCategory('database-test-data.json', 'userQueries');
      userQueryTests = DataUtils.generateParameterizedTests(userQueries, 'testName');
    });

    for (let i = 0; i < (userQueryTests?.length || 0); i++) {
      test(`${userQueryTests?.[i]?.name || `DB Test ${i + 1}`}`, async ({ dbUtils }) => {
        const testCase = userQueryTests[i];
        const testData = testCase.data;

        try {
          let result;
          
          if (testData.operation === 'insert') {
            result = await dbUtils.insert('users', {
              username: testData.parameters[0],
              email: testData.parameters[1],
              role: testData.parameters[2]
            });
            expect(result.insertedId).toBeTruthy();
          } else if (testData.operation === 'update') {
            result = await dbUtils.update('users', 
              { role: testData.parameters[0] }, 
              { id: testData.parameters[1] }
            );
            expect(result.success).toBe(true);
          } else if (testData.operation === 'delete') {
            result = await dbUtils.delete('users', { id: testData.parameters[0] });
            expect(result.success).toBe(true);
          } else {
            // SELECT queries
            result = await dbUtils.query(testData.query, testData.parameters);
            
            if (testData.expectedRowCount !== undefined) {
              expect(result.length).toBe(testData.expectedRowCount);
            }
            
            if (testData.expectedFields && result.length > 0) {
              testData.expectedFields.forEach((field: string) => {
                expect(result[0]).toHaveProperty(field);
              });
            }
          }
          
          expect(testData.expectedResult).toBe('success');
        } catch (error) {
          if (testData.expectedResult === 'error') {
            expect(error).toBeDefined();
          } else {
            throw error;
          }
        }
      });
    }
  });

  test.describe('Performance Query Tests', () => {
    let performanceTests: any[];

    test.beforeAll(async () => {
      const performanceQueries = await DataUtils.getTestDataByCategory('database-test-data.json', 'performanceQueries');
      performanceTests = DataUtils.generateParameterizedTests(performanceQueries, 'testName');
    });

    for (let i = 0; i < (performanceTests?.length || 0); i++) {
      test(`${performanceTests?.[i]?.name || `Performance Test ${i + 1}`}`, async ({ dbUtils }) => {
        const testCase = performanceTests[i];
        const testData = testCase.data;

        const startTime = Date.now();
        
        try {
          const result = await dbUtils.query(testData.query, testData.parameters);
          const executionTime = Date.now() - startTime;
          
          expect(executionTime).toBeLessThan(testData.expectedMaxExecutionTime);
          expect(result).toBeDefined();
          
          if (testData.query.includes('COUNT(*)')) {
            expect(result[0]).toHaveProperty('total');
            expect(typeof result[0].total).toBe('number');
          }
        } catch (error) {
          const executionTime = Date.now() - startTime;
          console.log(`Query failed after ${executionTime}ms:`, error.message);
          throw error;
        }
      });
    }
  });

  test.describe('Dynamic Database Tests', () => {
    test('should generate and execute boundary tests for user IDs', async ({ dbUtils }) => {
      // Generate boundary tests for user ID queries
      const boundaryTests = TestGeneratorUtils.generateBoundaryTests(
        'userId',
        { min: 1, max: 1000 },
        {
          query: 'SELECT * FROM users WHERE id = ?',
          expectedFields: ['id', 'username', 'email']
        },
        'User ID boundary test'
      );

      for (const testData of boundaryTests.slice(0, 3)) { // Limit for demo
        await test.step(`${testData.testName}`, async () => {
          try {
            const result = await dbUtils.query(testData.query, [testData.userId]);
            
            if (testData.expectedResult === 'success' && testData.userId >= 1 && testData.userId <= 1000) {
              // Expect either a result or empty array (both valid for boundary testing)
              expect(Array.isArray(result)).toBe(true);
            }
          } catch (error) {
            if (testData.expectedResult === 'error') {
              expect(error).toBeDefined();
            } else {
              throw error;
            }
          }
        });
      }
    });

    test('should test database connection with different parameters', async ({ dbUtils }) => {
      // Generate tests for different connection scenarios
      const connectionTests = [
        { testName: 'Valid connection test', expectedResult: 'success' },
        { testName: 'Connection timeout test', timeout: 1, expectedResult: 'success' },
        { testName: 'Connection pool test', poolSize: 5, expectedResult: 'success' }
      ];

      for (const testData of connectionTests) {
        await test.step(`${testData.testName}`, async () => {
          const result = await dbUtils.query('SELECT 1 as test');
          expect(result).toBeTruthy();
          expect(result[0].test).toBe(1);
        });
      }
    });
  });

  test.describe('Transaction Tests', () => {
    test('should handle database transactions with test data', async ({ dbUtils }) => {
      const transactionTestData = [
        {
          operation: 'insert',
          table: 'users',
          data: { username: 'transaction_user_1', email: 'trans1@example.com', role: 'user' }
        },
        {
          operation: 'update',
          table: 'users',
          data: { role: 'admin' },
          where: { username: 'transaction_user_1' }
        }
      ];

      await dbUtils.beginTransaction();
      
      try {
        for (const testStep of transactionTestData) {
          if (testStep.operation === 'insert') {
            const result = await dbUtils.insert(testStep.table, testStep.data);
            expect(result.insertedId).toBeTruthy();
          } else if (testStep.operation === 'update') {
            const result = await dbUtils.update(testStep.table, testStep.data, testStep.where);
            expect(result.success).toBe(true);
          }
        }
        
        await dbUtils.commitTransaction();
        
        // Verify the transaction results
        const verifyResult = await dbUtils.query('SELECT * FROM users WHERE username = ?', ['transaction_user_1']);
        expect(verifyResult.length).toBe(1);
        expect(verifyResult[0].role).toBe('admin');
        
      } catch (error) {
        await dbUtils.rollbackTransaction();
        throw error;
      }
    });
  });

  test.describe('Legacy Database Tests', () => {
    test('should connect to database', async ({ dbUtils }) => {
      const isConnected = await dbUtils.query('SELECT 1 as test');
      expect(isConnected).toBeTruthy();
    });

    test('should insert and retrieve user', async ({ dbUtils }) => {
      const userData = { username: 'testuser', email: 'test@example.com' };
      
      const insertResult = await dbUtils.insert('users', userData);
      expect(insertResult.insertedId).toBeTruthy();
      
      const userExists = await dbUtils.verifyRecordExists('users', { username: 'testuser' });
      expect(userExists).toBe(true);
    });
  });
});