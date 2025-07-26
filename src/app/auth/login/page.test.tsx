import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { useAuth } from '@/components/auth/auth-provider';
import LoginPage from './page';

// Mock the auth provider
vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: vi.fn(),
  useRedirectIfAuthenticated: vi.fn(),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn((key: string) => {
      if (key === 'redirect') return '/dashboard';
      if (key === 'message') return null;
      return null;
    }),
  })),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      error: null,
      clearError: mockClearError,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('renders login form with all required fields', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('displays registration success message when message param is present', () => {
    // Mock search params to return registration success message
    vi.mocked(require('next/navigation').useSearchParams).mockReturnValue({
      get: vi.fn((key: string) => {
        if (key === 'message') return 'registration-success';
        return null;
      }),
    });

    render(<LoginPage />);
    
    expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    expect(screen.getByText(/your account has been created successfully/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('calls login function with correct credentials on form submission', async () => {
    mockLogin.mockResolvedValue(true);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        '/dashboard'
      );
    });
  });

  it('displays authentication error from auth context', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      error: 'Invalid email or password',
      clearError: mockClearError,
      isLoading: false,
      isAuthenticated: false,
    });
    
    render(<LoginPage />);
    
    expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('shows loading state during form submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when form is invalid', () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when form is valid', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('contains links to register and forgot password pages', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('link', { name: /create a new account/i })).toHaveAttribute('href', '/auth/register');
    expect(screen.getByRole('link', { name: /forgot your password/i })).toHaveAttribute('href', '/auth/forgot-password');
    expect(screen.getByRole('link', { name: /sign up here/i })).toHaveAttribute('href', '/auth/register');
  });

  it('clears errors when form is submitted', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });
});