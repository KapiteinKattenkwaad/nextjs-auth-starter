/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  passwordSchema,
  emailSchema,
  nameSchema,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validatePasswordStrength,
} from './validation';

describe('Validation Utilities', () => {
  describe('passwordSchema', () => {
    it('should accept valid strong password', () => {
      const result = passwordSchema.safeParse('StrongPassword123!');
      expect(result.success).toBe(true);
    });

    it('should reject password too short', () => {
      const result = passwordSchema.safeParse('Short1!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject password without lowercase', () => {
      const result = passwordSchema.safeParse('UPPERCASE123!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('lowercase')
        )).toBe(true);
      }
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('lowercase123!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('uppercase')
        )).toBe(true);
      }
    });

    it('should reject password without numbers', () => {
      const result = passwordSchema.safeParse('NoNumbers!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('number')
        )).toBe(true);
      }
    });

    it('should reject password without special characters', () => {
      const result = passwordSchema.safeParse('NoSpecialChars123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('special character')
        )).toBe(true);
      }
    });
  });

  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    it('should reject invalid email format', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid email');
      }
    });

    it('should accept email with subdomain', () => {
      const result = emailSchema.safeParse('test@mail.example.com');
      expect(result.success).toBe(true);
    });
  });

  describe('nameSchema', () => {
    it('should accept valid name', () => {
      const result = nameSchema.safeParse('John Doe');
      expect(result.success).toBe(true);
    });

    it('should reject name too short', () => {
      const result = nameSchema.safeParse('A');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject name too long', () => {
      const longName = 'A'.repeat(51);
      const result = nameSchema.safeParse(longName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 50 characters');
      }
    });

    it('should reject name with numbers', () => {
      const result = nameSchema.safeParse('John123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('letters and spaces');
      }
    });

    it('should reject name with special characters', () => {
      const result = nameSchema.safeParse('John@Doe');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('letters and spaces');
      }
    });

    it('should accept name with multiple spaces', () => {
      const result = nameSchema.safeParse('John Middle Doe');
      expect(result.success).toBe(true);
    });
  });

  describe('registerSchema', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'StrongPassword123!',
      confirmPassword: 'StrongPassword123!',
    };

    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when passwords do not match', () => {
      const result = registerSchema.safeParse({
        ...validData,
        confirmPassword: 'DifferentPassword123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('do not match')
        )).toBe(true);
      }
    });

    it('should reject invalid name', () => {
      const result = registerSchema.safeParse({
        ...validData,
        name: 'A',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required');
      }
    });

    it('should reject invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'invalid-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    const validData = {
      password: 'NewStrongPassword123!',
      confirmPassword: 'NewStrongPassword123!',
    };

    it('should accept valid reset password data', () => {
      const result = resetPasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when passwords do not match', () => {
      const result = resetPasswordSchema.safeParse({
        ...validData,
        confirmPassword: 'DifferentPassword123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('do not match')
        )).toBe(true);
      }
    });

    it('should reject weak password', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'weak',
        confirmPassword: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return score 0 and feedback for empty password', () => {
      const result = validatePasswordStrength('');
      expect(result.score).toBe(0);
      expect(result.feedback).toHaveLength(5); // All requirements missing
    });

    it('should return score 2 and feedback for password with length and numbers', () => {
      const result = validatePasswordStrength('12345678');
      expect(result.score).toBe(2); // Length + numbers
      expect(result.feedback).toHaveLength(3); // Missing 3 requirements
      expect(result.feedback).toContain('Add lowercase letters');
      expect(result.feedback).toContain('Add uppercase letters');
      expect(result.feedback).toContain('Add special characters');
    });

    it('should return score 5 and no feedback for strong password', () => {
      const result = validatePasswordStrength('StrongPassword123!');
      expect(result.score).toBe(5);
      expect(result.feedback).toHaveLength(0);
    });

    it('should provide specific feedback for missing requirements', () => {
      const result = validatePasswordStrength('lowercase123');
      expect(result.feedback).toContain('Add uppercase letters');
      expect(result.feedback).toContain('Add special characters');
      expect(result.feedback).not.toContain('Add lowercase letters');
      expect(result.feedback).not.toContain('Add numbers');
    });

    it('should handle password with all character types', () => {
      const result = validatePasswordStrength('Aa1!');
      expect(result.score).toBe(4); // Missing length requirement
      expect(result.feedback).toContain('Use at least 8 characters');
    });
  });
});