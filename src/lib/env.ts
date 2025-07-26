/**
 * Environment variable validation utility
 * 
 * This module validates required environment variables and provides
 * typed access to them throughout the application.
 */

/**
 * Validates that required environment variables are present
 * @param {string[]} requiredEnvVars - Array of required environment variable names
 * @throws {Error} If any required environment variables are missing
 */
export function validateEnv(requiredEnvVars: string[]): void {
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }
}

/**
 * Gets an environment variable with validation
 * @param {string} key - The environment variable name
 * @param {string} [defaultValue] - Optional default value if not set
 * @returns {string} The environment variable value
 * @throws {Error} If the environment variable is not set and no default is provided
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  
  return value;
}

/**
 * Gets a numeric environment variable with validation
 * @param {string} key - The environment variable name
 * @param {number} [defaultValue] - Optional default value if not set
 * @returns {number} The environment variable value as a number
 * @throws {Error} If the environment variable is not a valid number
 */
export function getNumericEnv(key: string, defaultValue?: number): number {
  const rawValue = process.env[key];
  
  if (rawValue === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return defaultValue;
  }
  
  const value = Number(rawValue);
  
  if (isNaN(value)) {
    throw new Error(`Environment variable ${key} is not a valid number`);
  }
  
  return value;
}

/**
 * Gets a boolean environment variable with validation
 * @param {string} key - The environment variable name
 * @param {boolean} [defaultValue] - Optional default value if not set
 * @returns {boolean} The environment variable value as a boolean
 */
export function getBooleanEnv(key: string, defaultValue?: boolean): boolean {
  const rawValue = process.env[key];
  
  if (rawValue === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return defaultValue;
  }
  
  return rawValue.toLowerCase() === 'true';
}

/**
 * Required server-side environment variables
 * These are validated when the server starts
 */
export const requiredServerEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'DATABASE_URL',
];

/**
 * Environment variable configuration object
 * Provides typed access to environment variables
 */
export const env = {
  nextAuth: {
    secret: getEnv('NEXTAUTH_SECRET'),
    url: getEnv('NEXTAUTH_URL'),
  },
  database: {
    url: getEnv('DATABASE_URL'),
  },
  email: {
    serverHost: getEnv('EMAIL_SERVER_HOST', 'smtp.ethereal.email'),
    serverPort: getNumericEnv('EMAIL_SERVER_PORT', 587),
    serverUser: getEnv('EMAIL_SERVER_USER', ''),
    serverPassword: getEnv('EMAIL_SERVER_PASSWORD', ''),
    from: getEnv('EMAIL_FROM', 'noreply@example.com'),
  },
  security: {
    sessionExpiry: getNumericEnv('SESSION_EXPIRY', 2592000), // 30 days in seconds
    resetTokenExpiry: getNumericEnv('RESET_TOKEN_EXPIRY', 86400), // 24 hours in seconds
  },
};