/**
 * Form validation hooks
 * 
 * This module provides custom React hooks for form validation using react-hook-form
 * and Zod schemas. Each hook is tailored for specific authentication forms and includes
 * built-in error handling, submission state management, and field validation utilities.
 * 
 * Security considerations:
 * - All forms use Zod validation for type safety and input sanitization
 * - Error handling prevents sensitive information leakage
 * - Submission state prevents double submissions
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

// Import validation schemas
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from '@/lib/validation';

/**
 * Custom hook for login form validation and submission
 * 
 * Provides form state management, validation, and submission handling
 * for the login form with email and password fields.
 * 
 * @returns Object containing form methods, validation state, and submission utilities
 * 
 * @example
 * ```typescript
 * const { register, handleSubmit, isSubmitting, getFieldError } = useLoginForm();
 * 
 * const onSubmit = async (data: LoginFormData) => {
 *   // Handle login logic
 * };
 * 
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <input {...register('email')} />
 *   {getFieldError('email') && <span>{getFieldError('email')}</span>}
 * </form>
 * ```
 */
export function useLoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (
    onSubmit: (data: LoginFormData) => Promise<void> | void,
    onError?: (error: Error) => void
  ) => {
    return form.handleSubmit(async (data) => {
      try {
        setIsSubmitting(true);
        await onSubmit(data);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          console.error('Form submission error:', error);
        }
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const getFieldError = (fieldName: keyof LoginFormData) => {
    const error = form.formState.errors[fieldName];
    return error?.message as string | undefined;
  };

  const isFieldInvalid = (fieldName: keyof LoginFormData) => {
    return !!form.formState.errors[fieldName] && form.formState.touchedFields[fieldName];
  };

  return {
    ...form,
    isSubmitting,
    handleSubmit,
    getFieldError,
    isFieldInvalid,
  };
}

/**
 * Custom hook for registration form validation and submission
 * 
 * Provides form state management, validation, and submission handling
 * for the registration form with name, email, password, and confirm password fields.
 * Includes password confirmation validation.
 * 
 * @returns Object containing form methods, validation state, and submission utilities
 */
export function useRegisterForm() {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Enhanced submit handler with error handling and loading state
   * @param onSubmit - Function to handle form submission
   * @param onError - Optional error handler
   */
  const handleSubmit = (
    onSubmit: (data: RegisterFormData) => Promise<void> | void,
    onError?: (error: Error) => void
  ) => {
    return form.handleSubmit(async (data) => {
      try {
        setIsSubmitting(true);
        await onSubmit(data);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          console.error('Form submission error:', error);
        }
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  /**
   * Get error message for a specific field
   * @param fieldName - Name of the field to get error for
   * @returns Error message or undefined if no error
   */
  const getFieldError = (fieldName: keyof RegisterFormData) => {
    const error = form.formState.errors[fieldName];
    return error?.message as string | undefined;
  };

  /**
   * Check if a field is invalid and has been touched
   * @param fieldName - Name of the field to check
   * @returns True if field is invalid and touched
   */
  const isFieldInvalid = (fieldName: keyof RegisterFormData) => {
    return !!form.formState.errors[fieldName] && form.formState.touchedFields[fieldName];
  };

  return {
    ...form,
    isSubmitting,
    handleSubmit,
    getFieldError,
    isFieldInvalid,
  };
}

/**
 * Custom hook for forgot password form validation and submission
 * 
 * Provides form state management, validation, and submission handling
 * for the forgot password form with email field only.
 * 
 * @returns Object containing form methods, validation state, and submission utilities
 */
export function useForgotPasswordForm() {
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Enhanced submit handler with error handling and loading state
   * @param onSubmit - Function to handle form submission
   * @param onError - Optional error handler
   */
  const handleSubmit = (
    onSubmit: (data: ForgotPasswordFormData) => Promise<void> | void,
    onError?: (error: Error) => void
  ) => {
    return form.handleSubmit(async (data) => {
      try {
        setIsSubmitting(true);
        await onSubmit(data);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          console.error('Form submission error:', error);
        }
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  /**
   * Get error message for a specific field
   * @param fieldName - Name of the field to get error for
   * @returns Error message or undefined if no error
   */
  const getFieldError = (fieldName: keyof ForgotPasswordFormData) => {
    const error = form.formState.errors[fieldName];
    return error?.message as string | undefined;
  };

  /**
   * Check if a field is invalid and has been touched
   * @param fieldName - Name of the field to check
   * @returns True if field is invalid and touched
   */
  const isFieldInvalid = (fieldName: keyof ForgotPasswordFormData) => {
    return !!form.formState.errors[fieldName] && form.formState.touchedFields[fieldName];
  };

  return {
    ...form,
    isSubmitting,
    handleSubmit,
    getFieldError,
    isFieldInvalid,
  };
}

/**
 * Custom hook for reset password form validation and submission
 * 
 * Provides form state management, validation, and submission handling
 * for the reset password form with password and confirm password fields.
 * Includes password confirmation validation.
 * 
 * @returns Object containing form methods, validation state, and submission utilities
 */
export function useResetPasswordForm() {
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Enhanced submit handler with error handling and loading state
   * @param onSubmit - Function to handle form submission
   * @param onError - Optional error handler
   */
  const handleSubmit = (
    onSubmit: (data: ResetPasswordFormData) => Promise<void> | void,
    onError?: (error: Error) => void
  ) => {
    return form.handleSubmit(async (data) => {
      try {
        setIsSubmitting(true);
        await onSubmit(data);
      } catch (error) {
        if (onError) {
          onError(error as Error);
        } else {
          console.error('Form submission error:', error);
        }
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  /**
   * Get error message for a specific field
   * @param fieldName - Name of the field to get error for
   * @returns Error message or undefined if no error
   */
  const getFieldError = (fieldName: keyof ResetPasswordFormData) => {
    const error = form.formState.errors[fieldName];
    return error?.message as string | undefined;
  };

  /**
   * Check if a field is invalid and has been touched
   * @param fieldName - Name of the field to check
   * @returns True if field is invalid and touched
   */
  const isFieldInvalid = (fieldName: keyof ResetPasswordFormData) => {
    return !!form.formState.errors[fieldName] && form.formState.touchedFields[fieldName];
  };

  return {
    ...form,
    isSubmitting,
    handleSubmit,
    getFieldError,
    isFieldInvalid,
  };
}