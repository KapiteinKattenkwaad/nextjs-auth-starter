/**
 * Unit tests for MainLayout component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { MainLayout } from './main-layout';

// Mock the child components
vi.mock('./navigation', () => ({
  Navigation: () => <nav data-testid="navigation">Navigation Component</nav>,
}));

vi.mock('./footer', () => ({
  Footer: () => <footer data-testid="footer">Footer Component</footer>,
}));

describe('MainLayout', () => {
  it('renders children content', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders navigation by default', () => {
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  it('renders footer by default', () => {
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );
    
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('hides navigation when showNavigation is false', () => {
    render(
      <MainLayout showNavigation={false}>
        <div>Content</div>
      </MainLayout>
    );
    
    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('hides footer when showFooter is false', () => {
    render(
      <MainLayout showFooter={false}>
        <div>Content</div>
      </MainLayout>
    );
    
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('can hide both navigation and footer', () => {
    render(
      <MainLayout showNavigation={false} showFooter={false}>
        <div>Content Only</div>
      </MainLayout>
    );
    
    expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    expect(screen.getByText('Content Only')).toBeInTheDocument();
  });

  it('has correct layout structure and styling', () => {
    const { container } = render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );
    
    const layoutContainer = container.firstChild as HTMLElement;
    expect(layoutContainer).toHaveClass('min-h-screen', 'flex', 'flex-col', 'bg-gray-50');
  });

  it('main element has correct styling', () => {
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );
    
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('flex-1', 'flex', 'flex-col');
  });

  it('renders multiple children correctly', () => {
    render(
      <MainLayout>
        <div>First Child</div>
        <div>Second Child</div>
        <span>Third Child</span>
      </MainLayout>
    );
    
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
    expect(screen.getByText('Third Child')).toBeInTheDocument();
  });

  it('renders complex nested content', () => {
    render(
      <MainLayout>
        <div>
          <header>Page Header</header>
          <section>
            <h1>Main Title</h1>
            <p>Some paragraph content</p>
          </section>
        </div>
      </MainLayout>
    );
    
    expect(screen.getByText('Page Header')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /main title/i })).toBeInTheDocument();
    expect(screen.getByText('Some paragraph content')).toBeInTheDocument();
  });

  it('maintains proper order of elements', () => {
    const { container } = render(
      <MainLayout>
        <div data-testid="content">Content</div>
      </MainLayout>
    );
    
    const layoutContainer = container.firstChild as HTMLElement;
    const children = Array.from(layoutContainer.children);
    
    // Should be: Navigation, Main, Footer
    expect(children[0]).toHaveAttribute('data-testid', 'navigation');
    expect(children[1].tagName.toLowerCase()).toBe('main');
    expect(children[2]).toHaveAttribute('data-testid', 'footer');
  });

  it('maintains proper order when navigation is hidden', () => {
    const { container } = render(
      <MainLayout showNavigation={false}>
        <div data-testid="content">Content</div>
      </MainLayout>
    );
    
    const layoutContainer = container.firstChild as HTMLElement;
    const children = Array.from(layoutContainer.children);
    
    // Should be: Main, Footer
    expect(children).toHaveLength(2);
    expect(children[0].tagName.toLowerCase()).toBe('main');
    expect(children[1]).toHaveAttribute('data-testid', 'footer');
  });

  it('maintains proper order when footer is hidden', () => {
    const { container } = render(
      <MainLayout showFooter={false}>
        <div data-testid="content">Content</div>
      </MainLayout>
    );
    
    const layoutContainer = container.firstChild as HTMLElement;
    const children = Array.from(layoutContainer.children);
    
    // Should be: Navigation, Main
    expect(children).toHaveLength(2);
    expect(children[0]).toHaveAttribute('data-testid', 'navigation');
    expect(children[1].tagName.toLowerCase()).toBe('main');
  });

  it('works with empty children', () => {
    render(<MainLayout>{null}</MainLayout>);
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toBeEmptyDOMElement();
  });

  it('handles boolean props correctly', () => {
    // Test explicit true values
    render(
      <MainLayout showNavigation={true} showFooter={true}>
        <div>Content</div>
      </MainLayout>
    );
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});