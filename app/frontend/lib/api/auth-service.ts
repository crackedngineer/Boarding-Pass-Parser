/**
 * Authentication API service.
 * Handles all authentication-related API calls.
 */

import httpClient from './http-client';
import { 
  AuthResponse, 
  User, 
  TokenRefreshRequest,
  RequestConfig 
} from '@/lib/types';

export class AuthService {
  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(config?: RequestConfig): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/google/signin', {}, config);
  }

  /**
   * Get current user information
   */
  async getCurrentUser(config?: RequestConfig): Promise<User> {
    return httpClient.get<User>('/auth/me', config);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, config?: RequestConfig): Promise<AuthResponse> {
    const request: TokenRefreshRequest = { refresh_token: refreshToken };
    return httpClient.post<AuthResponse>('/auth/refresh', request, config);
  }

  /**
   * Sign out current user
   */
  async signOut(config?: RequestConfig): Promise<{ message: string }> {
    return httpClient.post<{ message: string }>('/auth/signout', {}, config);
  }

  /**
   * Store authentication tokens in localStorage
   */
  storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * Clear authentication tokens from localStorage
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Get stored tokens
   */
  getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }
    
    return {
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token'),
    };
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated(): boolean {
    const { accessToken } = this.getStoredTokens();
    return !!accessToken;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;