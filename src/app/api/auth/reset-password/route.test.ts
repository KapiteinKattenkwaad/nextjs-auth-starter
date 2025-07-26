/**
 * Tests for the reset password API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { prisma } from '@/lib/db';
import * as passwordUtils from '@/lib/password';

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    nextAuth: {
      secret: 'test-secret',
      url: 'http://localhost:3000',
    },
    database: {
      url: 'file:./test.db',
    },
    email: {
      serverHost: 'smtp.ethereal.email',
      serverPort: 587,
      serverUser: '',
      serverPassword: '',
      from: 'test@example.com',
    },
    security: {
      sessionExpiry: 2592000, // 30 days in seconds
      resetTokenExpiry: 86400, // 24 hours in seconds
    },
  },
  getEnv: vi.fn().mockImplementation((key, defaultValue) => {
    if (key === 'NEXTAUTH_SECRET') return 'test-secret';
    if (key === 'NEXTAUTH_URL') return 'http://localhost:3000';
    if (key === 'DATABASE_URL') return 'file:./test.db';
    if (key === 'EMAIL_SERVER_HOST') return 'smtp.ethereal.email';
    if (key === 'EMAIL_SERVER_PORT') return '587';
    if (key === 'EMAIL_SERVER_USER') return '';
    if (key === 'EMAIL_SERVER_PASSWORD') return '';
    if (key === 'EMAIL_FROM') return 'test@example.com';
    if (key === 'SESSION_EXPIRY') return '2592000';
    if (key === 'RESET_TOKEN_EXPIRY') return '86400';
    return defaultValue;
  }),
  getNumericEnv: vi.fn().mockImplementation((key, defaultValue) => {
    if (key === 'EMAIL_SERVER_PORT') return 587;
    if (key === 'SESSION_EXPIRY') return 2592000;
    if (key === 'RESET_TOKEN_EXPIRY') return 86400;
    return defaultValue;
  }),
  getBooleanEnv: vi.fn().mockReturnValue(false),
  validateEnv: vi.fn(),
  requiredServerEnvVars: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'DATABASE_URL'],
}));

// Mock the NextRequest
function createMockRequest(body: any): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: {
      get: vi.fn().mockReturnValue('127.0.0.1')
    }
  } as unknown as NextRequest;
}

// Mock the database client
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    verificationToken: {
      findUnique: vi.fn(),
      delete: vi.fn()
    }
  }
}));

// Mock password utilities
vi.mock('@/lib/password', async () => {
  const actual = await vi.importActual('@/lib/password');
  return {
    ...actual,
    hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    validatePasswordStrength: vi.fn().mockReturnValue([])
  };
});

describe('Reset Password API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should reset password with valid token', async () => {
    // Mock verification token
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      identifier: 'user-id',
      token: 'valid-token',
      expires: tomorrow
    });
    
    // Mock user
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User'
    });
    
    // Mock database update
    (prisma.user.update as any).mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      name: 'Test User'
    });
    
    (prisma.verificationToken.delete as any).mockResolvedValue({});

    // Create mock request
    const request = createMockRequest({
      token: 'valid-token',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.message).toBe('Password has been reset successfully');

    // Verify database calls
    expect(prisma.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid-token' }
    });
    
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' }
    });
    
    expect(passwordUtils.hashPassword).toHaveBeenCalledWith('NewPassword123!');
    
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        password: 'hashed-password',
        updatedAt: expect.any(Date)
      }
    });
    
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'valid-token' }
    });
  });

  it('should reject request with expired token', async () => {
    // Mock expired verification token
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      identifier: 'user-id',
      token: 'expired-token',
      expires: yesterday
    });

    // Create mock request
    const request = createMockRequest({
      token: 'expired-token',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error.message).toBe('Password reset token has expired');

    // Verify token was deleted
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: 'expired-token' }
    });
    
    // Verify user was not updated
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', async () => {
    // Mock no token found
    (prisma.verificationToken.findUnique as any).mockResolvedValue(null);

    // Create mock request
    const request = createMockRequest({
      token: 'invalid-token',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error.message).toBe('Invalid or expired password reset token');

    // Verify user was not updated
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should reject request with mismatched passwords', async () => {
    // Create mock request with mismatched passwords
    const request = createMockRequest({
      token: 'valid-token',
      password: 'NewPassword123!',
      confirmPassword: 'DifferentPassword123!'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error.message).toBe('Invalid input data');
    expect(data.error.details.confirmPassword).toBeDefined();

    // Verify no database calls were made
    expect(prisma.verificationToken.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should reject request with weak password', async () => {
    // Mock password validation to return errors
    (passwordUtils.validatePasswordStrength as any).mockReturnValue([
      { code: 'password.length', message: 'Password must be at least 8 characters long' }
    ]);

    // Create mock request with unique IP
    const request = createMockRequest({
      token: 'valid-token',
      password: 'weakpassword', // 12 characters, passes Zod but should fail strength validation
      confirmPassword: 'weakpassword'
    });
    
    // Mock headers to return a unique IP for this test
    vi.spyOn(request.headers, 'get').mockImplementation((name: string) => {
      if (name === 'x-forwarded-for') return '192.168.1.200'; // Unique IP for this test
      return null;
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error.message).toBe('Password does not meet security requirements');
    expect(data.error.details).toBeDefined();

    // Verify no database calls were made for token or user update
    expect(prisma.verificationToken.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should handle rate limiting', async () => {
    // Create mock request with invalid data to trigger validation errors
    // which should count as failed requests
    const createInvalidRequest = () => createMockRequest({
      token: 'valid-token',
      password: 'weak', // Invalid password
      confirmPassword: 'different' // Mismatched passwords
    });
    
    // Create requests with unique IP to avoid interference from other tests
    const requests = [];
    for (let i = 0; i < 4; i++) {
      const request = createInvalidRequest();
      // Mock headers to return a unique IP for this test
      vi.spyOn(request.headers, 'get').mockImplementation((name: string) => {
        if (name === 'x-forwarded-for') return '192.168.1.201'; // Unique IP for this test
        return null;
      });
      requests.push(request);
    }

    // Call the API handler multiple times with invalid data to trigger rate limiting
    // Password reset limit is 3 attempts per hour
    for (let i = 0; i < 3; i++) {
      const response = await POST(requests[i]);
      expect(response.status).toBe(400); // Should be validation error
    }

    // The next request should be rate limited
    const response = await POST(requests[3]);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(429);
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('should handle user not found', async () => {
    // Mock verification token
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      identifier: 'nonexistent-user-id',
      token: 'valid-token',
      expires: tomorrow
    });
    
    // Mock user not found
    (prisma.user.findUnique as any).mockResolvedValue(null);

    // Create mock request with unique IP
    const request = createMockRequest({
      token: 'valid-token',
      password: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    });
    
    // Mock headers to return a unique IP for this test
    vi.spyOn(request.headers, 'get').mockImplementation((name: string) => {
      if (name === 'x-forwarded-for') return '192.168.1.202'; // Unique IP for this test
      return null;
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(404);
    expect(data.error.message).toBe('User not found');

    // Verify user was not updated
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});