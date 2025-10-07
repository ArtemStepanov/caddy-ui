export type ThemeMode = 'light' | 'dark' | 'auto';
export type DateFormat = 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
export type TimeFormat = '24h' | '12h';
export type DefaultView = 'dashboard' | 'instances' | 'last-visited';
export type PollingStrategy = 'websocket' | 'http-polling';
export type CacheStrategy = 'aggressive' | 'balanced' | 'minimal';
export type ConfigFormat = 'json' | 'caddyfile';
export type ExportFormat = 'json' | 'yaml';
export type UpdateChannel = 'stable' | 'beta';

export interface AppearanceSettings {
  theme: ThemeMode;
  useSystemTheme: boolean;
  language: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  showRelativeTimestamps: boolean;
}

export interface DashboardPreferences {
  defaultView: DefaultView;
  refreshInterval: number;
}

export interface OrchestratorSettings {
  backendUrl: string;
  apiTimeout: number;
  pollingStrategy: PollingStrategy;
  pollInterval: number;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  restoreUnsavedChanges: boolean;
}

export interface InstancesSettings {
  defaultTimeout: number;
  defaultAuthType: string;
  enableHealthChecks: boolean;
  healthCheckInterval: number;
  unhealthyThreshold: number;
  showBulkConfirmation: boolean;
  requireDoubleConfirmation: boolean;
}

export interface EditorSettings {
  fontFamily: string;
  fontSize: number;
  enableFontLigatures: boolean;
  enableAutoCompletion: boolean;
  enableCodeFolding: boolean;
  showMinimap: boolean;
  enableBracketMatching: boolean;
  wordWrap: boolean;
  tabSize: number;
  useSpaces: boolean;
  enableLiveValidation: boolean;
  validationDebounce: number;
  autoFormatOnSave: boolean;
  defaultFormat: ConfigFormat;
  showSideBySideDiff: boolean;
  highlightSyntaxInDiffs: boolean;
}

export interface NotificationSettings {
  enableBrowserNotifications: boolean;
  notifyInstanceStatusChanges: boolean;
  notifyConfigChanges: boolean;
  notifyUpstreamFailures: boolean;
  notifyConnectionLost: boolean;
  notifyNewVersion: boolean;
  toastDuration: number;
  playSound: boolean;
  soundVolume: number;
  enableEmailAlerts: boolean;
  emailAddress: string;
  emailVerified: boolean;
}

export interface SecuritySettings {
  enableAuditLogging: boolean;
  logRetentionDays: number;
  sessionTimeout: number;
}

export interface AdvancedSettings {
  enableDeveloperMode: boolean;
  enableRequestLogging: boolean;
  maxConcurrentRequests: number;
  enableAutoRetry: boolean;
  maxRetryAttempts: number;
  cacheStrategy: CacheStrategy;
  featureFlags: Record<string, boolean>;
}

export interface AboutInfo {
  version: string;
  buildDate: string;
  commitHash: string;
  backendVersion: string;
  autoCheckUpdates: boolean;
  updateChannel: UpdateChannel;
}

export interface Settings {
  appearance: AppearanceSettings;
  dashboard: DashboardPreferences;
  orchestrator: OrchestratorSettings;
  instances: InstancesSettings;
  editor: EditorSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  advanced: AdvancedSettings;
}

export type SettingsSection = 
  | 'general' 
  | 'orchestrator' 
  | 'instances' 
  | 'editor' 
  | 'notifications' 
  | 'security' 
  | 'advanced' 
  | 'about';

export interface SettingsSectionInfo {
  id: SettingsSection;
  label: string;
  icon: string;
  description: string;
}

