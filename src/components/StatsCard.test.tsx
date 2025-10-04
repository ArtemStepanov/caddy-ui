import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { StatsCard } from './StatsCard';
import { Server } from 'lucide-react';

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(<StatsCard title="Total Instances" value={5} icon={Server} />);

    expect(screen.getByText('Total Instances')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(
      <StatsCard title="Test" value={10} icon={Server} />
    );

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render positive trend', () => {
    render(
      <StatsCard
        title="Test"
        value={10}
        icon={Server}
        trend={{ value: 15, positive: true }}
      />
    );

    const trendText = screen.getByText(/↑ 15%/);
    expect(trendText).toBeInTheDocument();
    expect(trendText).toHaveClass('text-success');
  });

  it('should render negative trend', () => {
    render(
      <StatsCard
        title="Test"
        value={10}
        icon={Server}
        trend={{ value: -10, positive: false }}
      />
    );

    const trendText = screen.getByText(/↓ 10%/);
    expect(trendText).toBeInTheDocument();
    expect(trendText).toHaveClass('text-destructive');
  });

  it('should render without trend', () => {
    const { container } = render(
      <StatsCard title="Test" value={10} icon={Server} />
    );

    const trendElement = container.querySelector('.text-success, .text-destructive');
    expect(trendElement).not.toBeInTheDocument();
  });
});
