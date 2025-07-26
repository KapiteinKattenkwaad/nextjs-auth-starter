/**
 * Unit tests for client validation utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validateEmailField,
  validatePasswordField,
  validateNameField,
  validatePasswordConfirmation,
  validateField,
  createDebouncedValidator,
} from './client-validation';
import { z } from 'zod';

// Mock the validation module
vi.mock('./validation', () => ({
  validatePasswordStrength: vi.fn((password: string) => ({
    score: password.length > 10 ? 5 : password.length > 5 ? 3 : 1,
    feedback: password.length > 10 ? [] : ['Password could be stronger'],
  })),
}));

describe('Client Validation Utilities', () => {
  describe('validateEmailField', () => {
    it('should return valid for correct email', () => {
      const result = validateEmailField('test@example.com');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty email', () => {
      const result = validateEmailField('');
      
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for malformed email', () => {
      const result = validateEmailField('invalid-email');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for email without domain', () => {
      const result = validateEmailField('test@');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for email without @', () => {
      const result = validateEmailField('testexample.com');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validatePasswordField', () => {
    it('should return invalid for empty password', () => {
      const result = validatePasswordField('');
      
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for very weak password', () => {
      const result = validatePasswordField('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password is too weak');
      expect(result.strength).toBeDefined();
    });

    it('should return valid with warning for moderate password', () => {
      const result = validatePasswordField('moderate');
      
      expect(result.isValid).toBe(true);
      expect(result.warning).toBe('Password could be stronger');
      expect(result.strength).toBeDefined();
    });

    it('should return valid for strong password', () => {
      const result = validatePasswordField('verystrongpassword');
      
      expect(result.isValid).toBe(true);
      expect(result.warning).toBeUndefined();
      expect(result.error).toBeUndefined();
      expect(result.strength).toBeDefined();
    });
  });

  describe('validateNameField', () => {
    it('should return valid for correct name', () => {
      const result = validateNameField('John Doe');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty name', () => {
      const result = validateNameField('');
      
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for name too short', () => {
      const result = validateNameField('A');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be at least 2 characters long');
    });

    it('should return invalid for name too long', () => {
      const longName = 'A'.repeat(51);
      const result = validateNameField(longName);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name must be less than 50 characters');
    });

    it('should return invalid for name with numbers', () => {
      const result = validateNameField('John123');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name can only contain letters and spaces');
    });

    it('should return invalid for name with special characters', () => {
      const result = validateNameField('John@Doe');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Name can only contain letters and spaces');
    });

    it('should return valid for name with spaces', () => {
      const result = validateNameField('John Middle Doe');
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('should return valid for matching passwords', () => {
      const result = validatePasswordConfirmation('password123', 'password123');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty confirmation', () => {
      const result = validatePasswordConfirmation('password123', '');
      
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-matching passwords', () => {
      const result = validatePasswordConfirmation('password123', 'different123');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Passwords do not match');
    });
  });

  describe('validateField', () => {
    it('should return valid for value that passes schema', () => {
      const schema = z.string().min(3);
      const result = validateField('test', schema);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for value that fails schema', () => {
      const schema = z.string().min(5);
      const result = validateField('test', schema);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for wrong type', () => {
      const schema = z.number();
      const result = validateField('not a number' as any, schema);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('createDebouncedValidator', () => {
    it('should debounce validation calls', async () => {
      const mockValidator = vi.fn().mockReturnValue({ isValid: true });
      const mockCallback = vi.fn();
      const debouncedValidator = createDebouncedValidator(mockValidator, 100);
      
      // Call multiple times quickly
      debouncedValidator('test1', mockCallback);
      debouncedValidator('test2', mockCallback);
      debouncedValidator('test3', mockCallback);
      
      // Should not have called validator yet
      expect(mockValidator).not.toHaveBeenCalled();
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should have called validator only once with the last value
      expect(mockValidator).toHaveBeenCalledTimes(1);
      expect(mockValidator).toHaveBeenCalledWith('test3');
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith({ isValid: true });
    });

    it('should use default delay of 300ms', async () => {
      const mockValidator = vi.fn().mockReturnValue({ isValid: true });
      const mockCallback = vi.fn();
      const debouncedValidator = createDebouncedValidator(mockValidator);
      
      debouncedValidator('test', mockCallback);
      
      // Should not have called validator after 200ms
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(mockValidator).not.toHaveBeenCalled();
      
      // Should have called validator after 350ms
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(mockValidator).toHaveBeenCalledTimes(1);
    });
  });
});