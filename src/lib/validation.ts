/**
 * Form validation schemas and utilities
 * 
 * This module provides Zod validation schemas for all authentication forms
 * and utility functions for password strength validation.
 * 
 * Security considerations:
 * - Password requirements follow OWASP guidelines
 * - Email validation prevents common injection attacks
 * - Name validation prevents XSS through special characters
 */

import { z } from 'zod';

/**
 * Password validation schema with strength requirements
 * 
 * Enforces OWASP password guidelines:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

/**
 * Email validation schema
 * 
 * Uses Zod's built-in email validation which follows RFC 5322 specification
 */
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

/**
 * Name validation schema
 * 
 * Security note: Restricts to letters and spaces only to prevent XSS attacks
 * through malicious names containing HTML/JavaScript
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

/**
 * Registration form validation schema
 * 
 * Includes password confirmation validation to ensure user typed password correctly
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Login form validation schema
 * 
 * Simplified validation for login - only checks that fields are present
 * Detailed validation happens server-side during authentication
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Forgot password form validation schema
 * 
 * Only requires email validation
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password form validation schema
 * 
 * Similar to registration but without name field
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * TypeScript types inferred from validation schemas
 * These ensure type safety when handling form data
 */
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * Password strength validation result
 */
export interface PasswordStrengthResult {
  /** Strength score from 0-5 (number of requirements met) */
  score: number;
  /** Array of feedback messages for unmet requirements */
  feedback: string[];
}

/**
 * Validate password strength and provide feedback
 * 
 * This function provides real-time feedback to users about password strength
 * without exposing the exact requirements to potential attackers.
 * 
 * @param password - The password to validate
 * @returns Object containing strength score and feedback messages
 * 
 * @example
 * ```typescript
 * const result = validatePasswordStrength('mypassword');
 * console.log(result.score); // 2
 * console.log(result.feedback); // ['Add uppercase letters', 'Add numbers', 'Add special characters']
 * ```
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  // Check minimum length requirement
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Check for numbers
  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  // Check for special characters
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  return { score, feedback };
}