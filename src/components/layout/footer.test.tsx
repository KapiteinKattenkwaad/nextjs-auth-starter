/**
 * Unit tests for Footer component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { Footer } from './footer';

// Mock Date to have consistent year in tests
const mockDate = new Date('2024-01-01');
vi.setSystemTime(mockDate);

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand section with title and description', () => {
    render(<Footer />);
    
    expect(screen.getByRole('heading', { name: /next\.js auth starter/i })).toBeInTheDocument();
    expect(screen.getByText(/a complete authentication solution/i)).toBeInTheDocument();
  });

  it('renders resources section with correct links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('heading', { name: /resources/i })).toBeInTheDocument();
    
    const docLink = screen.getByRole('link', { name: /documentation/i });
    expect(docLink).toHaveAttribute('href', '/docs');
    
    const examplesLink = screen.getByRole('link', { name: /examples/i });
    expect(examplesLink).toHaveAttribute('href', '/examples');
    
    const githubLinks = screen.getAllByRole('link', { name: /github/i });
    const resourcesGithubLink = githubLinks[0]; // First GitHub link is in resources section
    expect(resourcesGithubLink).toHaveAttribute('href', 'https://github.com');
    expect(resourcesGithubLink).toHaveAttribute('target', '_blank');
    expect(resourcesGithubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders support section with correct links', () => {
    render(<Footer />);
    
    expect(screen.getByRole('heading', { name: /support/i })).toBeInTheDocument();
    
    const helpLink = screen.getByRole('link', { name: /help center/i });
    expect(helpLink).toHaveAttribute('href', '/help');
    
    const contactLink = screen.getByRole('link', { name: /contact us/i });
    expect(contactLink).toHaveAttribute('href', '/contact');
    
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  it('displays current year in copyright notice', () => {
    render(<Footer />);
    
    expect(screen.getByText(/© 2024 next\.js auth starter\. all rights reserved\./i)).toBeInTheDocument();
  });

  it('renders social media links with correct attributes', () => {
    render(<Footer />);
    
    const twitterLink = screen.getByRole('link', { name: /twitter/i });
    expect(twitterLink).toHaveAttribute('href', 'https://twitter.com');
    expect(twitterLink).toHaveAttribute('target', '_blank');
    expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    
    const githubSocialLink = screen.getAllByRole('link', { name: /github/i })[1]; // Second GitHub link (social)
    expect(githubSocialLink).toHaveAttribute('href', 'https://github.com');
    expect(githubSocialLink).toHaveAttribute('target', '_blank');
    expect(githubSocialLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has correct responsive grid layout classes', () => {
    render(<Footer />);
    
    const gridContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
    expect(gridContainer).toBeInTheDocument();
  });

  it('has correct styling classes for sections', () => {
    render(<Footer />);
    
    // Check brand section
    const brandSection = screen.getByRole('heading', { name: /next\.js auth starter/i }).closest('.space-y-4');
    expect(brandSection).toBeInTheDocument();
    
    // Check resources section
    const resourcesSection = screen.getByRole('heading', { name: /resources/i }).closest('.space-y-4');
    expect(resourcesSection).toBeInTheDocument();
    
    // Check support section
    const supportSection = screen.getByRole('heading', { name: /support/i }).closest('.space-y-4');
    expect(supportSection).toBeInTheDocument();
  });

  it('has correct hover effects on links', () => {
    render(<Footer />);
    
    const docLink = screen.getByRole('link', { name: /documentation/i });
    expect(docLink).toHaveClass('hover:text-gray-900', 'transition-colors');
    
    const twitterLink = screen.getByRole('link', { name: /twitter/i });
    expect(twitterLink).toHaveClass('hover:text-gray-500', 'transition-colors');
  });

  it('has proper semantic structure', () => {
    render(<Footer />);
    
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('bg-white', 'border-t', 'border-gray-200');
    
    // Check for proper heading hierarchy
    const h3 = screen.getByRole('heading', { level: 3, name: /next\.js auth starter/i });
    expect(h3).toBeInTheDocument();
    
    const h4Elements = screen.getAllByRole('heading', { level: 4 });
    expect(h4Elements).toHaveLength(2); // Resources and Support
  });

  it('has screen reader text for social icons', () => {
    render(<Footer />);
    
    expect(screen.getByText('Twitter')).toHaveClass('sr-only');
    expect(screen.getAllByText('GitHub')[1]).toHaveClass('sr-only'); // Social GitHub link
  });

  it('renders SVG icons for social media', () => {
    render(<Footer />);
    
    const twitterIcon = screen.getByRole('link', { name: /twitter/i }).querySelector('svg');
    expect(twitterIcon).toBeInTheDocument();
    expect(twitterIcon).toHaveClass('h-5', 'w-5');
    
    const githubIcon = screen.getAllByRole('link', { name: /github/i })[1].querySelector('svg');
    expect(githubIcon).toBeInTheDocument();
    expect(githubIcon).toHaveClass('h-5', 'w-5');
  });

  it('has correct container max width and padding', () => {
    render(<Footer />);
    
    const container = document.querySelector('.max-w-7xl.mx-auto.py-8');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
  });

  it('has correct bottom section layout', () => {
    render(<Footer />);
    
    const bottomSection = document.querySelector('.mt-8.pt-8.border-t');
    expect(bottomSection).toBeInTheDocument();
    
    const flexContainer = bottomSection?.querySelector('.flex.flex-col.md\\:flex-row.justify-between');
    expect(flexContainer).toBeInTheDocument();
  });

  it('updates year dynamically', () => {
    // Test with different year
    const newMockDate = new Date('2025-06-15');
    vi.setSystemTime(newMockDate);
    
    render(<Footer />);
    
    expect(screen.getByText(/© 2025 next\.js auth starter\. all rights reserved\./i)).toBeInTheDocument();
  });
});