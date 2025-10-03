/**
 * Type definitions for Instances section
 * Centralized types for better maintainability and reusability
 */

import { CaddyInstance, HealthCheckResult } from './api';

/**
 * Instance status types mapped from backend
 */
export type InstanceStatus = 'healthy' | 'unhealthy' | 'unreachable' | 'unknown';

/**
 * Authentication types for Caddy instances
 */
export type AuthType = 'none' | 'bearer' | 'mtls' | 'basic';

/**
 * View modes for instance list
 */
export type ViewMode = 'grid' | 'table';

/**
 * Filter status options
 */
export type FilterStatus = 'all' | InstanceStatus;

/**
 * Sort fields for instances
 */
export type SortField = 'name' | 'status' | 'last_seen';

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Test connection status
 */
export type TestStatus = 'idle' | 'testing' | 'success' | 'failure';

/**
 * Props for InstanceGridCard component
 */
export interface InstanceGridCardProps {
  instance: CaddyInstance;
  onEdit: (instance: CaddyInstance) => void;
  onDelete: (instance: CaddyInstance) => void;
  onTest: (instance: CaddyInstance) => void;
}

/**
 * Props for InstanceTableView component
 */
export interface InstanceTableViewProps {
  instances: CaddyInstance[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (instance: CaddyInstance) => void;
  onDelete: (instance: CaddyInstance) => void;
  onTest: (instance: CaddyInstance) => void;
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (field: string) => void;
}

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  onAddInstance: () => void;
}

/**
 * Props for AddInstanceDialog component
 */
export interface AddInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (instance: Partial<CaddyInstance>) => Promise<CaddyInstance | undefined>;
  existingInstances: CaddyInstance[];
}

/**
 * Props for EditInstanceDialog component
 */
export interface EditInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: CaddyInstance;
  onSubmit: (id: string, instance: Partial<CaddyInstance>) => Promise<CaddyInstance | undefined>;
  existingInstances: CaddyInstance[];
}

/**
 * Props for DeleteInstanceDialog component
 */
export interface DeleteInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: CaddyInstance;
  onConfirm: (id: string) => Promise<void>;
}

/**
 * Props for TestConnectionDialog component
 */
export interface TestConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: CaddyInstance;
  onTest: (id: string) => Promise<HealthCheckResult | null>;
}

/**
 * Form data for Add/Edit Instance dialogs
 */
export interface InstanceFormData {
  name: string;
  description: string;
  admin_url: string;
  auth_type: AuthType;
  bearer_token: string;
  basic_username: string;
  basic_password: string;
  timeout: number;
  skip_tls_verify: boolean;
}

/**
 * Form validation errors
 */
export interface InstanceFormErrors {
  name?: string;
  admin_url?: string;
  bearer_token?: string;
}

/**
 * Status configuration for UI display
 */
export interface StatusConfig {
  label: string;
  color: string;
  dotColor: string;
  pulse: boolean;
}

/**
 * Instance statistics
 */
export interface InstanceStats {
  total: number;
  healthy: number;
  unhealthy: number;
  unreachable: number;
  unknown: number;
}
