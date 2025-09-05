import { config } from '@config/env.config';
import { TEST_CONFIG } from '@config/test.config';

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  insert(table: string, data: any): Promise<any>;
  update(table: string, data: any, where: any): Promise<any>;
  delete(table: string, where: any): Promise<any>;
  cleanup(): Promise<void>;
}

export class MockDatabaseUtils implements DatabaseConnection {
  private isConnected: boolean = false;
  private mockData: Map<string, any[]> = new Map();

  constructor() {
    // Initialize with some mock data
    this.mockData.set('users', [
      { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
      { id: 2, username: 'user', email: 'user@example.com', role: 'user' },
    ]);
    this.mockData.set('products', [
      { id: 1, name: 'Product 1', price: 99.99, category: 'electronics' },
      { id: 2, name: 'Product 2', price: 149.99, category: 'books' },
    ]);
  }

  async connect(): Promise<void> {
    console.log(`Connecting to database: ${config.dbConnectionString}`);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.isConnected = true;
    console.log('Database connected successfully');
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      console.log('Disconnecting from database');
      this.isConnected = false;
      console.log('Database disconnected');
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    this.ensureConnected();
    
    console.log(`Executing query: ${sql}`, params ? `with params: ${JSON.stringify(params)}` : '');
    
    // Simple mock query parsing
    const lowerSql = sql.toLowerCase().trim();
    
    if (lowerSql.startsWith('select')) {
      return this.handleSelectQuery(sql, params);
    } else if (lowerSql.startsWith('insert')) {
      return this.handleInsertQuery(sql, params);
    } else if (lowerSql.startsWith('update')) {
      return this.handleUpdateQuery(sql, params);
    } else if (lowerSql.startsWith('delete')) {
      return this.handleDeleteQuery(sql, params);
    }
    
    return { success: true, message: 'Query executed successfully' };
  }

  async insert(table: string, data: any): Promise<any> {
    this.ensureConnected();
    
    const tableData = this.mockData.get(table) || [];
    const newId = Math.max(...tableData.map(item => item.id || 0), 0) + 1;
    const newRecord = { id: newId, ...data };
    
    tableData.push(newRecord);
    this.mockData.set(table, tableData);
    
    console.log(`Inserted record into ${table}:`, newRecord);
    return { insertedId: newId, record: newRecord };
  }

  async update(table: string, data: any, where: any): Promise<any> {
    this.ensureConnected();
    
    const tableData = this.mockData.get(table) || [];
    let updatedCount = 0;
    
    for (let i = 0; i < tableData.length; i++) {
      if (this.matchesWhere(tableData[i], where)) {
        tableData[i] = { ...tableData[i], ...data };
        updatedCount++;
      }
    }
    
    this.mockData.set(table, tableData);
    console.log(`Updated ${updatedCount} records in ${table}`);
    return { updatedCount, success: true };
  }

  async delete(table: string, where: any): Promise<any> {
    this.ensureConnected();
    
    const tableData = this.mockData.get(table) || [];
    const originalLength = tableData.length;
    
    const filteredData = tableData.filter(record => !this.matchesWhere(record, where));
    const deletedCount = originalLength - filteredData.length;
    
    this.mockData.set(table, filteredData);
    console.log(`Deleted ${deletedCount} records from ${table}`);
    return { deletedCount, success: true };
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up test data...');
    
    // Reset to initial state
    this.mockData.clear();
    this.mockData.set('users', [
      { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
      { id: 2, username: 'user', email: 'user@example.com', role: 'user' },
    ]);
    this.mockData.set('products', [
      { id: 1, name: 'Product 1', price: 99.99, category: 'electronics' },
      { id: 2, name: 'Product 2', price: 149.99, category: 'books' },
    ]);
    
    console.log('Test data cleanup completed');
  }

  // Helper methods
  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }

  private handleSelectQuery(sql: string, params?: any[]): any {
    // Extract table name from SELECT query
    const tableMatch = sql.match(/from\s+(\w+)/i);
    if (!tableMatch) {
      return [];
    }
    
    const tableName = tableMatch[1];
    const tableData = this.mockData.get(tableName) || [];
    
    // Simple WHERE clause handling
    const whereMatch = sql.match(/where\s+(.+?)(?:\s+order|\s+limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      return tableData.filter(record => this.evaluateWhereClause(record, whereClause, params));
    }
    
    return tableData;
  }

  private handleInsertQuery(sql: string, params?: any[]): any {
    const tableMatch = sql.match(/insert\s+into\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Invalid INSERT query');
    }
    
    const tableName = tableMatch[1];
    const valuesMatch = sql.match(/values\s*\(([^)]+)\)/i);
    
    if (valuesMatch && params) {
      const data: any = {};
      // This is a simplified implementation
      // In a real scenario, you'd parse the column names and map them to values
      data.value = params[0];
      return this.insert(tableName, data);
    }
    
    return { success: true };
  }

  private handleUpdateQuery(sql: string, params?: any[]): any {
    const tableMatch = sql.match(/update\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Invalid UPDATE query');
    }
    
    const tableName = tableMatch[1];
    // Simplified implementation
    return { updatedCount: 1, success: true };
  }

  private handleDeleteQuery(sql: string, params?: any[]): any {
    const tableMatch = sql.match(/delete\s+from\s+(\w+)/i);
    if (!tableMatch) {
      throw new Error('Invalid DELETE query');
    }
    
    const tableName = tableMatch[1];
    // Simplified implementation
    return { deletedCount: 1, success: true };
  }

  private matchesWhere(record: any, where: any): boolean {
    for (const key in where) {
      if (record[key] !== where[key]) {
        return false;
      }
    }
    return true;
  }

  private evaluateWhereClause(record: any, whereClause: string, params?: any[]): boolean {
    // Very simplified WHERE clause evaluation
    // In a real implementation, you'd use a proper SQL parser
    return true;
  }

  // Utility methods for testing
  async seedTestData(table: string, data: any[]): Promise<void> {
    this.ensureConnected();
    this.mockData.set(table, data);
    console.log(`Seeded ${data.length} records into ${table}`);
  }

  async getTableData(table: string): Promise<any[]> {
    this.ensureConnected();
    return this.mockData.get(table) || [];
  }

  async clearTable(table: string): Promise<void> {
    this.ensureConnected();
    this.mockData.set(table, []);
    console.log(`Cleared all data from ${table}`);
  }

  async verifyRecordExists(table: string, where: any): Promise<boolean> {
    this.ensureConnected();
    const tableData = this.mockData.get(table) || [];
    return tableData.some(record => this.matchesWhere(record, where));
  }

  async getRecordCount(table: string, where?: any): Promise<number> {
    this.ensureConnected();
    const tableData = this.mockData.get(table) || [];
    
    if (where) {
      return tableData.filter(record => this.matchesWhere(record, where)).length;
    }
    
    return tableData.length;
  }

  async executeTransaction(operations: (() => Promise<any>)[]): Promise<any[]> {
    this.ensureConnected();
    console.log('Starting transaction...');
    
    const results: any[] = [];
    
    try {
      for (const operation of operations) {
        const result = await operation();
        results.push(result);
      }
      
      console.log('Transaction completed successfully');
      return results;
    } catch (error) {
      console.log('Transaction failed, rolling back...');
      // In a real database, you'd rollback here
      throw error;
    }
  }
}

// Factory function to create database instance
export function createDatabaseConnection(): DatabaseConnection {
  // In a real implementation, you'd return different implementations
  // based on the database type (MySQL, PostgreSQL, MongoDB, etc.)
  return new MockDatabaseUtils();
}

// Singleton instance for global use
let dbInstance: DatabaseConnection | null = null;

export async function getDatabase(): Promise<DatabaseConnection> {
  if (!dbInstance) {
    dbInstance = createDatabaseConnection();
    await dbInstance.connect();
  }
  return dbInstance;
}

export async function closeDatabaseConnection(): Promise<void> {
  if (dbInstance) {
    await dbInstance.disconnect();
    dbInstance = null;
  }
}