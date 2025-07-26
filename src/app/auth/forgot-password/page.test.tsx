import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { useAuth } from '@/components/auth/auth-provider';
import ForgotPasswordPage from './page';

// Mock the auth provider
vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: vi.fn(),
  useRedirectIfAuthenticated: vi.fn(),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('ForgotPasswordPage', () => {
  const mockForgotPassword = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      forgotPassword: mockForgotPassword,
      error: null,
      clearError: mockClearError,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('renders forgot password form with email field', () => {
    render(<ForgotPasswordPage />);
    
    expect(screen.getByRole('heading', { name: /forgot your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email field', async () => {
    render(<ForgotPasswordPage />);
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('calls forgotPassword function with correct email on form submission', async () => {
    mockForgotPassword.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('displays success message after successful email submission', async () => {
    mockForgotPassword.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
      expect(screen.getByText(/we've sent password reset instructions to your email address/i)).toBeInTheDocument();
    });
  });

  it('displays success screen with back to login button', async () => {
    mockForgotPassword.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/auth/login');
      expect(screen.getByRole('button', { name: /try a different email address/i })).toBeInTheDocument();
    });
  });

  it('allows user to try different email address from success screen', async () => {
    mockForgotPassword.mockResolvedValue({ success: true });
    
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument();
    });

    const tryDifferentEmailButton = screen.getByRole('button', { name: /try a different email address/i });
    fireEvent.click(tryDifferentEmailButton);
    
    expect(screen.getByRole('heading', { name: /forgot your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('displays error message when forgot password fails', async () => {
    mockForgotPassword.mockResolvedValue({ success: false, error: 'Email not found' });
    
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });

  it('displays authentication error from auth context', () => {
    mockUseAuth.mockReturnValue({
      forgotPassword: mockForgotPassword,
      error: 'Network error',
      clearError: mockClearError,
      isLoading: false,
      isAuthenticated: false,
    });
    
    render(<ForgotPasswordPage />);
    
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  it('shows loading state during form submission', async () => {
    mockForgotPassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
    
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/sending.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when form is invalid', () => {
    render(<ForgotPasswordPage />);
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', async () => {
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('contains link to login page', () => {
    render(<ForgotPasswordPage />);
    
    expect(screen.getByRole('link', { name: /sign in here/i })).toHaveAttribute('href', '/auth/login');
  });

  it('clears errors when form is submitted', async () => {
    render(<ForgotPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });
});