/**
 * Rate Limiting Utilities
 * 
 * This module provides rate limiting functionality for authentication endpoints
 * with progressive delays for failed attempts and IP-based limiting.
 */

import { NextRequest, NextResponse } from "next/server";

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

// Rate limit entry
interface RateLimitEntry {
  count: number;
  resetAt: number;
  failedAttempts: number;
  lastFailedAt?: number;
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: Record<string, RateLimitEntry> = {};

// Failed login attempts store for progressive delays
const failedLoginStore: Record<string, { attempts: number; lastAttempt: number; nextAllowedAt: number }> = {};

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  return request.headers.get("x-forwarded-for") || 
         request.headers.get("x-real-ip") || 
         "unknown";
}

/**
 * Clean up expired entries from stores
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  // Clean up rate limit store
  Object.keys(rateLimitStore).forEach(key => {
    if (now > rateLimitStore[key].resetAt) {
      delete rateLimitStore[key];
    }
  });
  
  // Clean up failed login store (entries older than 24 hours)
  Object.keys(failedLoginStore).forEach(key => {
    if (now - failedLoginStore[key].lastAttempt > 24 * 60 * 60 * 1000) {
      delete failedLoginStore[key];
    }
  });
}

/**
 * Check if a request is rate limited
 */
export function checkRateLimit(
  request: NextRequest, 
  config: RateLimitConfig
): { isLimited: boolean; remaining: number; resetAt: number } {
  cleanupExpiredEntries();
  
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(request);
  const now = Date.now();
  
  let entry = rateLimitStore[key];
  
  // Create new entry if doesn't exist or expired
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
      failedAttempts: 0,
    };
    rateLimitStore[key] = entry;
  }
  
  // Check if we would exceed the limit with this request
  const wouldExceed = entry.count >= config.maxAttempts;
  const remaining = Math.max(0, config.maxAttempts - entry.count);
  
  return {
    isLimited: wouldExceed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Update rate limit counter
 */
export function updateRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  success: boolean = true
): void {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(request);
  
  if (!rateLimitStore[key]) {
    return;
  }
  
  // Only count if configured to do so
  const shouldCount = success ? !config.skipSuccessfulRequests : !config.skipFailedRequests;
  
  if (shouldCount) {
    rateLimitStore[key].count += 1;
  }
  
  // Track failed attempts separately
  if (!success) {
    rateLimitStore[key].failedAttempts += 1;
    rateLimitStore[key].lastFailedAt = Date.now();
  }
}

/**
 * Calculate progressive delay for failed login attempts
 */
function calculateProgressiveDelay(attempts: number): number {
  // Progressive delay: 1s, 2s, 4s, 8s, 16s, then 30s for subsequent attempts
  if (attempts <= 0) return 0;
  if (attempts <= 5) {
    return Math.pow(2, attempts - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
  }
  return 30 * 1000; // 30 seconds for 6+ attempts
}

/**
 * Check and apply progressive delays for failed login attempts
 */
export function checkLoginDelay(request: NextRequest): { 
  isDelayed: boolean; 
  delayMs: number; 
  nextAllowedAt: number;
} {
  cleanupExpiredEntries();
  
  const key = defaultKeyGenerator(request);
  const now = Date.now();
  
  const entry = failedLoginStore[key];
  
  if (!entry) {
    return { isDelayed: false, delayMs: 0, nextAllowedAt: now };
  }
  
  // Check if still in delay period
  if (now < entry.nextAllowedAt) {
    return {
      isDelayed: true,
      delayMs: entry.nextAllowedAt - now,
      nextAllowedAt: entry.nextAllowedAt,
    };
  }
  
  return { isDelayed: false, delayMs: 0, nextAllowedAt: now };
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(request: NextRequest): void {
  const key = defaultKeyGenerator(request);
  const now = Date.now();
  
  let entry = failedLoginStore[key];
  
  if (!entry) {
    entry = { attempts: 0, lastAttempt: now, nextAllowedAt: now };
    failedLoginStore[key] = entry;
  }
  
  // Reset attempts if last attempt was more than 1 hour ago
  if (now - entry.lastAttempt > 60 * 60 * 1000) {
    entry.attempts = 0;
  }
  
  entry.attempts += 1;
  entry.lastAttempt = now;
  
  // Calculate next allowed attempt time
  const delay = calculateProgressiveDelay(entry.attempts);
  entry.nextAllowedAt = now + delay;
}

/**
 * Clear failed login attempts for successful login
 */
export function clearFailedLogins(request: NextRequest): void {
  const key = defaultKeyGenerator(request);
  delete failedLoginStore[key];
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (request: NextRequest) => {
    const { isLimited, remaining, resetAt } = checkRateLimit(request, config);
    
    if (isLimited) {
      const resetTime = new Date(resetAt).toISOString();
      
      return NextResponse.json(
        { 
          error: { 
            message: "Too many requests. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
          } 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxAttempts.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': resetTime,
            'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    return null; // Not rate limited
  };
}

/**
 * Login delay middleware for progressive delays
 */
export function createLoginDelayMiddleware() {
  return (request: NextRequest) => {
    const { isDelayed, delayMs } = checkLoginDelay(request);
    
    if (isDelayed) {
      return NextResponse.json(
        { 
          error: { 
            message: "Too many failed login attempts. Please try again later.",
            code: "LOGIN_DELAY",
            retryAfter: Math.ceil(delayMs / 1000),
          } 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(delayMs / 1000).toString(),
          }
        }
      );
    }
    
    return null; // No delay
  };
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // General authentication endpoints (registration, password reset)
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 5,
    skipSuccessfulRequests: true,
  } as RateLimitConfig,
  
  // Login endpoint with stricter limits
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    skipSuccessfulRequests: true,
  } as RateLimitConfig,
  
  // Password reset with more lenient limits
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    skipSuccessfulRequests: true,
  } as RateLimitConfig,
};