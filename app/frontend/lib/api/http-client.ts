/**
 * HTTP client configuration and utilities.
 * Provides a centralized way to handle API requests with error handling,
 * authentication, and retry logic.
 */

import { ApiError, RequestConfig, ApiClientError } from '@/lib/types';
import config from '@/lib/config';
class HttpClient {
  private baseURL: string;
  private defaultTimeout: number = 10000;
  private defaultRetries: number = 2;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Make an HTTP request with proper error handling and retries.
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const timeout = config.timeout ?? this.defaultTimeout;
    const maxRetries = config.retries ?? this.defaultRetries;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    // Add authentication header if needed
    if (config.includeAuth !== false) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: ApiError = await response.json();
          throw new ApiClientError(
            errorData.error?.message || `HTTP ${response.status}`,
            response.status,
            errorData.error?.code || 'API_ERROR',
            errorData
          );
        }

        const data: T = await response.json();
        return data;

      } catch (error) {
        attempt++;
        
        // Don't retry on authentication errors or client errors (4xx)
        if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Retry on network errors or 5xx errors
        if (attempt <= maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }
        
        // Re-throw after exhausting retries
        if (error instanceof ApiClientError) {
          throw error;
        }
        
        throw new ApiClientError(
          error instanceof Error ? error.message : 'Network request failed',
          0,
          'NETWORK_ERROR',
          null
        );
      }
    }

    throw new ApiClientError('Max retries exceeded', 0, 'MAX_RETRIES', null);
  }

  /**
   * GET request
   */
  get<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, config);
  }

  /**
   * POST request
   */
  post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    const headers: Record<string, string> = data instanceof FormData ? {} : { 'Content-Type': 'application/json' };
    
    return this.request<T>(
      endpoint, 
      { method: 'POST', body, headers }, 
      config
    );
  }

  /**
   * PUT request
   */
  put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(
      endpoint,
      { method: 'PUT', body: JSON.stringify(data) },
      config
    );
  }

  /**
   * DELETE request
   */
  delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, config);
  }

  /**
   * Upload file
   */
  upload<T = any>(endpoint: string, file: File, config?: RequestConfig): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request<T>(
      endpoint,
      { method: 'POST', body: formData },
      { ...config, includeAuth: config?.includeAuth !== false }
    );
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  /**
   * Utility function to create delays for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create and export the default HTTP client
const httpClient = new HttpClient(config.api.baseUrl);

export { httpClient, ApiClientError };
export default httpClient;