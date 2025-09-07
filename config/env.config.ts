import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface EnvironmentConfig {
  baseUrl: string;
  apiUrl: string;
  dbConnectionString: string;
  timeout: number;
  environment: 'dev' | 'staging' | 'prod';
  headless: boolean;
  slowMo: number;
}

const environments: Record<string, EnvironmentConfig> = {
  dev: {
    baseUrl: 'https://www.saucedemo.com/',
    apiUrl: 'http://localhost:3001/api',
    dbConnectionString: 'mongodb://localhost:27017/testdb',
    timeout: 30000,
    environment: 'dev',
    headless: false,
    slowMo: 100,
  },
  staging: {
    baseUrl: 'https://staging.example.com',
    apiUrl: 'https://staging-api.example.com/api',
    dbConnectionString: 'mongodb://staging-db:27017/testdb',
    timeout: 45000,
    environment: 'staging',
    headless: true,
    slowMo: 0,

  },
  prod: {
    baseUrl: 'https://example.com',
    apiUrl: 'https://api.example.com/api',
    dbConnectionString: 'mongodb://prod-db:27017/testdb',
    timeout: 60000,
    environment: 'prod',
    headless: true,
    slowMo: 0,

  },
};

// Get environment from ENV variable or default to 'dev'
const currentEnv = (process.env.TEST_ENV || 'dev') as keyof typeof environments;

// Export the configuration for the current environment
export const config: EnvironmentConfig = {
  ...environments[currentEnv],
  // Allow environment variables to override config values
  baseUrl: process.env.BASE_URL || environments[currentEnv].baseUrl,
  apiUrl: process.env.API_URL || environments[currentEnv].apiUrl,
  dbConnectionString: process.env.DB_CONNECTION_STRING || environments[currentEnv].dbConnectionString,
  timeout: parseInt(process.env.TIMEOUT || '') || environments[currentEnv].timeout,
  headless: process.env.HEADLESS === 'true' || environments[currentEnv].headless,
  slowMo: parseInt(process.env.SLOW_MO || '') || environments[currentEnv].slowMo,
  
  };

export default config;