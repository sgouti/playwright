import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { TEST_CONFIG } from '@config/test.config';

export interface TestDataItem {
  testName?: string;
  [key: string]: any;
}

export interface DataDrivenTestConfig {
  dataSource: string;
  format: 'json' | 'csv';
  testNameField?: string;
  filterBy?: { [key: string]: any };
  transformData?: (data: any) => any;
}

export class DataUtils {
  private static dataPath = TEST_CONFIG.TEST_DATA_PATH;

  /**
   * Load JSON test data from file
   */
  static async loadJsonData(fileName: string): Promise<any> {
    const filePath = path.join(this.dataPath, fileName);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Load CSV test data from file
   */
  static async loadCsvData(fileName: string): Promise<any[]> {
    const filePath = path.join(this.dataPath, fileName);
    const results: any[] = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Load test data based on configuration
   */
  static async loadTestData(config: DataDrivenTestConfig): Promise<TestDataItem[]> {
    let data: any;
    
    if (config.format === 'json') {
      data = await this.loadJsonData(config.dataSource);
    } else if (config.format === 'csv') {
      data = await this.loadCsvData(config.dataSource);
    } else {
      throw new Error(`Unsupported data format: ${config.format}`);
    }

    // Extract test data array from JSON if it's nested
    let testData: any[] = Array.isArray(data) ? data : Object.values(data).flat();

    // Filter data if filter criteria provided
    if (config.filterBy) {
      testData = testData.filter(item => {
        return Object.entries(config.filterBy!).every(([key, value]) => item[key] === value);
      });
    }

    // Transform data if transformer provided
    if (config.transformData) {
      testData = testData.map(config.transformData);
    }

    return testData;
  }

  /**
   * Generate parameterized test cases from data
   */
  static generateParameterizedTests<T extends TestDataItem>(
    testData: T[],
    testNameField: string = 'testName'
  ): Array<{ name: string; data: T }> {
    return testData.map((item, index) => ({
      name: item[testNameField] || `Test case ${index + 1}`,
      data: item
    }));
  }

  /**
   * Create test data combinations from multiple arrays
   */
  static createTestCombinations(...arrays: any[][]): any[][] {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map(item => [item]);
    
    const [first, ...rest] = arrays;
    const restCombinations = this.createTestCombinations(...rest);
    
    return first.flatMap(firstItem =>
      restCombinations.map(restCombination => [firstItem, ...restCombination])
    );
  }

  /**
   * Generate test data programmatically
   */
  static generateTestData(count: number): any[] {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        id: i + 1,
        username: `user${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: i % 2 === 0 ? 'user' : 'admin'
      });
    }
    return data;
  }

  /**
   * Validate test data structure
   */
  static validateTestData(data: any[], requiredFields: string[]): boolean {
    return data.every(item => 
      requiredFields.every(field => item.hasOwnProperty(field))
    );
  }

  /**
   * Get test data by category from JSON file
   */
  static async getTestDataByCategory(fileName: string, category: string): Promise<any[]> {
    const data = await this.loadJsonData(fileName);
    return data[category] || [];
  }

  /**
   * Merge multiple test data sources
   */
  static async mergeTestDataSources(...configs: DataDrivenTestConfig[]): Promise<TestDataItem[]> {
    const allData: TestDataItem[] = [];
    
    for (const config of configs) {
      const data = await this.loadTestData(config);
      allData.push(...data);
    }
    
    return allData;
  }
}