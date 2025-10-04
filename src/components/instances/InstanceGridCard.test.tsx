import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { InstanceGridCard } from './InstanceGridCard';
import userEvent from '@testing-library/user-event';
import type { CaddyInstance } from '@/types';

describe('InstanceGridCard', () => {
  const mockInstance: CaddyInstance = {
    id: '1',
    name: 'Test Instance',
    admin_url: 'http://localhost:2019',
    status: 'online',
    auth_type: 'none',
    last_seen: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTest: vi.fn(),
  };

  it('should render instance information', () => {
    render(<InstanceGridCard instance={mockInstance} {...mockHandlers} />);

    expect(screen.getByText('Test Instance')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:2019')).toBeInTheDocument();
    expect(screen.getByText('none')).toBeInTheDocument();
  });

  it('should display healthy status for online instance', () => {
    render(<InstanceGridCard instance={mockInstance} {...mockHandlers} />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('should display last seen time', () => {
    render(<InstanceGridCard instance={mockInstance} {...mockHandlers} />);

    expect(screen.getByText(/Last seen:/)).toBeInTheDocument();
  });

  it('should call onTest when test button clicked', async () => {
    const user = userEvent.setup();
    render(<InstanceGridCard instance={mockInstance} {...mockHandlers} />);

    const testButtons = screen.getAllByRole('button', { name: /test/i });
    await user.click(testButtons[0]);

    expect(mockHandlers.onTest).toHaveBeenCalledWith(mockInstance);
  });

  it('should call onEdit when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<InstanceGridCard instance={mockInstance} {...mockHandlers} />);

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockInstance);
  });

  it('should show dropdown menu with actions', async () => {
    const user = userEvent.setup();
    render(<InstanceGridCard instance={mockInstance} {...mockHandlers} />);

    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);

    expect(screen.getByText('Health Check')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should handle offline status', () => {
    const offlineInstance = { ...mockInstance, status: 'offline' };
    render(<InstanceGridCard instance={offlineInstance} {...mockHandlers} />);

    expect(screen.getByText('Unreachable')).toBeInTheDocument();
  });

  it('should handle error status', () => {
    const errorInstance = { ...mockInstance, status: 'error' };
    render(<InstanceGridCard instance={errorInstance} {...mockHandlers} />);

    expect(screen.getByText('Unhealthy')).toBeInTheDocument();
  });
});
