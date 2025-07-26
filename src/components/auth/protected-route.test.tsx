import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import { useAuth } from './auth-provider';
import { ProtectedRoute, withProtectedRoute } from './protected-route';

// Mock the auth provider
vi.mock('./auth-provider', () => ({
  useAuth: vi.fn(),
}));

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading state when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/checking authentication.../i)).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows custom fallback when provided and loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const customFallback = <div>Custom Loading...</div>;

    render(
      <ProtectedRoute fallback={customFallback}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    expect(screen.queryByText(/checking authentication.../i)).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to custom URL when specified and user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    render(
      <ProtectedRoute redirectTo="/custom-login">
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-login');
    });
  });

  it('does not redirect when loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('returns null when not authenticated and not loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('withProtectedRoute', () => {
  const TestComponent = ({ message }: { message: string }) => (
    <div>{message}</div>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a protected version of the component', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const ProtectedTestComponent = withProtectedRoute(TestComponent);

    render(<ProtectedTestComponent message="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('passes props correctly to the wrapped component', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const ProtectedTestComponent = withProtectedRoute(TestComponent);

    render(<ProtectedTestComponent message="Test Message" />);

    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('uses custom redirect URL when specified', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const ProtectedTestComponent = withProtectedRoute(TestComponent, '/custom-redirect');

    render(<ProtectedTestComponent message="Hello World" />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/custom-redirect');
    });
  });

  it('sets correct display name for the wrapped component', () => {
    const ProtectedTestComponent = withProtectedRoute(TestComponent);
    
    expect(ProtectedTestComponent.displayName).toBe('withProtectedRoute(TestComponent)');
  });

  it('handles components without display name', () => {
    const AnonymousComponent = () => <div>Anonymous</div>;
    const ProtectedAnonymousComponent = withProtectedRoute(AnonymousComponent);
    
    expect(ProtectedAnonymousComponent.displayName).toBe('withProtectedRoute(AnonymousComponent)');
  });

  it('shows loading state for wrapped component', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const ProtectedTestComponent = withProtectedRoute(TestComponent);

    render(<ProtectedTestComponent message="Hello World" />);

    expect(screen.getByText(/checking authentication.../i)).toBeInTheDocument();
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
  });

  it('redirects when user is not authenticated for wrapped component', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const ProtectedTestComponent = withProtectedRoute(TestComponent);

    render(<ProtectedTestComponent message="Hello World" />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });

    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
  });
});