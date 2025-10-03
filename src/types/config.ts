/**
 * Configuration-related type definitions
 * Types for configuration editor components and hooks
 */

import type * as Monaco from 'monaco-editor';

/**
 * Validation error structure
 */
export interface ValidationError {
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Configuration Editor props
 */
export interface ConfigEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: 'json' | 'caddyfile';
  readOnly?: boolean;
  onValidate?: (markers: Monaco.editor.IMarker[]) => void;
}

/**
 * Configuration Conflict Dialog props
 */
export interface ConfigConflictDialogProps {
  open: boolean;
  onClose: () => void;
  onReload: () => void;
  onOverwrite: () => void;
  onShowDiff: () => void;
}

/**
 * Configuration Diff Viewer props
 */
export interface ConfigDiffViewerProps {
  open: boolean;
  onClose: () => void;
  originalValue: string;
  modifiedValue: string;
  onAcceptServer: () => void;
  onAcceptLocal: () => void;
  title?: string;
  description?: string;
}

/**
 * Import Configuration Dialog props
 */
export interface ImportConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (content: string, validate: boolean) => Promise<void>;
}

/**
 * Export Configuration Menu props
 */
export interface ExportConfigMenuProps {
  jsonConfig: string;
  caddyfileConfig?: string;
  instanceName: string;
}

/**
 * Validation Error Panel props
 */
export interface ValidationErrorPanelProps {
  errors: ValidationError[];
  onGoToError?: (line: number, column: number) => void;
}

/**
 * Unsaved Changes Dialog props
 */
export interface UnsavedChangesDialogProps {
  open: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave?: () => void;
  title?: string;
  description?: string;
}
