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
  UpstreamStatus,
  Upstream,
  UpstreamPool,
  UpstreamsData,
  UpstreamHealthCheckResult,
  UpstreamMetrics,
  HealthCheckHistory,
  ActiveHealthCheck,
  PassiveHealthCheck,
  HealthChecks,
} from './api';

// Caddy-specific types
export type {
  CaddyConfig,
  CaddyHttpApp,
  CaddyServer,
  CaddyRoute,
  CaddyMatcher,
  CaddyHandler,
  CaddyReverseProxyHandler,
  CaddyUpstreamConfig,
  CaddyLoadBalancing,
  CaddyHealthChecks,
  CaddyActiveHealthCheck,
  CaddyPassiveHealthCheck,
  CaddyHeaderOps,
  CaddyTLSConfig,
  CaddyUpstreamStatus,
  ParsedUpstream,
  ParsedUpstreamPool,
  CaddyConfigValue,
  CaddyConfigResponse,
} from './caddy';

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

// Configuration-specific types
export type {
  ValidationError,
  ConfigEditorProps,
  ConfigConflictDialogProps,
  ConfigDiffViewerProps,
  ImportConfigDialogProps,
  ExportConfigMenuProps,
  ValidationErrorPanelProps,
  UnsavedChangesDialogProps,
} from './config';

// Upstreams component types
export type {
  UpstreamDetailsDrawerProps,
  UpstreamCardProps,
  HealthCheckModalProps,
  TestResult,
  UpstreamsEmptyStateProps,
  PoolSectionProps,
} from './upstreams';

// Shared component types
export type {
  StatsCardProps,
  InstanceCardProps,
  InstanceSelectorProps,
} from './components';

// Hook types
export type {
  ToasterToast,
  ToastState,
  ToastActionType,
  ToastAction,
  ToastActionElement,
} from './hooks';
export { toastActionTypes } from './hooks';

// Settings types
export type {
  ThemeMode,
  DateFormat,
  TimeFormat,
  DensityMode,
  DefaultView,
  PollingStrategy,
  CacheStrategy,
  ConfigFormat,
  ExportFormat,
  UpdateChannel,
  AppearanceSettings,
  DashboardPreferences,
  OrchestratorSettings,
  InstancesSettings,
  EditorSettings,
  NotificationSettings,
  SecuritySettings,
  AdvancedSettings,
  AboutInfo,
  Settings,
  SettingsSection,
  SettingsSectionInfo,
} from './settings';
