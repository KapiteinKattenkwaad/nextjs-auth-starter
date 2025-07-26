/**
 * Password utilities
 * 
 * This module provides utility functions for password hashing,
 * verification, and strength validation.
 */

import { hash, compare } from "bcryptjs";

/**
 * Salt rounds for bcrypt
 * Higher values are more secure but slower
 */
const SALT_ROUNDS = 12;

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Password strength validation error
 */
export interface PasswordValidationError {
  code: string;
  message: string;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns True if the password matches the hash, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Array of validation errors, empty if password is valid
 */
export function validatePasswordStrength(
  password: string
): PasswordValidationError[] {
  const errors: PasswordValidationError[] = [];

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push({
      code: "password.length",
      message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
    });
  }

  // Check for uppercase letters
  if (
    PASSWORD_REQUIREMENTS.requireUppercase &&
    !/[A-Z]/.test(password)
  ) {
    errors.push({
      code: "password.uppercase",
      message: "Password must contain at least one uppercase letter",
    });
  }

  // Check for lowercase letters
  if (
    PASSWORD_REQUIREMENTS.requireLowercase &&
    !/[a-z]/.test(password)
  ) {
    errors.push({
      code: "password.lowercase",
      message: "Password must contain at least one lowercase letter",
    });
  }

  // Check for numbers
  if (
    PASSWORD_REQUIREMENTS.requireNumbers &&
    !/[0-9]/.test(password)
  ) {
    errors.push({
      code: "password.number",
      message: "Password must contain at least one number",
    });
  }

  // Check for special characters
  if (
    PASSWORD_REQUIREMENTS.requireSpecialChars &&
    !/[^A-Za-z0-9]/.test(password)
  ) {
    errors.push({
      code: "password.special",
      message: "Password must contain at least one special character",
    });
  }

  return errors;
}

/**
 * Calculate password strength score (0-100)
 * @param password - Password to evaluate
 * @returns Score between 0 (weakest) and 100 (strongest)
 */
export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Base score from length (up to 40 points)
  score += Math.min(40, password.length * 4);
  
  // Variety of character types (up to 40 points)
  if (/[A-Z]/.test(password)) score += 10;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  
  // Bonus for combination of character types (up to 20 points)
  let typesCount = 0;
  if (/[A-Z]/.test(password)) typesCount++;
  if (/[a-z]/.test(password)) typesCount++;
  if (/[0-9]/.test(password)) typesCount++;
  if (/[^A-Za-z0-9]/.test(password)) typesCount++;
  
  score += (typesCount - 1) * 10;
  
  // Penalties
  
  // Repeated characters
  const repeats = password.match(/(.)\1+/g);
  if (repeats) {
    score -= repeats.join('').length * 2;
  }
  
  // Sequential characters (like "abc" or "123")
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
    "01234567890"
  ];
  
  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      const fragment = seq.substring(i, i + 3);
      if (password.toLowerCase().includes(fragment)) {
        score -= 5;
      }
    }
  }
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get password strength label based on score
 * @param score - Password strength score (0-100)
 * @returns Strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score < 20) return "Very Weak";
  if (score < 40) return "Weak";
  if (score < 60) return "Moderate";
  if (score < 80) return "Strong";
  return "Very Strong";
}

/**
 * Check if a password meets minimum strength requirements
 * @param password - Password to check
 * @returns True if password meets minimum requirements, false otherwise
 */
export function isPasswordStrengthAcceptable(password: string): boolean {
  return validatePasswordStrength(password).length === 0;
}