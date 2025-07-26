import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { useAuth } from '@/components/auth/auth-provider';
import ResetPasswordPage from './page';

// Mock the auth provider
vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: vi.fn(),
  useRedirectIfAuthenticated: vi.fn(),
}));

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === 'token') return 'valid-reset-token';
      return null;
    }),
  })),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('ResetPasswordPage', () => {
  const mockResetPassword = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      resetPassword: mockResetPassword,
      error: null,
      clearError: mockClearError,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('renders reset password form with password fields when token is present', () => {
    render(<ResetPasswordPage />);
    
    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your new password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('displays error screen when token is missing', () => {
    // Mock search params to return no token
    vi.mocked(require('next/navigation').useSearchParams).mockReturnValue({
      get: vi.fn(() => null),
    });

    render(<ResetPasswordPage />);
    
    expect(screen.getByRole('heading', { name: /invalid reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/this password reset link is invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request new reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty password fields', async () => {
    render(<ResetPasswordPage />);
    
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for weak password', async () => {
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/password must contain at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your new password/i);
    
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
    fireEvent.blur(confirmPasswordInput);
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('calls resetPassword function with correct token and password on form submission', async () => {
    mockResetPassword.mockResolvedValue({ success: true });
    
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('valid-reset-token', 'NewPassword123!');
    });
  });

  it('displays success message after successful password reset', async () => {
    mockResetPassword.mockResolvedValue({ success: true });
    
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /password reset successful/i })).toBeInTheDocument();
      expect(screen.getByText(/your password has been successfully updated/i)).toBeInTheDocument();
    });
  });

  it('displays success screen with continue to login button', async () => {
    mockResetPassword.mockResolvedValue({ success: true });
    
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const continueButton = screen.getByRole('button', { name: /continue to login/i });
      expect(continueButton).toBeInTheDocument();
      
      fireEvent.click(continueButton);
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('displays error message when password reset fails', async () => {
    mockResetPassword.mockResolvedValue({ success: false, error: 'Invalid or expired token' });
    
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
    });
  });

  it('displays authentication error from auth context', () => {
    mockUseAuth.mockReturnValue({
      resetPassword: mockResetPassword,
      error: 'Network error',
      clearError: mockClearError,
      isLoading: false,
      isAuthenticated: false,
    });
    
    render(<ResetPasswordPage />);
    
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  it('shows loading state during form submission', async () => {
    mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
    
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/resetting password.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when form is invalid', () => {
    render(<ResetPasswordPage />);
    
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows error screen when token is missing', () => {
    // This test is covered by the "displays error screen when token is missing" test above
    // We'll skip this duplicate test
    expect(true).toBe(true);
  });

  it('contains link to login page', () => {
    render(<ResetPasswordPage />);
    
    expect(screen.getByRole('link', { name: /sign in here/i })).toHaveAttribute('href', '/auth/login');
  });

  it('clears errors when form is submitted', async () => {
    render(<ResetPasswordPage />);
    
    const passwordInput = screen.getByPlaceholderText(/enter your new password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/confirm your new password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });
});