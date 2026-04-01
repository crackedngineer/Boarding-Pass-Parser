/**
 * Shared type definitions for FlightTrackr application.
 * These types should match the backend API responses.
 */

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    type: string;
    details?: any[];
  };
}

// Custom error class for API operations
export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly status: number; // Alias for statusCode for backward compatibility
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode = 500, code = 'API_ERROR', details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.status = statusCode; // Alias for backward compatibility
    this.code = code;
    this.details = details;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

// Authentication Types
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  name?: string; // Optional name field
  user_metadata: Record<string, any>;
  app_metadata: Record<string, any>;
}

export interface TokenRefreshRequest {
  refresh_token: string;
}

// Boarding Pass Types
export interface BoardingPassData {
  passenger_name: string | null;
  flight_number: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  departure_date: string | null; // ISO date string
  seat_number: string | null;
  gate: string | null;
  terminal: string | null;
  operator_code: string | null;
  class_of_service: string | null;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: BoardingPassData | null;
}

export interface SupportedAirline {
  name: string;
  code: string;
  country: string;
  supported_features: string[];
}

export interface SupportedAirlinesResponse {
  supported_airlines: SupportedAirline[];
  total_supported: number;
  generic_parser: {
    available: boolean;
    description: string;
  };
}

// Health Check Types
export interface HealthResponse {
  status: string;
  message: string;
  timestamp?: string;
}

export interface ReadinessResponse {
  status: string;
  services: Record<string, any>;
}

// Form Types
export interface LoginFormData {
  provider: 'google' | 'apple';
}

export interface FileUploadFormData {
  file: File;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface AuthState extends LoadingState {
  user?: User | null;
  isAuthenticated: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
}

export interface BoardingPassState extends LoadingState {
  currentBoardingPass?: BoardingPassData | null;
  supportedAirlines: SupportedAirline[];
}

// HTTP Clients Types
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  includeAuth?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}