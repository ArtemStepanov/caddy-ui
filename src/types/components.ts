/**
 * Type definitions for shared/common components
 * Reusable component props across the application
 */

import { LucideIcon } from 'lucide-react';
import { CaddyInstance } from './api';

/**
 * Props for StatsCard component
 */
export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
}

/**
 * Props for InstanceCard component (legacy dashboard card)
 */
export interface InstanceCardProps {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'error';
  version?: string;
  upstreams?: number;
}

/**
 * Props for InstanceSelector component
 */
export interface InstanceSelectorProps {
  instances: CaddyInstance[];
  selectedInstanceId: string | null;
  onInstanceChange: (instanceId: string) => void;
  loading?: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: Date | null;
  showStatusBadge?: boolean;
  label?: string;
  className?: string;
}

