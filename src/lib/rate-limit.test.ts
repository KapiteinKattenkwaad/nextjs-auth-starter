/**
 * Rate Limiting Tests
 * 
 * Tests for rate limiting utilities and middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkRateLimit,
  updateRateLimit,
  checkLoginDelay,
  recordFailedLogin,
  clearFailedLogins,
  createRateLimitMiddleware,
  createLoginDelayMiddleware,
  rateLimitConfigs
} from './rate-limit';

// Mock NextRequest
function createMockRequest(ip: string = '127.0.0.1'): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/test');
  
  // Mock headers
  vi.spyOn(request.headers, 'get').mockImplementation((name: string) => {
    if (name === 'x-forwarded-for') return ip;
    if (name === 'x-real-ip') return ip;
    return null;
  });
  
  return request;
}

describe('Rate Limiting Utilities', () => {
  beforeEach(() => {
    // Clear any existing rate limit data
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const request = createMockRequest('192.168.1.1');
      const config = { windowMs: 60000, maxAttempts: 5 };
      
      const result = checkRateLimit(request, config);
      
      expect(result.isLimited).toBe(false);
      expect(result.remaining).toBe(5);
    });

    it('should block requests exceeding limit', () => {
      const request = createMockRequest('192.168.1.2');
      const config = { windowMs: 60000, maxAttempts: 2 };
      
      // First check to initialize the entry
      checkRateLimit(request, config);
      
      // Make requests up to the limit
      updateRateLimit(request, config, false);
      updateRateLimit(request, config, false);
      
      const result = checkRateLimit(request, config);
      
      expect(result.isLimited).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should reset limits after window expires', () => {
      const request = createMockRequest('192.168.1.3');
      const config = { windowMs: 100, maxAttempts: 1 }; // Very short window
      
      // First check to initialize the entry
      checkRateLimit(request, config);
      
      // Exceed the limit
      updateRateLimit(request, config, false);
      let result = checkRateLimit(request, config);
      expect(result.isLimited).toBe(true);
      
      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          result = checkRateLimit(request, config);
          expect(result.isLimited).toBe(false);
          resolve();
        }, 150);
      });
    });
  });

  describe('Progressive Login Delays', () => {
    it('should not delay first login attempt', () => {
      const request = createMockRequest('192.168.1.4');
      
      const result = checkLoginDelay(request);
      
      expect(result.isDelayed).toBe(false);
      expect(result.delayMs).toBe(0);
    });

    it('should apply progressive delays for failed attempts', () => {
      const request = createMockRequest('192.168.1.5');
      
      // Record first failed attempt
      recordFailedLogin(request);
      const result = checkLoginDelay(request);
      expect(result.isDelayed).toBe(true);
      expect(result.delayMs).toBeGreaterThan(0);
      
      // Record second failed attempt (should increase delay)
      recordFailedLogin(request);
      const result2 = checkLoginDelay(request);
      expect(result2.delayMs).toBeGreaterThan(result.delayMs);
    });

    it('should clear delays on successful login', () => {
      const request = createMockRequest('192.168.1.6');
      
      // Record failed attempts
      recordFailedLogin(request);
      recordFailedLogin(request);
      
      let result = checkLoginDelay(request);
      expect(result.isDelayed).toBe(true);
      
      // Clear failed logins
      clearFailedLogins(request);
      
      result = checkLoginDelay(request);
      expect(result.isDelayed).toBe(false);
    });
  });

  describe('Rate Limit Middleware', () => {
    it('should return null for requests within limit', () => {
      const request = createMockRequest('192.168.1.7');
      const middleware = createRateLimitMiddleware({ windowMs: 60000, maxAttempts: 5 });
      
      const response = middleware(request);
      
      expect(response).toBeNull();
    });

    it('should return 429 response for requests exceeding limit', () => {
      const request = createMockRequest('192.168.1.8');
      const config = { windowMs: 60000, maxAttempts: 1 };
      const middleware = createRateLimitMiddleware(config);
      
      // First check to initialize the entry
      checkRateLimit(request, config);
      
      // Exceed the limit
      updateRateLimit(request, config, false);
      
      const response = middleware(request);
      
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);
    });
  });

  describe('Login Delay Middleware', () => {
    it('should return null for requests without delays', () => {
      const request = createMockRequest('192.168.1.9');
      const middleware = createLoginDelayMiddleware();
      
      const response = middleware(request);
      
      expect(response).toBeNull();
    });

    it('should return 429 response for delayed requests', () => {
      const request = createMockRequest('192.168.1.10');
      const middleware = createLoginDelayMiddleware();
      
      // Record failed login to trigger delay
      recordFailedLogin(request);
      
      const response = middleware(request);
      
      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);
    });
  });

  describe('Rate Limit Configurations', () => {
    it('should have proper auth configuration', () => {
      expect(rateLimitConfigs.auth.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(rateLimitConfigs.auth.maxAttempts).toBe(5);
      expect(rateLimitConfigs.auth.skipSuccessfulRequests).toBe(true);
    });

    it('should have proper login configuration', () => {
      expect(rateLimitConfigs.login.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(rateLimitConfigs.login.maxAttempts).toBe(5);
      expect(rateLimitConfigs.login.skipSuccessfulRequests).toBe(true);
    });

    it('should have proper password reset configuration', () => {
      expect(rateLimitConfigs.passwordReset.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(rateLimitConfigs.passwordReset.maxAttempts).toBe(3);
      expect(rateLimitConfigs.passwordReset.skipSuccessfulRequests).toBe(true);
    });
  });
});