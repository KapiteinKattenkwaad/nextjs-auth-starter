/**
 * Tests for the forgot password API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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
      findUnique: vi.fn()
    },
    verificationToken: {
      create: vi.fn()
    }
  }
}));

// Mock nodemailer
const mockSendMail = vi.fn().mockResolvedValue({
  messageId: 'mock-message-id'
});

const mockTransporter = {
  sendMail: mockSendMail
};

vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: vi.fn(() => mockTransporter),
      createTestAccount: vi.fn().mockResolvedValue({
        user: 'test-user',
        pass: 'test-pass'
      }),
      getTestMessageUrl: vi.fn().mockReturnValue('https://ethereal.email/message/mock')
    }
  };
});

// Mock crypto
vi.mock('crypto', () => {
  return {
    default: {
      randomBytes: vi.fn().mockReturnValue({
        toString: vi.fn().mockReturnValue('mock-token')
      })
    },
    randomBytes: vi.fn().mockReturnValue({
      toString: vi.fn().mockReturnValue('mock-token')
    })
  };
});

describe('Forgot Password API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should process password reset request for existing user', async () => {
    // Mock database responses
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-id',
      name: 'Test User'
    });
    
    (prisma.verificationToken.create as any).mockResolvedValue({
      identifier: 'user-id',
      token: 'mock-token',
      expires: expect.any(Date)
    });

    // Create mock request
    const request = createMockRequest({
      email: 'test@example.com'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.message).toBe('If your email is registered, you will receive a password reset link.');

    // Verify database calls
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: { id: true, name: true }
    });
    
    expect(prisma.verificationToken.create).toHaveBeenCalledWith({
      data: {
        identifier: 'user-id',
        token: 'mock-token',
        expires: expect.any(Date)
      }
    });

    // Verify email was sent
    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).toHaveBeenCalled();
    const sendMailArgs = (transporter.sendMail as any).mock.calls[0][0];
    expect(sendMailArgs.to).toBe('test@example.com');
    expect(sendMailArgs.subject).toBe('Password Reset Request');
    expect(sendMailArgs.text).toContain('mock-token');
    expect(sendMailArgs.html).toContain('mock-token');
  });

  it('should return success for non-existent email (security through obscurity)', async () => {
    // Mock database to return no user
    (prisma.user.findUnique as any).mockResolvedValue(null);

    // Create mock request
    const request = createMockRequest({
      email: 'nonexistent@example.com'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.message).toBe('If your email is registered, you will receive a password reset link.');

    // Verify database calls
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'nonexistent@example.com' },
      select: { id: true, name: true }
    });
    
    // Verify no token was created and no email was sent
    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
    const transporter = nodemailer.createTransport();
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it('should reject request with invalid email', async () => {
    // Create mock request with invalid email
    const request = createMockRequest({
      email: 'invalid-email'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error.message).toBe('Invalid input data');
    expect(data.error.details).toBeDefined();

    // Verify no database calls were made
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.verificationToken.create).not.toHaveBeenCalled();
  });

  it('should handle rate limiting', async () => {
    // Create mock request with invalid email to trigger validation errors
    // which should count as failed requests
    const createInvalidRequest = () => createMockRequest({
      email: 'invalid-email' // Invalid email format
    });
    
    // Create requests with unique IP to avoid interference from other tests
    const requests = [];
    for (let i = 0; i < 4; i++) {
      const request = createInvalidRequest();
      // Mock headers to return a unique IP for this test
      vi.spyOn(request.headers, 'get').mockImplementation((name: string) => {
        if (name === 'x-forwarded-for') return '192.168.1.101'; // Unique IP for this test
        return null;
      });
      requests.push(request);
    }

    // Call the API handler multiple times with invalid data to trigger rate limiting
    // Password reset limit is 3 attempts per hour, but validation errors should count
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
});