import { render, screen } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders loading state correctly', () => {
    render(<StatusBadge status="loading" />);
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  it('renders online state correctly', () => {
    render(<StatusBadge status="online" />);
    expect(screen.getByText('Caddy Online')).toBeInTheDocument();
  });

  it('renders offline state correctly', () => {
    render(<StatusBadge status="offline" />);
    expect(screen.getByText('Caddy Offline')).toBeInTheDocument();
  });

  it('shows latency when online and provided', () => {
    render(<StatusBadge status="online" latency={45} />);
    expect(screen.getByText('45ms')).toBeInTheDocument();
  });

  it('does not show latency when offline', () => {
    render(<StatusBadge status="offline" latency={45} />);
    expect(screen.queryByText('45ms')).not.toBeInTheDocument();
  });
});
