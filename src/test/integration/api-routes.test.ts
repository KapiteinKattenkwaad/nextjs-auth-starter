/**
 * Integration Tests for Authentication API Routes
 * 
 * These tests verify the complete authentication flows including:
 * - User registration flow
 * - Login flow  
 * - Password reset flow
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordPOST } from '@/app/api/auth/reset-password/route';
import { testDb, cleanupDatabase, createTestUser, createVerificationToken } from '@/test/db';
import { hashPassword } from '@/lib/password';

// Mock nodemailer to avoid email authentication issues
vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn().mockResolvedValue({
    messageId: 'mock-message-id'
  });

  const mockTransporter = {
    sendMail: mockSendMail
  };

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

// Helper function to create mock NextRequest with unique IP to avoid rate limiting
let requestCounter = 0;
function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  requestCounter++;
  const defaultHeaders = {
    'x-forwarded-for': `192.168.1.${requestCounter % 255}`, // Unique IP for each request
    ...headers
  };
  
  return {
    json: async () => body,
    headers: {
      get: (name: string) => defaultHeaders[name] || '127.0.0.1'
    }
  } as unknown as NextRequest;
}

describe('Authentication API Routes Integration Tests', () => {
  beforeAll(async () => {
    // Ensure test database is connected
    await testDb.$connect();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await cleanupDatabase();
    await testDb.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanupDatabase();
  });

  afterEach(async () => {
    // Clean database after each test
    await cleanupDatabase();
  });

  describe('User Registration Flow', () => {
    it('should complete full registration flow successfully', async () => {
      // Test data
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePassword123!'
      };

      // Create request
      const request = createMockRequest(userData);

      // Call registration API
      const response = await registerPOST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(201);
      expect(data.message).toBe('User registered successfully');
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('name', userData.name);
      expect(data.user).toHaveProperty('email', userData.email);
      expect(data.user).not.toHaveProperty('password');

      // Verify user was created in database
      const createdUser = await testDb.user.findUnique({
        where: { email: userData.email }
      });

      expect(createdUser).toBeTruthy();
      expect(createdUser?.name).toBe(userData.name);
      expect(createdUser?.email).toBe(userData.email);
      expect(createdUser?.password).not.toBe(userData.password); // Should be hashed
    });

    it('should prevent duplicate email registration', async () => {
      // Create existing user
      await createTestUser({
        email: 'existing@example.com',
        name: 'Existing User'
      });

      // Try to register with same email
      const userData = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'SecurePassword123!'
      };

      const request = createMockRequest(userData);
      const response = await registerPOST(request);
      const data = await response.json();

      // Verify rejection
      expect(response.status).toBe(409);
      expect(data.error.message).toBe('Email already registered');

      // Verify no duplicate user was created
      const users = await testDb.user.findMany({
        where: { email: userData.email }
      });
      expect(users).toHaveLength(1);
    });

    it('should validate registration input data', async () => {
      const invalidData = {
        name: 'A', // Too short
        email: 'invalid-email', // Invalid format
        password: 'weak' // Too short
      };

      const request = createMockRequest(invalidData);
      const response = await registerPOST(request);
      const data = await response.json();

      // Verify validation error
      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Invalid input data');
      expect(data.error.details).toBeDefined();

      // Verify no user was created
      const users = await testDb.user.findMany();
      expect(users).toHaveLength(0);
    });
  });

  describe('Login Flow', () => {
    it('should complete full login flow successfully', async () => {
      // Create test user
      const password = 'SecurePassword123!';
      const hashedPassword = await hashPassword(password);
      
      const user = await testDb.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword
        }
      });

      // Test login
      const loginData = {
        email: user.email,
        password: password
      };

      const request = createMockRequest(loginData);
      const response = await loginPOST(request);
      const data = await response.json();

      // Verify successful login
      expect(response.status).toBe(200);
      expect(data.message).toBe('Credentials validated successfully');
      expect(data.user).toHaveProperty('id', user.id);
      expect(data.user).toHaveProperty('email', user.email);
      expect(data.user).toHaveProperty('name', user.name);
      expect(data.user).not.toHaveProperty('password');
    });

    it('should reject login with invalid credentials', async () => {
      // Create test user
      const user = await createTestUser({
        email: 'test@example.com',
        password: await hashPassword('correctpassword')
      });

      // Try login with wrong password
      const loginData = {
        email: user.email,
        password: 'wrongpassword'
      };

      const request = createMockRequest(loginData);
      const response = await loginPOST(request);
      const data = await response.json();

      // Verify rejection
      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Invalid email or password');
    });

    it('should reject login for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'anypassword'
      };

      const request = createMockRequest(loginData);
      const response = await loginPOST(request);
      const data = await response.json();

      // Verify rejection
      expect(response.status).toBe(401);
      expect(data.error.message).toBe('Invalid email or password');
    });

    it('should validate login input data', async () => {
      const invalidData = {
        email: 'invalid-email', // Invalid format
        password: '' // Empty password
      };

      const request = createMockRequest(invalidData);
      const response = await loginPOST(request);
      const data = await response.json();

      // Verify validation error
      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Invalid input data');
      expect(data.error.details).toBeDefined();
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete full password reset flow successfully', async () => {
      // Create test user
      const user = await createTestUser({
        email: 'test@example.com',
        name: 'Test User'
      });

      // Step 1: Request password reset
      const forgotPasswordData = {
        email: user.email
      };

      const forgotRequest = createMockRequest(forgotPasswordData);
      const forgotResponse = await forgotPasswordPOST(forgotRequest);
      const forgotData = await forgotResponse.json();

      // Verify forgot password response
      expect(forgotResponse.status).toBe(200);
      expect(forgotData.message).toBe('If your email is registered, you will receive a password reset link.');

      // Verify token was created in database
      const token = await testDb.verificationToken.findFirst({
        where: { identifier: user.id }
      });
      expect(token).toBeTruthy();
      expect(token?.expires).toBeInstanceOf(Date);
      expect(token?.expires.getTime()).toBeGreaterThan(Date.now());

      // Step 2: Reset password using token
      const newPassword = 'NewSecurePassword123!';
      const resetPasswordData = {
        token: token!.token,
        password: newPassword,
        confirmPassword: newPassword
      };

      const resetRequest = createMockRequest(resetPasswordData);
      const resetResponse = await resetPasswordPOST(resetRequest);
      const resetData = await resetResponse.json();

      // Verify password reset response
      expect(resetResponse.status).toBe(200);
      expect(resetData.message).toBe('Password has been reset successfully');

      // Verify password was updated in database
      const updatedUser = await testDb.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser?.password).not.toBe(user.password); // Password should be different

      // Verify token was deleted
      const deletedToken = await testDb.verificationToken.findUnique({
        where: { token: token!.token }
      });
      expect(deletedToken).toBeNull();

      // Step 3: Verify new password works for login
      const loginData = {
        email: user.email,
        password: newPassword
      };

      const loginRequest = createMockRequest(loginData);
      const loginResponse = await loginPOST(loginRequest);
      const loginResponseData = await loginResponse.json();

      // Verify login with new password works
      expect(loginResponse.status).toBe(200);
      expect(loginResponseData.message).toBe('Credentials validated successfully');
    });

    it('should handle forgot password for non-existent email', async () => {
      const forgotPasswordData = {
        email: 'nonexistent@example.com'
      };

      const request = createMockRequest(forgotPasswordData);
      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      // Verify response (should be same as success for security)
      expect(response.status).toBe(200);
      expect(data.message).toBe('If your email is registered, you will receive a password reset link.');

      // Verify no token was created
      const tokens = await testDb.verificationToken.findMany();
      expect(tokens).toHaveLength(0);
    });

    it('should reject password reset with expired token', async () => {
      // Create test user
      const user = await createTestUser({
        email: 'test@example.com'
      });

      // Create expired token
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const expiredToken = await createVerificationToken(user.id, 'expired-token', expiredDate);

      // Try to reset password with expired token
      const resetPasswordData = {
        token: expiredToken.token,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const request = createMockRequest(resetPasswordData);
      const response = await resetPasswordPOST(request);
      const data = await response.json();

      // Verify rejection
      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Password reset token has expired');

      // Verify token was deleted
      const deletedToken = await testDb.verificationToken.findUnique({
        where: { token: expiredToken.token }
      });
      expect(deletedToken).toBeNull();
    });

    it('should reject password reset with invalid token', async () => {
      const resetPasswordData = {
        token: 'invalid-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const request = createMockRequest(resetPasswordData);
      const response = await resetPasswordPOST(request);
      const data = await response.json();

      // Verify rejection
      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Invalid or expired password reset token');
    });

    it('should validate password reset input data', async () => {
      const invalidData = {
        token: 'valid-token',
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!' // Mismatched passwords
      };

      const request = createMockRequest(invalidData);
      const response = await resetPasswordPOST(request);
      const data = await response.json();

      // Verify validation error
      expect(response.status).toBe(400);
      expect(data.error.message).toBe('Invalid input data');
      expect(data.error.details).toBeDefined();
    });
  });

  describe('End-to-End Authentication Flow', () => {
    it('should complete full user journey: register -> login -> forgot password -> reset -> login', async () => {
      const userEmail = 'journey@example.com';
      const originalPassword = 'OriginalPassword123!';
      const newPassword = 'NewPassword123!';

      // Step 1: Register user
      const registerData = {
        name: 'Journey User',
        email: userEmail,
        password: originalPassword
      };

      const registerRequest = createMockRequest(registerData);
      const registerResponse = await registerPOST(registerRequest);
      const registerResponseData = await registerResponse.json();

      expect(registerResponse.status).toBe(201);
      expect(registerResponseData.user.email).toBe(userEmail);

      // Step 2: Login with original password
      const loginData = {
        email: userEmail,
        password: originalPassword
      };

      const loginRequest = createMockRequest(loginData);
      const loginResponse = await loginPOST(loginRequest);
      const loginResponseData = await loginResponse.json();

      expect(loginResponse.status).toBe(200);
      expect(loginResponseData.user.email).toBe(userEmail);

      // Step 3: Request password reset
      const forgotPasswordData = {
        email: userEmail
      };

      const forgotRequest = createMockRequest(forgotPasswordData);
      const forgotResponse = await forgotPasswordPOST(forgotRequest);

      expect(forgotResponse.status).toBe(200);

      // Get the reset token from database
      const user = await testDb.user.findUnique({
        where: { email: userEmail }
      });
      const token = await testDb.verificationToken.findFirst({
        where: { identifier: user!.id }
      });

      expect(token).toBeTruthy();

      // Step 4: Reset password
      const resetPasswordData = {
        token: token!.token,
        password: newPassword,
        confirmPassword: newPassword
      };

      const resetRequest = createMockRequest(resetPasswordData);
      const resetResponse = await resetPasswordPOST(resetRequest);

      expect(resetResponse.status).toBe(200);

      // Step 5: Login with new password
      const newLoginData = {
        email: userEmail,
        password: newPassword
      };

      const newLoginRequest = createMockRequest(newLoginData);
      const newLoginResponse = await loginPOST(newLoginRequest);
      const newLoginResponseData = await newLoginResponse.json();

      expect(newLoginResponse.status).toBe(200);
      expect(newLoginResponseData.user.email).toBe(userEmail);

      // Step 6: Verify old password no longer works
      const oldPasswordLoginData = {
        email: userEmail,
        password: originalPassword
      };

      const oldPasswordRequest = createMockRequest(oldPasswordLoginData);
      const oldPasswordResponse = await loginPOST(oldPasswordRequest);

      expect(oldPasswordResponse.status).toBe(401);
    });
  });

  describe('Security and Edge Cases', () => {
    it('should handle concurrent registration attempts with same email', async () => {
      const userData = {
        name: 'Concurrent User',
        email: 'concurrent@example.com',
        password: 'SecurePassword123!'
      };

      // Create multiple concurrent requests with unique IPs
      const requests = Array(3).fill(null).map((_, index) => 
        createMockRequest(userData, { 'x-forwarded-for': `192.168.100.${index + 1}` })
      );

      // Execute all requests concurrently
      const responses = await Promise.all(
        requests.map(request => registerPOST(request))
      );

      // Only one should succeed, others should fail with either 409 (duplicate) or 500 (database error)
      const successResponses = responses.filter(r => r.status === 201);
      const failureResponses = responses.filter(r => r.status === 409 || r.status === 500);

      expect(successResponses).toHaveLength(1);
      expect(failureResponses.length).toBeGreaterThanOrEqual(2);

      // Verify only one user was created
      const users = await testDb.user.findMany({
        where: { email: userData.email }
      });
      expect(users).toHaveLength(1);
    });

    it('should handle password reset token reuse attempts', async () => {
      // Create test user
      const user = await createTestUser({
        email: 'test@example.com'
      });

      // Request password reset
      const forgotRequest = createMockRequest({ email: user.email });
      await forgotPasswordPOST(forgotRequest);

      // Get token
      const token = await testDb.verificationToken.findFirst({
        where: { identifier: user.id }
      });

      // First reset attempt (should succeed)
      const resetData = {
        token: token!.token,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const firstResetRequest = createMockRequest(resetData);
      const firstResetResponse = await resetPasswordPOST(firstResetRequest);
      expect(firstResetResponse.status).toBe(200);

      // Second reset attempt with same token (should fail)
      const secondResetRequest = createMockRequest(resetData);
      const secondResetResponse = await resetPasswordPOST(secondResetRequest);
      expect(secondResetResponse.status).toBe(400);

      const secondResetData = await secondResetResponse.json();
      expect(secondResetData.error.message).toBe('Invalid or expired password reset token');
    });

    it('should maintain data integrity during password reset flow', async () => {
      // Create test user
      const user = await createTestUser({
        email: 'integrity@example.com',
        name: 'Integrity User'
      });

      const originalUserData = { ...user };

      // Request password reset
      const forgotRequest = createMockRequest({ email: user.email });
      await forgotPasswordPOST(forgotRequest);

      // Get token
      const token = await testDb.verificationToken.findFirst({
        where: { identifier: user.id }
      });

      // Reset password
      const resetData = {
        token: token!.token,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };

      const resetRequest = createMockRequest(resetData);
      await resetPasswordPOST(resetRequest);

      // Verify user data integrity
      const updatedUser = await testDb.user.findUnique({
        where: { id: user.id }
      });

      expect(updatedUser?.id).toBe(originalUserData.id);
      expect(updatedUser?.email).toBe(originalUserData.email);
      expect(updatedUser?.name).toBe(originalUserData.name);
      expect(updatedUser?.createdAt).toEqual(originalUserData.createdAt);
      expect(updatedUser?.password).not.toBe(originalUserData.password); // Only password should change
      expect(updatedUser?.updatedAt.getTime()).toBeGreaterThan(originalUserData.updatedAt.getTime());
    });
  });
});