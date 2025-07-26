import { describe, it, expect } from 'vitest';
import { render, screen } from './utils';

// Simple test component
const TestComponent = ({ message }: { message: string }) => {
  return <div data-testid="test-message">{message}</div>;
};

describe('React Testing Library Setup', () => {
  it('should render React components', () => {
    render(<TestComponent message="Hello, Testing!" />);
    
    expect(screen.getByTestId('test-message')).toBeInTheDocument();
    expect(screen.getByText('Hello, Testing!')).toBeInTheDocument();
  });

  it('should have access to jest-dom matchers', () => {
    render(<TestComponent message="Test" />);
    
    const element = screen.getByTestId('test-message');
    expect(element).toBeVisible();
    expect(element).toHaveTextContent('Test');
  });
});