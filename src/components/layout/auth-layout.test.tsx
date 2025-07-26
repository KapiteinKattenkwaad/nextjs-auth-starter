/**
 * Unit tests for AuthLayout component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { AuthLayout } from './auth-layout';

// Mock the Container component
vi.mock('./container', () => ({
  Container: ({ children, size, padding }: { children: React.ReactNode; size: string; padding: string }) => (
    <div data-testid="container" data-size={size} data-padding={padding}>
      {children}
    </div>
  ),
}));

describe('AuthLayout', () => {
  it('renders title correctly', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <AuthLayout title="Sign In" subtitle="Welcome back to your account">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    expect(screen.getByText(/welcome back to your account/i)).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    // Should not have any subtitle text
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
  });

  it('renders brand logo with link to home', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    const brandLink = screen.getByRole('link', { name: /auth starter/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('renders children content', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    expect(screen.getByText('Form Content')).toBeInTheDocument();
  });

  it('renders back to home link by default', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    const backLink = screen.getByRole('link', { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('hides back to home link when showBackToHome is false', () => {
    render(
      <AuthLayout title="Sign In" showBackToHome={false}>
        <div>Form Content</div>
      </AuthLayout>
    );
    
    expect(screen.queryByRole('link', { name: /back to home/i })).not.toBeInTheDocument();
  });

  it('shows back to home link when showBackToHome is explicitly true', () => {
    render(
      <AuthLayout title="Sign In" showBackToHome={true}>
        <div>Form Content</div>
      </AuthLayout>
    );
    
    const backLink = screen.getByRole('link', { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
  });

  it('uses Container component with correct props', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    const container = screen.getByTestId('container');
    expect(container).toHaveAttribute('data-size', 'sm');
    expect(container).toHaveAttribute('data-padding', 'md');
  });

  it('has correct layout structure and styling', () => {
    const { container } = render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    const layoutContainer = container.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass(
      'min-h-screen',
      'flex',
      'flex-col',
      'justify-center',
      'bg-gray-50',
      'py-12',
      'sm:px-6',
      'lg:px-8'
    );
  });

  it('has correct content card styling', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    const contentCard = screen.getByText('Form Content').closest('.bg-white');
    expect(contentCard).toHaveClass(
      'bg-white',
      'py-8',
      'px-4',
      'shadow-sm',
      'rounded-lg',
      'sm:px-10',
      'border',
      'border-gray-200'
    );
  });

  it('renders complex children correctly', () => {
    render(
      <AuthLayout title="Sign In">
        <form>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button type="submit">Submit</button>
        </form>
      </AuthLayout>
    );
    
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('has correct responsive classes', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    // Check for responsive max-width classes
    const titleSection = screen.getByRole('heading', { name: /auth starter/i }).closest('.sm\\:mx-auto');
    expect(titleSection).toHaveClass('sm:mx-auto', 'sm:w-full', 'sm:max-w-md');
    
    const contentSection = screen.getByText('Form Content').closest('.sm\\:mx-auto');
    expect(contentSection).toHaveClass('sm:mx-auto', 'sm:w-full', 'sm:max-w-md');
  });

  it('has correct text alignment and spacing', () => {
    render(
      <AuthLayout title="Sign In" subtitle="Welcome back">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    // Brand section should be centered
    const brandSection = screen.getByRole('heading', { name: /auth starter/i }).closest('.text-center');
    expect(brandSection).toBeInTheDocument();
    
    // Title section should be centered
    const titleSection = screen.getByRole('heading', { name: /sign in/i }).closest('.text-center');
    expect(titleSection).toBeInTheDocument();
    
    // Subtitle should have correct spacing
    const subtitle = screen.getByText('Welcome back');
    expect(subtitle).toHaveClass('mt-2', 'text-sm', 'text-gray-600');
  });

  it('has correct heading hierarchy', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    // Brand should be h2
    const brand = screen.getByRole('heading', { name: /auth starter/i });
    expect(brand.tagName.toLowerCase()).toBe('h2');
    
    // Title should be h1
    const title = screen.getByRole('heading', { name: /sign in/i });
    expect(title.tagName.toLowerCase()).toBe('h1');
  });

  it('handles empty children', () => {
    render(
      <AuthLayout title="Sign In">
        {null}
      </AuthLayout>
    );
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    
    const contentCard = document.querySelector('.bg-white.py-8');
    expect(contentCard).toBeInTheDocument();
    expect(contentCard).toBeEmptyDOMElement();
  });

  it('back to home link has correct styling', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    const backLink = screen.getByRole('link', { name: /back to home/i });
    expect(backLink).toHaveClass(
      'text-sm',
      'text-blue-600',
      'hover:text-blue-500',
      'transition-colors'
    );
  });

  it('back to home link container has correct styling', () => {
    render(
      <AuthLayout title="Sign In">
        <div>Form Content</div>
      </AuthLayout>
    );
    
    const backLinkContainer = screen.getByRole('link', { name: /back to home/i }).closest('.mt-6');
    expect(backLinkContainer).toHaveClass('mt-6', 'text-center');
  });
});