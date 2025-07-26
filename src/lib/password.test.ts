/**
 * Unit tests for password utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  isPasswordStrengthAcceptable,
  PASSWORD_REQUIREMENTS,
} from './password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword('', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return no errors for a strong password', () => {
      const password = 'StrongPassword123!';
      const errors = validatePasswordStrength(password);
      
      expect(errors).toHaveLength(0);
    });

    it('should return length error for short password', () => {
      const password = 'Short1!';
      const errors = validatePasswordStrength(password);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('password.length');
      expect(errors[0].message).toContain('at least 8 characters');
    });

    it('should return uppercase error when missing uppercase', () => {
      const password = 'lowercase123!';
      const errors = validatePasswordStrength(password);
      
      expect(errors.some(e => e.code === 'password.uppercase')).toBe(true);
    });

    it('should return lowercase error when missing lowercase', () => {
      const password = 'UPPERCASE123!';
      const errors = validatePasswordStrength(password);
      
      expect(errors.some(e => e.code === 'password.lowercase')).toBe(true);
    });

    it('should return number error when missing numbers', () => {
      const password = 'NoNumbers!';
      const errors = validatePasswordStrength(password);
      
      expect(errors.some(e => e.code === 'password.number')).toBe(true);
    });

    it('should return special character error when missing special chars', () => {
      const password = 'NoSpecialChars123';
      const errors = validatePasswordStrength(password);
      
      expect(errors.some(e => e.code === 'password.special')).toBe(true);
    });

    it('should return multiple errors for weak password', () => {
      const password = 'weak';
      const errors = validatePasswordStrength(password);
      
      expect(errors.length).toBeGreaterThan(1);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should return 0 for empty password', () => {
      const score = calculatePasswordStrength('');
      expect(score).toBe(0);
    });

    it('should return low score for weak password', () => {
      const score = calculatePasswordStrength('weak');
      expect(score).toBeLessThan(30);
    });

    it('should return high score for strong password', () => {
      const score = calculatePasswordStrength('VeryStrongPassword123!@#');
      expect(score).toBeGreaterThan(70);
    });

    it('should penalize repeated characters', () => {
      const normalScore = calculatePasswordStrength('StrongPassword123!');
      const repeatedScore = calculatePasswordStrength('StrongPasswordaaa123!');
      
      expect(repeatedScore).toBeLessThan(normalScore);
    });

    it('should penalize sequential characters', () => {
      const normalScore = calculatePasswordStrength('StrongPassword123!');
      const sequentialScore = calculatePasswordStrength('StrongPasswordabc123!');
      
      expect(sequentialScore).toBeLessThan(normalScore);
    });

    it('should ensure score is between 0 and 100', () => {
      const veryWeakScore = calculatePasswordStrength('a');
      const veryStrongScore = calculatePasswordStrength('VeryVeryStrongPassword123!@#$%^&*()');
      
      expect(veryWeakScore).toBeGreaterThanOrEqual(0);
      expect(veryStrongScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('should return "Very Weak" for score < 20', () => {
      expect(getPasswordStrengthLabel(10)).toBe('Very Weak');
      expect(getPasswordStrengthLabel(19)).toBe('Very Weak');
    });

    it('should return "Weak" for score 20-39', () => {
      expect(getPasswordStrengthLabel(20)).toBe('Weak');
      expect(getPasswordStrengthLabel(39)).toBe('Weak');
    });

    it('should return "Moderate" for score 40-59', () => {
      expect(getPasswordStrengthLabel(40)).toBe('Moderate');
      expect(getPasswordStrengthLabel(59)).toBe('Moderate');
    });

    it('should return "Strong" for score 60-79', () => {
      expect(getPasswordStrengthLabel(60)).toBe('Strong');
      expect(getPasswordStrengthLabel(79)).toBe('Strong');
    });

    it('should return "Very Strong" for score >= 80', () => {
      expect(getPasswordStrengthLabel(80)).toBe('Very Strong');
      expect(getPasswordStrengthLabel(100)).toBe('Very Strong');
    });
  });

  describe('isPasswordStrengthAcceptable', () => {
    it('should return true for acceptable password', () => {
      const password = 'AcceptablePassword123!';
      const isAcceptable = isPasswordStrengthAcceptable(password);
      
      expect(isAcceptable).toBe(true);
    });

    it('should return false for unacceptable password', () => {
      const password = 'weak';
      const isAcceptable = isPasswordStrengthAcceptable(password);
      
      expect(isAcceptable).toBe(false);
    });
  });

  describe('PASSWORD_REQUIREMENTS', () => {
    it('should have correct default requirements', () => {
      expect(PASSWORD_REQUIREMENTS.minLength).toBe(8);
      expect(PASSWORD_REQUIREMENTS.requireUppercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireLowercase).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireNumbers).toBe(true);
      expect(PASSWORD_REQUIREMENTS.requireSpecialChars).toBe(true);
    });
  });
});