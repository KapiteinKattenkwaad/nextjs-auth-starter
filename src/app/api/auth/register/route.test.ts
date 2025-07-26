/**
 * Tests for the user registration API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from './route';
import { prisma } from '@/lib/db';
import * as passwordUtils from '@/lib/password';

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
      create: vi.fn()
    }
  },
  withErrorHandling: vi.fn((fn) => fn())
}));

// Mock password utilities
vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  validatePasswordStrength: vi.fn().mockReturnValue([])
}));

describe('Registration API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should register a new user successfully', async () => {
    // Mock database responses
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date()
    });

    // Create mock request
    const request = createMockRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'StrongPassword123!'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(201);
    expect(data.message).toBe('User registered successfully');
    expect(data.user).toHaveProperty('id', 'user-id');
    expect(data.user).toHaveProperty('email', 'test@example.com');
    expect(data.user).not.toHaveProperty('password');

    // Verify database calls
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: { id: true }
    });
    expect(passwordUtils.hashPassword).toHaveBeenCalledWith('StrongPassword123!');
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
  });

  it('should reject registration with invalid data', async () => {
    // Create mock request with invalid data
    const request = createMockRequest({
      name: 'T', // Too short
      email: 'invalid-email',
      password: 'short' // Too short
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
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should reject registration if email already exists', async () => {
    // Mock database to return an existing user
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing-user-id' });
    
    // Mock NextResponse.json to return proper status
    vi.spyOn(NextResponse, 'json').mockImplementation((data, options) => {
      return {
        status: options?.status || 200,
        json: async () => data
      } as unknown as NextResponse;
    });

    // Create mock request
    const request = createMockRequest({
      name: 'Test User',
      email: 'existing@example.com',
      password: 'StrongPassword123!'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(409);
    expect(data.error.message).toBe('Email already registered');

    // Verify database calls
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should reject registration if password is weak', async () => {
    // Mock password validation to return errors
    (passwordUtils.validatePasswordStrength as any).mockReturnValue([
      { code: 'password.uppercase', message: 'Password must contain at least one uppercase letter' }
    ]);

    // Mock database responses
    (prisma.user.findUnique as any).mockResolvedValue(null);

    // Create mock request
    const request = createMockRequest({
      name: 'Test User',
      email: 'test@example.com',
      password: 'weakpassword'
    });

    // Call the API handler
    const response = await POST(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(400);
    expect(data.error.message).toBe('Password does not meet security requirements');
    expect(data.error.details).toBeDefined();

    // Verify database calls
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});