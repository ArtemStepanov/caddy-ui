import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock the settings API
vi.mock('@/lib/api-client', () => ({
  getSettings: vi.fn().mockResolvedValue({
    appearance: { theme: 'system' },
    display: {
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      defaultView: 'dashboard',
      itemsPerPage: 25,
    },
    notifications: {
      enabled: true,
      instanceDown: true,
      certificateExpiry: true,
      configChanges: true,
    },
    autoRefresh: {
      enabled: false,
      interval: 30,
    },
  }),
  updateSettings: vi.fn().mockResolvedValue({}),
}));

describe('App', () => {
  it('should render without crashing', async () => {
    const { container } = render(<App />);
    
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    });
  });

  it('should render main layout elements', async () => {
    render(<App />);
    
    await waitFor(() => {
      const main = screen.queryByRole('main');
      expect(main).toBeInTheDocument();
    });
  });
});
