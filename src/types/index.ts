/**
 * Centralized type exports
 * Import types from here in all components
 */

// API types
export type {
  APIResponse,
  APIError,
  CaddyInstance,
  HealthCheckResult,
  ConfigTemplate,
  TemplateVariable,
} from './api';

// Instance-specific types
export type {
  InstanceStatus,
  AuthType,
  ViewMode,
  FilterStatus,
  SortField,
  SortOrder,
  TestStatus,
  InstanceGridCardProps,
  InstanceTableViewProps,
  EmptyStateProps,
  AddInstanceDialogProps,
  EditInstanceDialogProps,
  DeleteInstanceDialogProps,
  TestConnectionDialogProps,
  InstanceFormData,
  InstanceFormErrors,
  StatusConfig,
  InstanceStats,
} from './instances';
