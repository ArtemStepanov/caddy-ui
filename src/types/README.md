# Types Directory

Centralized TypeScript type definitions for the Caddy Orchestrator application.

## Structure

```
types/
├── api.ts          # API-related types (requests, responses, data models)
├── instances.ts    # Instance management types (components, forms, UI)
├── index.ts        # Barrel export (import from here)
└── README.md       # This file
```

## Usage

### Import Types

Always import from the barrel export:

```typescript
// ✅ Good - single import source
import type { CaddyInstance, InstanceStatus, AddInstanceDialogProps } from '@/types';

// ❌ Avoid - importing from specific files
import type { CaddyInstance } from '@/types/api';
```

### Common Patterns

#### Component Props
```typescript
import type { InstanceGridCardProps } from '@/types';

export function InstanceGridCard(props: InstanceGridCardProps) {
  // ...
}
```

#### State Types
```typescript
import type { ViewMode, FilterStatus, SortField } from '@/types';

const [viewMode, setViewMode] = useState<ViewMode>('grid');
const [filter, setFilter] = useState<FilterStatus>('all');
const [sortBy, setSortBy] = useState<SortField>('name');
```

#### Function Parameters & Returns
```typescript
import type { CaddyInstance, InstanceStats } from '@/types';

function calculateStats(instances: CaddyInstance[]): InstanceStats {
  // ...
}
```

## Type Categories

### API Types (`api.ts`)

**Response Wrappers:**
- `APIResponse<T>` - Standard API response
- `APIError` - Error structure

**Data Models:**
- `CaddyInstance` - Caddy server instance
- `HealthCheckResult` - Health check result
- `ConfigTemplate` - Configuration template
- `TemplateVariable` - Template variable

### Instance Types (`instances.ts`)

**Status & Auth:**
- `InstanceStatus` - 'healthy' | 'unhealthy' | 'unreachable' | 'unknown'
- `AuthType` - 'none' | 'bearer' | 'mtls' | 'basic'

**View & Filters:**
- `ViewMode` - 'grid' | 'table'
- `FilterStatus` - 'all' | InstanceStatus
- `SortField` - 'name' | 'status' | 'last_seen'
- `SortOrder` - 'asc' | 'desc'

**Component Props:**
- `InstanceGridCardProps` - Grid card component
- `InstanceTableViewProps` - Table view component
- `EmptyStateProps` - Empty state component
- `AddInstanceDialogProps` - Add dialog component
- `EditInstanceDialogProps` - Edit dialog component
- `DeleteInstanceDialogProps` - Delete dialog component
- `TestConnectionDialogProps` - Test connection dialog

**Form Types:**
- `InstanceFormData` - Form data structure
- `InstanceFormErrors` - Form validation errors

**UI Helpers:**
- `StatusConfig` - Status display configuration
- `InstanceStats` - Statistics summary
- `TestStatus` - Connection test states

## Adding New Types

### 1. Choose the Right File

- **API models, requests, responses** → `api.ts`
- **Component props, UI types** → `instances.ts` (or create new category file)
- **Shared utilities** → Consider creating new category file

### 2. Define the Type

```typescript
// In appropriate file (e.g., instances.ts)

/**
 * JSDoc description of the type
 */
export interface NewFeatureProps {
  id: string;
  name: string;
  onAction: () => void;
}
```

### 3. Export from Index

```typescript
// In index.ts
export type { NewFeatureProps } from './instances';
```

### 4. Use in Components

```typescript
// In component file
import type { NewFeatureProps } from '@/types';

export function NewFeature(props: NewFeatureProps) {
  // Implementation
}
```

## Best Practices

### DO ✅

1. **Use `import type` syntax**
   ```typescript
   import type { CaddyInstance } from '@/types';
   ```

2. **Add JSDoc comments for complex types**
   ```typescript
   /**
    * Configuration for status display
    * Used to render status indicators with appropriate colors and animations
    */
   export interface StatusConfig {
     // ...
   }
   ```

3. **Group related types together**
   ```typescript
   // Form-related types together
   export interface InstanceFormData { /* ... */ }
   export interface InstanceFormErrors { /* ... */ }
   ```

4. **Use descriptive names**
   ```typescript
   // ✅ Good
   export type InstanceStatus = 'healthy' | 'unhealthy';
   
   // ❌ Bad
   export type Status = 'healthy' | 'unhealthy';
   ```

### DON'T ❌

1. **Define types inline in components**
   ```typescript
   // ❌ Avoid
   interface Props {
     instance: CaddyInstance;
   }
   
   // ✅ Better - define in types/instances.ts
   import type { InstanceGridCardProps } from '@/types';
   ```

2. **Duplicate type definitions**
   ```typescript
   // ❌ Don't define same type in multiple files
   // Use centralized type instead
   ```

3. **Use `any` type**
   ```typescript
   // ❌ Avoid
   function process(data: any) { }
   
   // ✅ Better
   function process(data: CaddyInstance) { }
   ```

4. **Import from specific type files**
   ```typescript
   // ❌ Avoid
   import type { CaddyInstance } from '@/types/api';
   
   // ✅ Better
   import type { CaddyInstance } from '@/types';
   ```

## Quick Reference

### Frequently Used Types

```typescript
// Import common types
import type {
  // Data Models
  CaddyInstance,
  HealthCheckResult,
  
  // Status & Filters
  InstanceStatus,
  FilterStatus,
  ViewMode,
  
  // Component Props
  InstanceGridCardProps,
  AddInstanceDialogProps,
  
  // API
  APIResponse,
} from '@/types';
```

### Type Cheat Sheet

| Type | Values | Usage |
|------|--------|-------|
| `InstanceStatus` | `'healthy' \| 'unhealthy' \| 'unreachable' \| 'unknown'` | Status display |
| `AuthType` | `'none' \| 'bearer' \| 'mtls' \| 'basic'` | Authentication |
| `ViewMode` | `'grid' \| 'table'` | View toggle |
| `SortOrder` | `'asc' \| 'desc'` | Sorting |
| `TestStatus` | `'idle' \| 'testing' \| 'success' \| 'failure'` | Connection test |

## Migration from Old Pattern

If you find code with inline types, refactor like this:

**Before:**
```typescript
// Component.tsx
interface ComponentProps {
  instance: CaddyInstance;
  onEdit: () => void;
}

export function Component({ instance, onEdit }: ComponentProps) {
  // ...
}
```

**After:**
```typescript
// types/instances.ts
export interface ComponentProps {
  instance: CaddyInstance;
  onEdit: () => void;
}

// types/index.ts
export type { ComponentProps } from './instances';

// Component.tsx
import type { ComponentProps } from '@/types';

export function Component({ instance, onEdit }: ComponentProps) {
  // ...
}
```

## Need Help?

- Check existing types in `api.ts` and `instances.ts` for examples
- Review the main documentation: `/TYPE_SYSTEM_REFACTORING.md`
- Follow TypeScript best practices
- When in doubt, ask or consult the team

---

**Last Updated**: 2025-10-03  
**Maintainer**: Development Team
