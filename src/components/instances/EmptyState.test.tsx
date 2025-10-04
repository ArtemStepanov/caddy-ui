import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EmptyState } from './EmptyState';
import userEvent from '@testing-library/user-event';

describe('EmptyState', () => {
  it('should render empty state message', () => {
    const mockOnAdd = vi.fn();
    render(<EmptyState onAddInstance={mockOnAdd} />);

    expect(screen.getByText('No Caddy instances yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Get started by adding your first Caddy instance/)
    ).toBeInTheDocument();
  });

  it('should call onAddInstance when button clicked', async () => {
    const user = userEvent.setup();
    const mockOnAdd = vi.fn();
    render(<EmptyState onAddInstance={mockOnAdd} />);

    const addButton = screen.getByRole('button', { name: /add your first instance/i });
    await user.click(addButton);

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it('should render quick start guide button', () => {
    const mockOnAdd = vi.fn();
    render(<EmptyState onAddInstance={mockOnAdd} />);

    const guideButton = screen.getByRole('button', { name: /quick start guide/i });
    expect(guideButton).toBeInTheDocument();
  });

  it('should render helpful tips', () => {
    const mockOnAdd = vi.fn();
    render(<EmptyState onAddInstance={mockOnAdd} />);

    expect(screen.getByText('💡 Getting Started Tips')).toBeInTheDocument();
    expect(screen.getByText(/Default Admin API runs on/i)).toBeInTheDocument();
    expect(screen.getByText(/Use mTLS or Bearer tokens/i)).toBeInTheDocument();
  });
});
