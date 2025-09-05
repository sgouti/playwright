import { DataUtils, DataDrivenTestConfig, TestDataItem } from './DataUtils';

export interface TestGeneratorConfig {
  testName: string;
  dataSource?: string;
  dataFormat?: 'json' | 'csv';
  category?: string;
  filterBy?: { [key: string]: any };
  transformData?: (data: any) => any;
  generateDynamic?: () => any[];
  testNameField?: string;
}

export interface GeneratedTest {
  name: string;
  data: any;
  config: TestGeneratorConfig;
}

export class TestGeneratorUtils {
  
  /**
   * Generate parameterized tests from configuration
   */
  static async generateTests(config: TestGeneratorConfig): Promise<GeneratedTest[]> {
    let testData: any[] = [];

    if (config.generateDynamic) {
      // Generate dynamic test data
      testData = config.generateDynamic();
    } else if (config.dataSource) {
      // Load from data source
      if (config.category) {
        testData = await DataUtils.getTestDataByCategory(config.dataSource, config.category);
      } else {
        const dataConfig: DataDrivenTestConfig = {
          dataSource: config.dataSource,
          format: config.dataFormat || 'json',
          filterBy: config.filterBy,
          transformData: config.transformData
        };
        testData = await DataUtils.loadTestData(dataConfig);
      }
    }

    const parameterizedTests = DataUtils.generateParameterizedTests(
      testData, 
      config.testNameField || 'testName'
    );

    return parameterizedTests.map(test => ({
      name: test.name,
      data: test.data,
      config: config
    }));
  }

  /**
   * Generate boundary value tests
   */
  static generateBoundaryTests(
    field: string,
    boundaries: { min: number; max: number },
    validTemplate: any,
    testNamePrefix: string = 'Boundary test'
  ): any[] {
    const boundaryValues = [
      boundaries.min - 1,  // Below minimum
      boundaries.min,      // Minimum
      boundaries.min + 1,  // Above minimum
      boundaries.max - 1,  // Below maximum
      boundaries.max,      // Maximum
      boundaries.max + 1   // Above maximum
    ];

    return boundaryValues.map(value => ({
      testName: `${testNamePrefix}: ${field} = ${value}`,
      ...validTemplate,
      [field]: value,
      expectedResult: (value >= boundaries.min && value <= boundaries.max) ? 'success' : 'error'
    }));
  }

  /**
   * Generate equivalence class tests
   */
  static generateEquivalenceTests(
    field: string,
    equivalenceClasses: { [className: string]: { values: any[]; expectedResult: string } },
    validTemplate: any,
    testNamePrefix: string = 'Equivalence test'
  ): any[] {
    const tests: any[] = [];

    Object.entries(equivalenceClasses).forEach(([className, classData]) => {
      classData.values.forEach((value, index) => {
        tests.push({
          testName: `${testNamePrefix}: ${field} ${className} (${index + 1})`,
          ...validTemplate,
          [field]: value,
          expectedResult: classData.expectedResult,
          equivalenceClass: className
        });
      });
    });

    return tests;
  }

  /**
   * Generate pairwise combination tests
   */
  static generatePairwiseTests(
    parameters: { [paramName: string]: any[] },
    validTemplate: any,
    testNamePrefix: string = 'Pairwise test'
  ): any[] {
    const paramNames = Object.keys(parameters);
    const paramValues = Object.values(parameters);
    
    // Simple pairwise generation (for demo - in production, use a proper pairwise library)
    const combinations = DataUtils.createTestCombinations(...paramValues);
    
    return combinations.slice(0, 10).map((combination, index) => { // Limit to 10 for demo
      const testData = { ...validTemplate };
      const testNameParts: string[] = [];
      
      paramNames.forEach((paramName, paramIndex) => {
        testData[paramName] = combination[paramIndex];
        testNameParts.push(`${paramName}=${combination[paramIndex]}`);
      });
      
      return {
        testName: `${testNamePrefix} ${index + 1}: ${testNameParts.join(', ')}`,
        ...testData
      };
    });
  }

  /**
   * Generate negative test cases
   */
  static generateNegativeTests(
    field: string,
    invalidValues: any[],
    validTemplate: any,
    expectedErrors: string[],
    testNamePrefix: string = 'Negative test'
  ): any[] {
    return invalidValues.map((value, index) => ({
      testName: `${testNamePrefix}: ${field} = ${JSON.stringify(value)}`,
      ...validTemplate,
      [field]: value,
      expectedResult: 'error',
      expectedMessage: expectedErrors[index] || 'Validation error'
    }));
  }

  /**
   * Generate performance test scenarios
   */
  static generatePerformanceTests(
    baseScenario: any,
    loadLevels: number[],
    testNamePrefix: string = 'Performance test'
  ): any[] {
    return loadLevels.map(load => ({
      testName: `${testNamePrefix}: ${load} concurrent users`,
      ...baseScenario,
      concurrentUsers: load,
      expectedResponseTime: load <= 10 ? 1000 : load <= 50 ? 3000 : 5000
    }));
  }

  /**
   * Generate cross-browser test variations
   */
  static generateCrossBrowserTests(
    baseTest: any,
    browsers: string[],
    testNamePrefix: string = 'Cross-browser test'
  ): any[] {
    return browsers.map(browser => ({
      testName: `${testNamePrefix}: ${baseTest.testName || 'Test'} on ${browser}`,
      ...baseTest,
      targetBrowser: browser,
      browserSpecific: true
    }));
  }

  /**
   * Generate data-driven test suite from multiple sources
   */
  static async generateTestSuite(configs: TestGeneratorConfig[]): Promise<{ [suiteName: string]: GeneratedTest[] }> {
    const testSuite: { [suiteName: string]: GeneratedTest[] } = {};

    for (const config of configs) {
      const tests = await this.generateTests(config);
      testSuite[config.testName] = tests;
    }

    return testSuite;
  }

  /**
   * Validate test data completeness
   */
  static validateTestCoverage(
    generatedTests: GeneratedTest[],
    requiredFields: string[],
    coverageThreshold: number = 0.8
  ): { isValid: boolean; coverage: number; missingFields: string[] } {
    const fieldCoverage: { [field: string]: number } = {};
    const totalTests = generatedTests.length;

    requiredFields.forEach(field => {
      const testsWithField = generatedTests.filter(test => 
        test.data.hasOwnProperty(field) && test.data[field] !== undefined
      ).length;
      fieldCoverage[field] = testsWithField / totalTests;
    });

    const averageCoverage = Object.values(fieldCoverage).reduce((sum, coverage) => sum + coverage, 0) / requiredFields.length;
    const missingFields = requiredFields.filter(field => fieldCoverage[field] < coverageThreshold);

    return {
      isValid: averageCoverage >= coverageThreshold,
      coverage: averageCoverage,
      missingFields
    };
  }
}