/**
 * Boarding pass hooks for file upload and parsing operations.
 */

import { useState, useCallback } from 'react';
import { boardingPassService } from '@/lib/api';
import { BoardingPassState, BoardingPassData, SupportedAirline, ApiClientError } from '@/lib/types';

export function useBoardingPass(): BoardingPassState & {
  uploadFile: (file: File) => Promise<BoardingPassData>;
  clearBoardingPass: () => void;
  loadSupportedAirlines: () => Promise<void>;
} {
  const [state, setState] = useState<BoardingPassState>({
    isLoading: false,
    error: null,
    currentBoardingPass: null,
    supportedAirlines: [],
  });

  const uploadFile = useCallback(async (file: File): Promise<BoardingPassData> => {
    // Validate file first
    const validation = boardingPassService.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await boardingPassService.parseBoardingPass(file);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to parse boarding pass');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        currentBoardingPass: response.data,
      }));

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : error instanceof Error 
        ? error.message 
        : 'Failed to upload boarding pass';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, []);

  const clearBoardingPass = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentBoardingPass: null,
      error: null,
    }));
  }, []);

  const loadSupportedAirlines = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await boardingPassService.getSupportedAirlines();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        supportedAirlines: response.supported_airlines,
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : 'Failed to load supported airlines';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  return {
    ...state,
    uploadFile,
    clearBoardingPass,
    loadSupportedAirlines,
  };
}