/**
 * Health Check API service.
 * Handles health and readiness check API calls.
 */

import httpClient from './http-client';
import { HealthResponse, ReadinessResponse, RequestConfig } from '@/lib/types';

export class HealthService {
  /**
   * Check application health
   */
  async checkHealth(config?: RequestConfig): Promise<HealthResponse> {
    return httpClient.get<HealthResponse>('/health', { 
      ...config, 
      includeAuth: false 
    });
  }

  /**
   * Check application readiness
   */
  async checkReadiness(config?: RequestConfig): Promise<ReadinessResponse> {
    return httpClient.get<ReadinessResponse>('/readiness', { 
      ...config, 
      includeAuth: false 
    });
  }
}

// Export singleton instance
export const healthService = new HealthService();
export default healthService;