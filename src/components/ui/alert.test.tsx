import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { Alert } from './alert';

describe('Alert', () => {
  it('renders with default variant', () => {
    render(<Alert>Default alert message</Alert>);
    
    const alert = screen.getByText('Default alert message');
    expect(alert.parentElement?.parentElement).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });

  it('renders with success variant', () => {
    render(<Alert variant="success">Success message</Alert>);
    
    const alert = screen.getByText('Success message');
    expect(alert.parentElement?.parentElement).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('renders with warning variant', () => {
    render(<Alert variant="warning">Warning message</Alert>);
    
    const alert = screen.getByText('Warning message');
    expect(alert.parentElement?.parentElement).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('renders with error variant', () => {
    render(<Alert variant="error">Error message</Alert>);
    
    const alert = screen.getByText('Error message');
    expect(alert.parentElement?.parentElement).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('renders with title', () => {
    render(<Alert title="Alert Title">Alert content</Alert>);
    
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert content')).toBeInTheDocument();
    
    const title = screen.getByText('Alert Title');
    expect(title).toHaveClass('text-sm', 'font-medium', 'mb-1');
  });

  it('renders without title', () => {
    render(<Alert>Alert content without title</Alert>);
    
    expect(screen.getByText('Alert content without title')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('displays correct icon for default variant', () => {
    render(<Alert>Default alert</Alert>);
    
    const iconContainer = screen.getByText('Default alert').parentElement?.previousElementSibling;
    const icon = iconContainer?.querySelector('svg');
    
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-4', 'w-4');
  });

  it('displays correct icon for success variant', () => {
    render(<Alert variant="success">Success alert</Alert>);
    
    const iconContainer = screen.getByText('Success alert').parentElement?.previousElementSibling;
    const icon = iconContainer?.querySelector('svg');
    
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-4', 'w-4');
  });

  it('displays correct icon for warning variant', () => {
    render(<Alert variant="warning">Warning alert</Alert>);
    
    const iconContainer = screen.getByText('Warning alert').parentElement?.previousElementSibling;
    const icon = iconContainer?.querySelector('svg');
    
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-4', 'w-4');
  });

  it('displays correct icon for error variant', () => {
    render(<Alert variant="error">Error alert</Alert>);
    
    const iconContainer = screen.getByText('Error alert').parentElement?.previousElementSibling;
    const icon = iconContainer?.querySelector('svg');
    
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('h-4', 'w-4');
  });

  it('accepts custom className', () => {
    render(<Alert className="custom-class">Custom alert</Alert>);
    
    const alertContainer = screen.getByText('Custom alert').closest('div');
    expect(alertContainer).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Alert ref={ref}>Ref alert</Alert>);
    
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('passes through additional HTML div props', () => {
    render(
      <Alert data-testid="test-alert" role="alert">
        Test alert
      </Alert>
    );
    
    const alert = screen.getByTestId('test-alert');
    expect(alert).toHaveAttribute('role', 'alert');
  });

  it('has correct base styling', () => {
    render(<Alert>Base styling test</Alert>);
    
    const alertContainer = screen.getByText('Base styling test').closest('div');
    expect(alertContainer).toHaveClass(
      'relative',
      'w-full',
      'rounded-lg',
      'border',
      'p-4'
    );
  });

  it('has correct layout structure', () => {
    render(<Alert title="Test Title">Test content</Alert>);
    
    const alertContainer = screen.getByText('Test content').closest('div[class*="relative"]');
    const flexContainer = alertContainer?.querySelector('.flex');
    const iconContainer = flexContainer?.querySelector('.flex-shrink-0');
    const contentContainer = flexContainer?.querySelector('.ml-3');
    
    expect(flexContainer).toBeInTheDocument();
    expect(iconContainer).toBeInTheDocument();
    expect(contentContainer).toBeInTheDocument();
  });

  it('renders complex content correctly', () => {
    render(
      <Alert title="Complex Alert">
        <div>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      </Alert>
    );
    
    expect(screen.getByText('Complex Alert')).toBeInTheDocument();
    expect(screen.getByText('First paragraph')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph')).toBeInTheDocument();
  });

  it('maintains proper spacing with title and content', () => {
    render(<Alert title="Spaced Title">Spaced content</Alert>);
    
    const title = screen.getByText('Spaced Title');
    const content = screen.getByText('Spaced content');
    
    expect(title).toHaveClass('mb-1');
    expect(content.parentElement).toHaveClass('text-sm');
  });

  it('works without title but with content', () => {
    render(<Alert>Just content, no title</Alert>);
    
    const content = screen.getByText('Just content, no title');
    expect(content.parentElement).toHaveClass('text-sm');
    expect(screen.queryByText(/title/i)).not.toBeInTheDocument();
  });
});