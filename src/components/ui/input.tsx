/**
 * Input Component
 * 
 * A reusable input component with label, error states, and helper text.
 * Designed for form usage with proper accessibility and validation feedback.
 * 
 * Security considerations:
 * - Supports all standard HTML input types for proper validation
 * - Error states help prevent invalid data submission
 * - Proper labeling for screen readers
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for the Input component
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display when no error */
  helperText?: string;
  /** Visual variant of the input */
  variant?: 'default' | 'error' | 'success';
}

/**
 * Input component with label, error states, and helper text
 * 
 * @param type - HTML input type (default: 'text')
 * @param label - Label text for the input
 * @param error - Error message to display (overrides variant)
 * @param helperText - Helper text to show when no error
 * @param variant - Visual style variant (default: 'default')
 * @param className - Additional CSS classes
 * @param props - Additional HTML input attributes
 * @param ref - Forwarded ref to the input element
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email Address"
 *   type="email"
 *   error={errors.email}
 *   helperText="We'll never share your email"
 *   {...register('email')}
 * />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, variant = 'default', ...props }, ref) => {
    const inputVariant = error ? 'error' : variant;
    
    const baseStyles = 'flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    const variants = {
      default: 'border-gray-300 bg-white focus-visible:ring-blue-500 focus-visible:border-blue-500',
      error: 'border-red-500 bg-white focus-visible:ring-red-500 focus-visible:border-red-500',
      success: 'border-green-500 bg-white focus-visible:ring-green-500 focus-visible:border-green-500'
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            baseStyles,
            variants[inputVariant],
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };