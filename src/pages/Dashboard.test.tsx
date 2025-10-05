import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import Dashboard from './Dashboard';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  it('should render dashboard header', () => {
    render(<Dashboard />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Monitor and manage your Caddy instances/)).toBeInTheDocument();
  });

  it('should render stats cards', () => {
    render(<Dashboard />);

    expect(screen.getByText('Total Instances')).toBeInTheDocument();
    expect(screen.getByText('Active Upstreams')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.getByText('Requests/min')).toBeInTheDocument();
  });

  it('should render instance cards', () => {
    render(<Dashboard />);

    expect(screen.getByText('Production')).toBeInTheDocument();
    expect(screen.getByText('Staging')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();
  });

  it('should render add instance button', () => {
    render(<Dashboard />);

    const addButton = screen.getByRole('button', { name: /add instance/i });
    expect(addButton).toBeInTheDocument();
  });

  it('should open add instance dialog', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const addButton = screen.getByRole('button', { name: /add instance/i });
    await user.click(addButton);

    expect(screen.getByText('Add New Instance')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Production Server')).toBeInTheDocument();
  });

  it('should render quick actions', () => {
    render(<Dashboard />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('View Configurations')).toBeInTheDocument();
    expect(screen.getByText('Monitor Upstreams')).toBeInTheDocument();
    expect(screen.getByText('Manage Certificates')).toBeInTheDocument();
  });

  it('should navigate to config page', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const configButton = screen.getByText('View Configurations').closest('button');
    if (configButton) {
      await user.click(configButton);
      expect(mockNavigate).toHaveBeenCalledWith('/config');
    }
  });

  it('should navigate to upstreams page', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const upstreamsButton = screen.getByText('Monitor Upstreams').closest('button');
    if (upstreamsButton) {
      await user.click(upstreamsButton);
      expect(mockNavigate).toHaveBeenCalledWith('/upstreams');
    }
  });

  it('should navigate to certificates page', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const certsButton = screen.getByText('Manage Certificates').closest('button');
    if (certsButton) {
      await user.click(certsButton);
      expect(mockNavigate).toHaveBeenCalledWith('/certificates');
    }
  });
});
