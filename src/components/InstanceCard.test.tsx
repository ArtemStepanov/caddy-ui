import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { InstanceCard } from './InstanceCard';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('InstanceCard', () => {
  const defaultProps = {
    name: 'Test Instance',
    url: 'http://localhost:2019',
    status: 'online' as const,
    version: '2.7.6',
    upstreams: 5,
  };

  it('should render instance information', () => {
    render(<InstanceCard {...defaultProps} />);

    expect(screen.getByText('Test Instance')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:2019')).toBeInTheDocument();
    expect(screen.getByText('2.7.6')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render online status', () => {
    render(<InstanceCard {...defaultProps} status="online" />);

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should render offline status', () => {
    render(<InstanceCard {...defaultProps} status="offline" />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should render error status', () => {
    render(<InstanceCard {...defaultProps} status="error" />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should navigate to config on manage click', async () => {
    const user = userEvent.setup();
    render(<InstanceCard {...defaultProps} />);

    const manageButton = screen.getByRole('button', { name: /manage/i });
    await user.click(manageButton);

    expect(mockNavigate).toHaveBeenCalledWith('/config');
  });

  it('should open settings dialog', async () => {
    const user = userEvent.setup();
    render(<InstanceCard {...defaultProps} />);

    const settingsButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')
    );
    
    if (settingsButton) {
      await user.click(settingsButton);
      expect(screen.getByText('Instance Settings')).toBeInTheDocument();
    }
  });

  it('should use default version if not provided', () => {
    const props = { ...defaultProps };
    delete (props as Partial<typeof props>).version;
    
    render(<InstanceCard {...props} />);

    expect(screen.getByText('2.7.6')).toBeInTheDocument();
  });

  it('should use default upstreams count if not provided', () => {
    const props = { ...defaultProps };
    delete (props as Partial<typeof props>).upstreams;
    
    render(<InstanceCard {...props} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
