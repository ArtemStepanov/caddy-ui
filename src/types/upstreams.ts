/**
 * Type definitions for Upstreams section
 * Component props for upstream monitoring features
 */

import { Upstream, UpstreamPool } from './api';

/**
 * Props for UpstreamDetailsDrawer component
 */
export interface UpstreamDetailsDrawerProps {
  upstream: Upstream | null;
  instanceId: string | null;
  open: boolean;
  onClose: () => void;
  onTestHealth: (upstream: Upstream) => void;
}

/**
 * Props for UpstreamCard component
 */
export interface UpstreamCardProps {
  upstream: Upstream;
  poolName?: string;
  onViewDetails: (upstream: Upstream) => void;
  onTestHealth: (upstream: Upstream) => void;
}

/**
 * Props for HealthCheckModal component
 */
export interface HealthCheckModalProps {
  open: boolean;
  onClose: () => void;
  upstreams: Upstream[];
  onTestComplete?: () => void;
}

/**
 * Test result for health check modal
 */
export interface TestResult {
  address: string;
  status: 'pending' | 'testing' | 'success' | 'failed' | 'slow';
  responseTime?: number;
  error?: string;
}

/**
 * Props for UpstreamsEmptyState component
 */
export interface UpstreamsEmptyStateProps {
  type: 'no-reverse-proxy' | 'all-healthy' | 'no-instance';
  onRefresh?: () => void;
}

/**
 * Props for PoolSection component
 */
export interface PoolSectionProps {
  pool: UpstreamPool;
  onViewDetails: (upstream: Upstream) => void;
  onTestHealth: (upstream?: Upstream) => void;
  defaultOpen?: boolean;
}

