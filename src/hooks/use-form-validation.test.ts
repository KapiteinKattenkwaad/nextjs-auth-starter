/**
 * Unit tests for form validation hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useLoginForm,
  useRegisterForm,
  useForgotPasswordForm,
  useResetPasswordForm,
} from './use-form-validation';

// Mock the validation schemas
vi.mock('@/lib/validation', () => ({
  loginSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  registerSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  forgotPasswordSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  resetPasswordSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
}));

// Mock react-hook-form
const mockHandleSubmit = vi.fn();
let mockFormState = {
  errors: {},
  touchedFields: {},
  isValid: true,
  isDirty: false,
  isSubmitting: false,
};

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    handleSubmit: mockHandleSubmit,
    formState: mockFormState,
    register: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
    watch: vi.fn(),
    control: {},
  })),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn((schema) => schema),
}));

describe('Form Validation Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleSubmit.mockImplementation((callback) => callback);
    // Reset mock form state
    mockFormState = {
      errors: {},
      touchedFields: {},
      isValid: true,
      isDirty: false,
      isSubmitting: false,
    };
  });

  describe('useLoginForm', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useLoginForm());

      expect(result.current.isSubmitting).toBe(false);
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.getFieldError).toBe('function');
      expect(typeof result.current.isFieldInvalid).toBe('function');
    });

    it('should handle form submission successfully', async () => {
      const { result } = renderHook(() => useLoginForm());
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockData = { email: 'test@example.com', password: 'password' };

      mockHandleSubmit.mockImplementation((callback) => () => callback(mockData));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(mockOnSubmit);
        await submitHandler();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(mockData);
    });

    it('should handle form submission error', async () => {
      const { result } = renderHook(() => useLoginForm());
      const mockError = new Error('Submission failed');
      const mockOnSubmit = vi.fn().mockRejectedValue(mockError);
      const mockOnError = vi.fn();
      const mockData = { email: 'test@example.com', password: 'password' };

      mockHandleSubmit.mockImplementation((callback) => () => callback(mockData));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(mockOnSubmit, mockOnError);
        await submitHandler();
      });

      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    it('should get field error correctly', () => {
      const { result } = renderHook(() => useLoginForm());
      
      // Mock form state with errors
      mockFormState.errors = {
        email: { message: 'Email is required' },
      };

      const error = result.current.getFieldError('email');
      expect(error).toBe('Email is required');
    });

    it('should check if field is invalid correctly', () => {
      const { result } = renderHook(() => useLoginForm());
      
      // Mock form state with errors and touched fields
      mockFormState.errors = {
        email: { message: 'Email is required' },
      };
      mockFormState.touchedFields = {
        email: true,
      };

      const isInvalid = result.current.isFieldInvalid('email');
      expect(isInvalid).toBe(true);
    });

    it('should return falsy for untouched field with error', () => {
      const { result } = renderHook(() => useLoginForm());
      
      // Mock form state with errors but no touched fields
      mockFormState.errors = {
        email: { message: 'Email is required' },
      };
      mockFormState.touchedFields = {};

      const isInvalid = result.current.isFieldInvalid('email');
      expect(isInvalid).toBeFalsy();
    });
  });

  describe('useRegisterForm', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useRegisterForm());

      expect(result.current.isSubmitting).toBe(false);
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.getFieldError).toBe('function');
      expect(typeof result.current.isFieldInvalid).toBe('function');
    });

    it('should handle form submission successfully', async () => {
      const { result } = renderHook(() => useRegisterForm());
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      mockHandleSubmit.mockImplementation((callback) => () => callback(mockData));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(mockOnSubmit);
        await submitHandler();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(mockData);
    });

    it('should get field error for register form fields', () => {
      const { result } = renderHook(() => useRegisterForm());
      
      mockFormState.errors = {
        name: { message: 'Name is required' },
      };

      const error = result.current.getFieldError('name');
      expect(error).toBe('Name is required');
    });
  });

  describe('useForgotPasswordForm', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useForgotPasswordForm());

      expect(result.current.isSubmitting).toBe(false);
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.getFieldError).toBe('function');
      expect(typeof result.current.isFieldInvalid).toBe('function');
    });

    it('should handle form submission successfully', async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockData = { email: 'test@example.com' };

      mockHandleSubmit.mockImplementation((callback) => () => callback(mockData));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(mockOnSubmit);
        await submitHandler();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(mockData);
    });
  });

  describe('useResetPasswordForm', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useResetPasswordForm());

      expect(result.current.isSubmitting).toBe(false);
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.getFieldError).toBe('function');
      expect(typeof result.current.isFieldInvalid).toBe('function');
    });

    it('should handle form submission successfully', async () => {
      const { result } = renderHook(() => useResetPasswordForm());
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
      const mockData = {
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      mockHandleSubmit.mockImplementation((callback) => () => callback(mockData));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(mockOnSubmit);
        await submitHandler();
      });

      expect(mockOnSubmit).toHaveBeenCalledWith(mockData);
    });
  });

  describe('Common hook behavior', () => {
    it('should set isSubmitting to true during submission', async () => {
      const { result } = renderHook(() => useLoginForm());
      const mockOnSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const mockData = { email: 'test@example.com', password: 'password' };

      mockHandleSubmit.mockImplementation((callback) => () => callback(mockData));

      act(() => {
        const submitHandler = result.current.handleSubmit(mockOnSubmit);
        submitHandler();
      });

      // Should be submitting during async operation
      expect(result.current.isSubmitting).toBe(true);

      // Wait for submission to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should reset isSubmitting after error', async () => {
      const { result } = renderHook(() => useLoginForm());
      const mockError = new Error('Submission failed');
      const mockOnSubmit = vi.fn().mockRejectedValue(mockError);
      const mockData = { email: 'test@example.com', password: 'password' };

      mockHandleSubmit.mockImplementation((callback) => () => callback(mockData));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(mockOnSubmit);
        await submitHandler();
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should log error to console when no error handler provided', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useLoginForm());
      const mockError = new Error('Submission failed');
      const mockOnSubmit = vi.fn().mockRejectedValue(mockError);
      const mockData = { email: 'test@example.com', password: 'password' };

      mockHandleSubmit.mockImplementation((callback) => () => callback(mockData));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(mockOnSubmit);
        await submitHandler();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Form submission error:', mockError);
      consoleSpy.mockRestore();
    });
  });
});