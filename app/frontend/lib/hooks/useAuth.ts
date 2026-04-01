/**
 * Authentication hooks for managing auth state and operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/lib/api';
import { AuthState, User, ApiClientError } from '@/lib/types';

export function useAuth(): AuthState & {
  signIn: (provider: 'google') => Promise<void>;
  signOut: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  refreshAuth: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    error: null,
    user: null,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const { accessToken, refreshToken } = authService.getStoredTokens();
      
      if (!accessToken) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
        return;
      }

      // Try to get current user to validate token
      const user = await authService.getCurrentUser();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        user,
        isAuthenticated: true,
        accessToken,
        refreshToken,
      }));
    } catch (error) {
      // Token is invalid, clear it
      authService.clearTokens();
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        user: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
      }));
    }
  }, []);

  const signIn = useCallback(async (provider: 'google') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authService.signInWithGoogle();
      
      // Store tokens
      authService.storeTokens(response.access_token, response.refresh_token);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        user: response.user,
        isAuthenticated: true,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiClientError 
        ? error.message 
        : 'Sign in failed';
        
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authService.signOut();
    } catch (error) {
      // Continue with sign out even if API call fails
      console.warn('Sign out API call failed:', error);
    } finally {
      // Always clear local state and tokens
      authService.clearTokens();
      setState({
        isLoading: false,
        error: null,
        user: null,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
      });
    }
  }, []);

  const refreshTokens = useCallback(async () => {
    const { refreshToken } = authService.getStoredTokens();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(refreshToken);
      
      // Update stored tokens
      authService.storeTokens(response.access_token, response.refresh_token);
      
      setState(prev => ({
        ...prev,
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        error: null,
      }));
    } catch (error) {
      // Refresh failed, sign out user
      await signOut();
      throw error;
    }
  }, [signOut]);

  return {
    ...state,
    signIn,
    signOut,
    refreshTokens,
    refreshAuth: initializeAuth,
  };
}