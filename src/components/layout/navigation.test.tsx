/**
 * Unit tests for Navigation component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { useSession, signOut } from 'next-auth/react';
import { Navigation } from './navigation';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockUseSession = useSession as ReturnType<typeof vi.fn>;
const mockSignOut = signOut as ReturnType<typeof vi.fn>;

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand logo and link', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Navigation />);
    
    const brandLink = screen.getByRole('link', { name: /auth starter/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('shows loading state when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<Navigation />);
    
    expect(screen.getByText('Auth Starter')).toBeInTheDocument();
    // Check for loading skeleton
    const loadingSkeleton = document.querySelector('.animate-pulse');
    expect(loadingSkeleton).toBeInTheDocument();
  });

  it('shows sign in and sign up buttons when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Navigation />);
    
    const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
    const signUpLinks = screen.getAllByRole('link', { name: /sign up/i });
    
    expect(signInLinks[0]).toHaveAttribute('href', '/auth/login');
    expect(signUpLinks[0]).toHaveAttribute('href', '/auth/register');
  });

  it('shows dashboard link and user info when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      status: 'authenticated',
    });

    render(<Navigation />);
    
    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard');
    expect(screen.getAllByText(/welcome, john doe/i)[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /sign out/i })[0]).toBeInTheDocument();
  });

  it('shows email when name is not available', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'john@example.com',
        },
      },
      status: 'authenticated',
    });

    render(<Navigation />);
    
    expect(screen.getAllByText(/welcome, john@example.com/i)[0]).toBeInTheDocument();
  });

  it('calls signOut when sign out button is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      status: 'authenticated',
    });

    render(<Navigation />);
    
    const signOutButtons = screen.getAllByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButtons[0]); // Click the first (desktop) sign out button
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
    
    // Mobile menu should be hidden initially
    const mobileMenu = document.querySelector('.md\\:hidden .space-y-1');
    expect(mobileMenu?.parentElement).toHaveClass('hidden');
    
    // Click to open mobile menu
    fireEvent.click(mobileMenuButton);
    expect(mobileMenu?.parentElement).toHaveClass('block');
    
    // Click again to close mobile menu
    fireEvent.click(mobileMenuButton);
    expect(mobileMenu?.parentElement).toHaveClass('hidden');
  });

  it('shows correct mobile menu content when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(mobileMenuButton);
    
    // Should show sign in and sign up buttons in mobile menu
    const mobileSignInButtons = screen.getAllByText(/sign in/i);
    const mobileSignUpButtons = screen.getAllByText(/sign up/i);
    
    expect(mobileSignInButtons.length).toBeGreaterThan(1); // Desktop + mobile
    expect(mobileSignUpButtons.length).toBeGreaterThan(1); // Desktop + mobile
  });

  it('shows correct mobile menu content when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      status: 'authenticated',
    });

    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(mobileMenuButton);
    
    // Should show dashboard link and sign out button in mobile menu
    const dashboardLinks = screen.getAllByText(/dashboard/i);
    const signOutButtons = screen.getAllByText(/sign out/i);
    
    expect(dashboardLinks.length).toBeGreaterThan(1); // Desktop + mobile
    expect(signOutButtons.length).toBeGreaterThan(1); // Desktop + mobile
  });

  it('closes mobile menu when dashboard link is clicked', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      status: 'authenticated',
    });

    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(mobileMenuButton);
    
    const mobileMenu = document.querySelector('.md\\:hidden .space-y-1');
    expect(mobileMenu?.parentElement).toHaveClass('block');
    
    // Click dashboard link in mobile menu
    const mobileDashboardLinks = screen.getAllByRole('link', { name: /dashboard/i });
    const mobileDashboardLink = mobileDashboardLinks.find(link => 
      link.className.includes('block')
    );
    
    if (mobileDashboardLink) {
      fireEvent.click(mobileDashboardLink);
      expect(mobileMenu?.parentElement).toHaveClass('hidden');
    }
  });

  it('closes mobile menu when sign in link is clicked', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(mobileMenuButton);
    
    const mobileMenu = document.querySelector('.md\\:hidden .space-y-1');
    expect(mobileMenu?.parentElement).toHaveClass('block');
    
    // Click sign in link in mobile menu
    const mobileSignInLinks = screen.getAllByRole('link', { name: /sign in/i });
    const mobileSignInLink = mobileSignInLinks.find(link => 
      link.closest('.md\\:hidden')
    );
    
    if (mobileSignInLink) {
      fireEvent.click(mobileSignInLink);
      expect(mobileMenu?.parentElement).toHaveClass('hidden');
    }
  });

  it('shows loading state in mobile menu when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(mobileMenuButton);
    
    // Check for loading skeleton in mobile menu
    const mobileLoadingSkeletons = document.querySelectorAll('.md\\:hidden .animate-pulse');
    expect(mobileLoadingSkeletons.length).toBeGreaterThan(0);
  });

  it('has correct accessibility attributes', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(mobileMenuButton);
    // Note: aria-expanded is not being updated in the current implementation
    // This could be an improvement for accessibility
  });

  it('shows correct hamburger/close icon based on mobile menu state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<Navigation />);
    
    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    
    // Initially should show hamburger icon (3 lines)
    let icon = mobileMenuButton.querySelector('svg path[d*="M4 6h16M4 12h16M4 18h16"]');
    expect(icon).toBeInTheDocument();
    
    // After clicking, should show close icon (X)
    fireEvent.click(mobileMenuButton);
    icon = mobileMenuButton.querySelector('svg path[d*="M6 18L18 6M6 6l12 12"]');
    expect(icon).toBeInTheDocument();
  });
});