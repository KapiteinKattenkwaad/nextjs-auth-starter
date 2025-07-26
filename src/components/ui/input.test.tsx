import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { Input } from './input';

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveClass('border-gray-300', 'bg-white');
  });

  it('renders with custom type', () => {
    render(<Input type="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders password input', () => {
    render(<Input type="password" />);
    
    const input = screen.getByLabelText('', { selector: 'input[type="password"]' });
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email Address" />);
    
    const label = screen.getByText('Email Address');
    const input = screen.getByRole('textbox');
    
    expect(label).toBeInTheDocument();
    expect(label).toHaveClass('text-sm', 'font-medium');
    expect(input).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter your email" />);
    
    const input = screen.getByPlaceholderText('Enter your email');
    expect(input).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(<Input error="This field is required" />);
    
    const input = screen.getByRole('textbox');
    const errorMessage = screen.getByText('This field is required');
    
    expect(input).toHaveClass('border-red-500');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-sm', 'text-red-600');
  });

  it('renders with helper text when no error', () => {
    render(<Input helperText="This is helpful information" />);
    
    const helperText = screen.getByText('This is helpful information');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-sm', 'text-gray-500');
  });

  it('shows error message instead of helper text when both are provided', () => {
    render(
      <Input 
        error="This field is required" 
        helperText="This is helpful information" 
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('This is helpful information')).not.toBeInTheDocument();
  });

  it('applies error variant styling when error is present', () => {
    render(<Input error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500', 'focus-visible:ring-red-500');
  });

  it('applies success variant styling', () => {
    render(<Input variant="success" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-green-500', 'focus-visible:ring-green-500');
  });

  it('applies default variant styling', () => {
    render(<Input variant="default" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-gray-300', 'focus-visible:ring-blue-500');
  });

  it('error prop overrides variant prop', () => {
    render(<Input variant="success" error="Error message" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500', 'focus-visible:ring-red-500');
    expect(input).not.toHaveClass('border-green-500');
  });

  it('accepts custom className', () => {
    render(<Input className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

  it('passes through additional HTML input props', () => {
    render(
      <Input 
        data-testid="test-input"
        autoComplete="email"
        required
        disabled
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('autoComplete', 'email');
    expect(input).toHaveAttribute('required');
    expect(input).toBeDisabled();
  });

  it('calls onChange handler when value changes', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: 'test value' })
    }));
  });

  it('calls onFocus and onBlur handlers', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
  });

  it('applies disabled styles when disabled', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    expect(input).toBeDisabled();
  });

  it('renders with value prop', () => {
    render(<Input value="test value" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test value');
  });

  it('renders with defaultValue prop', () => {
    render(<Input defaultValue="default value" />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('default value');
  });

  it('maintains proper structure with label and error', () => {
    render(
      <Input 
        label="Test Label" 
        error="Test Error"
        helperText="Test Helper"
      />
    );
    
    const container = screen.getByText('Test Label').parentElement;
    expect(container).toHaveClass('space-y-2');
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.queryByText('Test Helper')).not.toBeInTheDocument();
  });
});