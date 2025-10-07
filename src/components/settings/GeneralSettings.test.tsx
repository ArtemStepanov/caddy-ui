import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneralSettings } from './GeneralSettings';
import type { AppearanceSettings, DashboardPreferences } from '@/types';

describe('GeneralSettings', () => {
  const mockAppearance: AppearanceSettings = {
    theme: 'dark',
    useSystemTheme: false,
    language: 'en',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    showRelativeTimestamps: true,
  };

  const mockDashboard: DashboardPreferences = {
    defaultView: 'dashboard',
    refreshInterval: 30,
  };

  const mockOnAppearanceChange = vi.fn();
  const mockOnDashboardChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <GeneralSettings
        appearance={mockAppearance}
        dashboard={mockDashboard}
        onAppearanceChange={mockOnAppearanceChange}
        onDashboardChange={mockOnDashboardChange}
      />
    );
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  describe('Dashboard Preferences', () => {
    it('should render dashboard preferences section', () => {
      render(
        <GeneralSettings
          appearance={mockAppearance}
          dashboard={mockDashboard}
          onAppearanceChange={mockOnAppearanceChange}
          onDashboardChange={mockOnDashboardChange}
        />
      );
      expect(screen.getByText('Dashboard Preferences')).toBeInTheDocument();
    });

    describe('Default View', () => {
      it('should display default view radio options', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        expect(screen.getByLabelText('Dashboard (overview)')).toBeInTheDocument();
        expect(screen.getByLabelText('Instances (list)')).toBeInTheDocument();
        expect(screen.getByLabelText('Last visited page')).toBeInTheDocument();
      });

      it('should have dashboard selected by default', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        const dashboardRadio = screen.getByRole('radio', { name: /dashboard \(overview\)/i });
        expect(dashboardRadio).toBeChecked();
      });

      it('should call onDashboardChange when default view is changed to instances', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        const instancesRadio = screen.getByRole('radio', { name: /instances \(list\)/i });
        fireEvent.click(instancesRadio);
        expect(mockOnDashboardChange).toHaveBeenCalledWith({ defaultView: 'instances' });
      });

      it('should call onDashboardChange when default view is changed to last-visited', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        const lastVisitedRadio = screen.getByRole('radio', { name: /last visited page/i });
        fireEvent.click(lastVisitedRadio);
        expect(mockOnDashboardChange).toHaveBeenCalledWith({ defaultView: 'last-visited' });
      });

      it('should reflect selected default view from props', () => {
        const dashboardWithInstances: DashboardPreferences = {
          ...mockDashboard,
          defaultView: 'instances',
        };
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={dashboardWithInstances}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        const instancesRadio = screen.getByRole('radio', { name: /instances \(list\)/i });
        expect(instancesRadio).toBeChecked();
      });
    });

    describe('Refresh Interval', () => {
      it('should display refresh interval slider', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        expect(screen.getByText('Refresh Interval')).toBeInTheDocument();
        expect(screen.getByText('30s')).toBeInTheDocument();
      });

      it('should display correct refresh interval value', () => {
        const dashboardWith60s: DashboardPreferences = {
          ...mockDashboard,
          refreshInterval: 60,
        };
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={dashboardWith60s}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        expect(screen.getByText('60s')).toBeInTheDocument();
      });

      it('should display the help text', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        expect(screen.getByText(/how often to refresh data/i)).toBeInTheDocument();
      });

      it('should have a slider with correct min, max, and step values', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        const slider = screen.getByRole('slider');
        expect(slider).toHaveAttribute('aria-valuemin', '10');
        expect(slider).toHaveAttribute('aria-valuemax', '300');
      });

      it('should have the correct initial value on the slider', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        const slider = screen.getByRole('slider');
        
        // Check that the slider has the correct initial value
        expect(slider).toHaveAttribute('aria-valuenow', '30');
      });
    });

    describe('Removed Settings', () => {
      it('should not display "Pause refresh when tab is inactive" option', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        expect(screen.queryByText(/pause refresh when tab is inactive/i)).not.toBeInTheDocument();
      });

      it('should not display "Display Density" option', () => {
        render(
          <GeneralSettings
            appearance={mockAppearance}
            dashboard={mockDashboard}
            onAppearanceChange={mockOnAppearanceChange}
            onDashboardChange={mockOnDashboardChange}
          />
        );
        expect(screen.queryByText(/display density/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/compact/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/comfortable/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/spacious/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Appearance Settings', () => {
    it('should render appearance section', () => {
      render(
        <GeneralSettings
          appearance={mockAppearance}
          dashboard={mockDashboard}
          onAppearanceChange={mockOnAppearanceChange}
          onDashboardChange={mockOnDashboardChange}
        />
      );
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    it('should display theme options', () => {
      render(
        <GeneralSettings
          appearance={mockAppearance}
          dashboard={mockDashboard}
          onAppearanceChange={mockOnAppearanceChange}
          onDashboardChange={mockOnDashboardChange}
        />
      );
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    it('should call onAppearanceChange when theme is changed', () => {
      render(
        <GeneralSettings
          appearance={mockAppearance}
          dashboard={mockDashboard}
          onAppearanceChange={mockOnAppearanceChange}
          onDashboardChange={mockOnDashboardChange}
        />
      );
      const lightRadio = screen.getByRole('radio', { name: /light/i });
      fireEvent.click(lightRadio);
      expect(mockOnAppearanceChange).toHaveBeenCalledWith({ theme: 'light' });
    });
  });
});
