import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import NotFound from './NotFound';

describe('NotFound', () => {
  it('should render 404 message', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
  });

  it('should render return home link', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: /return to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
