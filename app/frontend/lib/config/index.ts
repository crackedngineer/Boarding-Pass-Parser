/**
 * Frontend configuration management with environment variables.
 */

interface Config {
  // API Configuration
  apiBaseUrl: string;
  appName: string;
  appVersion: string;
  environment: string;

  // OAuth Configuration
  googleClientId?: string;

  // Feature Flags
  enableAnalytics: boolean;
  enableErrorReporting: boolean;
  enableDarkMode: boolean;

  // Upload Configuration
  maxFileSizeMB: number;
  supportedFileTypes: string[];

  // UI Configuration
  defaultTheme: 'light' | 'dark';
}

class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): Config {
    return {
      // API Configuration
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'FlightTrackr',
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',

      // OAuth Configuration
      googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,

      // Feature Flags
      enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
      enableErrorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
      enableDarkMode: process.env.NEXT_PUBLIC_ENABLE_DARK_MODE !== 'false', // Default to true

      // Upload Configuration
      maxFileSizeMB: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '5'),
      supportedFileTypes: (process.env.NEXT_PUBLIC_SUPPORTED_FILE_TYPES || 'application/pdf').split(','),

      // UI Configuration
      defaultTheme: (process.env.NEXT_PUBLIC_DEFAULT_THEME as 'light' | 'dark') || 'light',
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Validate required configurations
    if (!this.config.apiBaseUrl) {
      errors.push('NEXT_PUBLIC_API_BASE_URL is required');
    }

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production'];
    if (!validEnvironments.includes(this.config.environment)) {
      errors.push(`Invalid environment: ${this.config.environment}. Must be one of: ${validEnvironments.join(', ')}`);
    }

    // Validate file size
    if (this.config.maxFileSizeMB <= 0 || this.config.maxFileSizeMB > 100) {
      errors.push('MAX_FILE_SIZE_MB must be between 1 and 100');
    }

    // Validate theme
    if (!['light', 'dark'].includes(this.config.defaultTheme)) {
      errors.push('DEFAULT_THEME must be either "light" or "dark"');
    }

    if (errors.length > 0) {
      console.error('Configuration validation errors:', errors);
      if (this.config.environment === 'production') {
        throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
      }
    }
  }

  // Getters for configuration values
  get api() {
    return {
      baseUrl: this.config.apiBaseUrl,
    };
  }

  get app() {
    return {
      name: this.config.appName,
      version: this.config.appVersion,
      environment: this.config.environment,
    };
  }

  get auth() {
    return {
      googleClientId: this.config.googleClientId,
    };
  }

  get features() {
    return {
      analytics: this.config.enableAnalytics,
      errorReporting: this.config.enableErrorReporting,
      darkMode: this.config.enableDarkMode,
    };
  }

  get upload() {
    return {
      maxFileSizeMB: this.config.maxFileSizeMB,
      supportedFileTypes: this.config.supportedFileTypes,
    };
  }

  get ui() {
    return {
      defaultTheme: this.config.defaultTheme,
    };
  }

  // Utility methods
  get isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  get isProduction(): boolean {
    return this.config.environment === 'production';
  }

  get isStaging(): boolean {
    return this.config.environment === 'staging';
  }

  // Method to get all configuration as read-only
  getConfig(): Readonly<Config> {
    return Object.freeze({ ...this.config });
  }
}

// Create and export singleton instance
export const config = new ConfigManager();
export default config;