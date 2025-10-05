import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

describe('AppSidebar', () => {
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <SidebarProvider>{component}</SidebarProvider>
      </BrowserRouter>
    );
  };

  it('should render navigation items', () => {
    renderWithProviders(<AppSidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Instances')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Upstreams')).toBeInTheDocument();
    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render app branding', () => {
    renderWithProviders(<AppSidebar />);

    expect(screen.getByText('Caddy UI')).toBeInTheDocument();
  });

  it('should render navigation label', () => {
    renderWithProviders(<AppSidebar />);

    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });
});
