import httpClient from './http-client';
import type { BookingResponse } from './flight-service';
import {
  SupportedAirlinesResponse,
  RequestConfig
} from '@/lib/types';

export async function uploadBoardingPass(file: File): Promise<BookingResponse> {
  return httpClient.upload<BookingResponse>('/boarding-pass/upload', file);
}

export class BoardingPassService {
  /**
   * Parse boarding pass PDF file
   */
  async parseBoardingPass(file: File, config?: RequestConfig): Promise<BookingResponse> {
    return httpClient.upload<BookingResponse>('/boarding-pass/upload', file, config);
  }

  /**
   * Get list of supported airlines
   */
  async getSupportedAirlines(config?: RequestConfig): Promise<SupportedAirlinesResponse> {
    return httpClient.get<SupportedAirlinesResponse>('/boarding-pass/supported-airlines', config);
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'Only PDF files are supported' };
    }

    // Check file size (5MB limit)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      return { valid: false, error: 'File size too large. Maximum size is 5MB' };
    }

    // Check if file is empty
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const boardingPassService = new BoardingPassService();
export default boardingPassService;