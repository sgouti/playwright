import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { config } from '@config/env.config';
import { TEST_CONFIG } from '@config/test.config';

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  validateStatus?: boolean;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
}

export class ApiUtils {
  private apiContext: APIRequestContext;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(apiContext?: APIRequestContext) {
    this.baseUrl = config.apiUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (apiContext) {
      this.apiContext = apiContext;
    }
  }

  /**
   * Initialize API context if not provided in constructor
   */
  async init(): Promise<void> {
    if (!this.apiContext) {
      this.apiContext = await request.newContext({
        baseURL: this.baseUrl,
        timeout: TEST_CONFIG.API_TIMEOUT,
        extraHTTPHeaders: this.defaultHeaders,
      });
    }
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Set custom header
   */
  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * GET request
   */
  async get(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse> {
    return this.makeRequest('GET', endpoint, undefined, options);
  }

  /**
   * POST request
   */
  async post(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse> {
    return this.makeRequest('POST', endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse> {
    return this.makeRequest('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse> {
    return this.makeRequest('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse> {
    return this.makeRequest('DELETE', endpoint, undefined, options);
  }

  /**
   * Upload file
   */
  async uploadFile(endpoint: string, filePath: string, fieldName: string = 'file', options?: ApiRequestOptions): Promise<ApiResponse> {
    await this.ensureContext();
    
    const startTime = Date.now();
    
    const response = await this.apiContext.post(endpoint, {
      multipart: {
        [fieldName]: {
          name: filePath.split('/').pop() || 'file',
          mimeType: 'application/octet-stream',
          buffer: Buffer.from('mock file content'), // In real scenario, read actual file
        },
      },
      headers: { ...this.defaultHeaders, ...options?.headers },
      timeout: options?.timeout || TEST_CONFIG.API_TIMEOUT,
    });
    
    const responseTime = Date.now() - startTime;
    
    return this.processResponse(response, responseTime);
  }

  /**
   * Make authenticated request
   */
  async authenticatedRequest(method: string, endpoint: string, data?: any, token?: string): Promise<ApiResponse> {
    const originalToken = this.defaultHeaders['Authorization'];
    
    if (token) {
      this.setAuthToken(token);
    }
    
    try {
      return await this.makeRequest(method as any, endpoint, data);
    } finally {
      if (originalToken) {
        this.defaultHeaders['Authorization'] = originalToken;
      } else {
        this.removeAuthToken();
      }
    }
  }

  /**
   * Batch requests
   */
  async batchRequests(requests: Array<{
    method: string;
    endpoint: string;
    data?: any;
    options?: ApiRequestOptions;
  }>): Promise<ApiResponse[]> {
    const promises = requests.map(req => 
      this.makeRequest(req.method as any, req.endpoint, req.data, req.options)
    );
    
    return Promise.all(promises);
  }

  /**
   * Wait for API to be ready
   */
  async waitForApiReady(healthEndpoint: string = '/health', maxAttempts: number = 10): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.get(healthEndpoint, { timeout: 5000 });
        if (response.status === 200) {
          console.log(`API is ready after ${attempt} attempts`);
          return true;
        }
      } catch (error) {
        console.log(`API health check attempt ${attempt} failed:`, error);
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`API not ready after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Validate response schema
   */
  validateResponseSchema(response: ApiResponse, expectedSchema: any): boolean {
    try {
      // Simple schema validation - in real project use ajv or similar
      return this.validateObject(response.body, expectedSchema);
    } catch (error) {
      console.error('Schema validation failed:', error);
      return false;
    }
  }

  /**
   * Log request and response
   */
  private logRequest(method: string, endpoint: string, data?: any, headers?: Record<string, string>): void {
    console.log(`API Request: ${method} ${endpoint}`);
    if (data) {
      console.log('Request Body:', JSON.stringify(data, null, 2));
    }
    if (headers) {
      console.log('Request Headers:', headers);
    }
  }

  private logResponse(response: ApiResponse): void {
    console.log(`API Response: ${response.status} ${response.statusText}`);
    console.log(`Response Time: ${response.responseTime}ms`);
    if (response.body) {
      console.log('Response Body:', JSON.stringify(response.body, null, 2));
    }
  }

  /**
   * Core request method with retry logic
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse> {
    await this.ensureContext();
    
    const maxRetries = options?.retries || TEST_CONFIG.API_RETRY_COUNT;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        
        const requestOptions: any = {
          headers: { ...this.defaultHeaders, ...options?.headers },
          timeout: options?.timeout || TEST_CONFIG.API_TIMEOUT,
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          requestOptions.data = data;
        }
        
        this.logRequest(method, endpoint, data, requestOptions.headers);
        
        let response: APIResponse;
        
        switch (method) {
          case 'GET':
            response = await this.apiContext.get(endpoint, requestOptions);
            break;
          case 'POST':
            response = await this.apiContext.post(endpoint, requestOptions);
            break;
          case 'PUT':
            response = await this.apiContext.put(endpoint, requestOptions);
            break;
          case 'PATCH':
            response = await this.apiContext.patch(endpoint, requestOptions);
            break;
          case 'DELETE':
            response = await this.apiContext.delete(endpoint, requestOptions);
            break;
        }
        
        const responseTime = Date.now() - startTime;
        const apiResponse = await this.processResponse(response, responseTime);
        
        this.logResponse(apiResponse);
        
        // Validate status if required
        if (options?.validateStatus !== false && !this.isSuccessStatus(apiResponse.status)) {
          throw new Error(`Request failed with status ${apiResponse.status}: ${apiResponse.statusText}`);
        }
        
        return apiResponse;
        
      } catch (error) {
        lastError = error as Error;
        console.log(`API request attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('API request failed after all retries');
  }

  /**
   * Process API response
   */
  private async processResponse(response: APIResponse, responseTime: number): Promise<ApiResponse> {
    let body: any;
    
    try {
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else if (contentType.includes('text/')) {
        body = await response.text();
      } else {
        body = await response.body();
      }
    } catch (error) {
      console.warn('Failed to parse response body:', error);
      body = null;
    }
    
    return {
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      body,
      responseTime,
    };
  }

  /**
   * Check if status code indicates success
   */
  private isSuccessStatus(status: number): boolean {
    return status >= 200 && status < 300;
  }

  /**
   * Simple object validation
   */
  private validateObject(obj: any, schema: any): boolean {
    if (typeof schema !== 'object' || schema === null) {
      return typeof obj === typeof schema;
    }
    
    if (Array.isArray(schema)) {
      return Array.isArray(obj) && obj.every(item => this.validateObject(item, schema[0]));
    }
    
    for (const key in schema) {
      if (!(key in obj)) {
        return false;
      }
      
      if (!this.validateObject(obj[key], schema[key])) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Ensure API context is initialized
   */
  private async ensureContext(): Promise<void> {
    if (!this.apiContext) {
      await this.init();
    }
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.apiContext) {
      await this.apiContext.dispose();
    }
  }
}

// Factory function for creating API utils
export async function createApiUtils(apiContext?: APIRequestContext): Promise<ApiUtils> {
  const apiUtils = new ApiUtils(apiContext);
  await apiUtils.init();
  return apiUtils;
}

// Common API test helpers
export class ApiTestHelpers {
  static async login(apiUtils: ApiUtils, credentials: { username: string; password: string }): Promise<string> {
    const response = await apiUtils.post('/auth/login', credentials);
    
    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const token = response.body?.token || response.body?.access_token;
    if (!token) {
      throw new Error('No token received from login response');
    }
    
    return token;
  }

  static async createTestUser(apiUtils: ApiUtils, userData: any): Promise<any> {
    const response = await apiUtils.post('/users', userData);
    
    if (response.status !== 201) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }
    
    return response.body;
  }

  static async cleanupTestUser(apiUtils: ApiUtils, userId: string): Promise<void> {
    try {
      await apiUtils.delete(`/users/${userId}`);
    } catch (error) {
      console.warn(`Failed to cleanup test user ${userId}:`, error);
    }
  }
}