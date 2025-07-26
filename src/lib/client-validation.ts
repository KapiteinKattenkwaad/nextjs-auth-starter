import { z } from 'zod';
import { validatePasswordStrength } from './validation';

// Real-time field validation utilities
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

// Validate email in real-time
export function validateEmailField(email: string): ValidationResult {
  if (!email) {
    return { isValid: false };
  }

  try {
    z.string().email().parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0]?.message || 'Invalid email format',
      };
    }
    return { isValid: false, error: 'Invalid email format' };
  }
}

// Validate password in real-time with strength feedback
export function validatePasswordField(password: string): ValidationResult & {
  strength?: { score: number; feedback: string[] };
} {
  if (!password) {
    return { isValid: false };
  }

  const strength = validatePasswordStrength(password);
  
  if (strength.score < 3) {
    return {
      isValid: false,
      error: 'Password is too weak',
      strength,
    };
  }

  if (strength.score < 5) {
    return {
      isValid: true,
      warning: 'Password could be stronger',
      strength,
    };
  }

  return {
    isValid: true,
    strength,
  };
}

// Validate name field in real-time
export function validateNameField(name: string): ValidationResult {
  if (!name) {
    return { isValid: false };
  }

  if (name.length < 2) {
    return {
      isValid: false,
      error: 'Name must be at least 2 characters long',
    };
  }

  if (name.length > 50) {
    return {
      isValid: false,
      error: 'Name must be less than 50 characters',
    };
  }

  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return {
      isValid: false,
      error: 'Name can only contain letters and spaces',
    };
  }

  return { isValid: true };
}

// Validate password confirmation
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: 'Passwords do not match',
    };
  }

  return { isValid: true };
}

// Generic field validator that can be used with any Zod schema
export function validateField<T>(
  value: T,
  schema: z.ZodSchema<T>
): ValidationResult {
  try {
    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0]?.message || 'Invalid value',
      };
    }
    return { isValid: false, error: 'Invalid value' };
  }
}

// Debounced validation utility for performance
export function createDebouncedValidator<T>(
  validator: (value: T) => ValidationResult,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;

  return (value: T, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
}