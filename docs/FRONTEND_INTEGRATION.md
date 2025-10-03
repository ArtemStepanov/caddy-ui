# Frontend Integration Guide

This guide explains how the React frontend integrates with the Go backend API.

## Overview

The frontend has been updated to communicate with the Go backend using a type-safe API client and custom React hooks. The integration provides:

- ✅ Real-time data fetching from backend
- ✅ Type-safe API calls with TypeScript
- ✅ Automatic error handling and user notifications
- ✅ Loading states and optimistic updates
- ✅ Development proxy for seamless local development

## Architecture

```
Frontend (React/TypeScript)
    ↓
API Client (src/lib/api-client.ts)
    ↓
Custom Hooks (src/hooks/)
    ↓
React Components (src/pages/)
    ↓
Backend API (Go/Gin) → Caddy Instances
```

## Key Files Added

### 1. API Client (`src/lib/api-client.ts`)

Type-safe API client that wraps all backend endpoints:

```typescript
import { apiClient } from '@/lib/api-client';

// List all instances
const response = await apiClient.listInstances();

// Create instance
await apiClient.createInstance({
  name: "Production",
  admin_url: "http://localhost:2019",
  auth_type: "none"
});
```

**Features:**
- TypeScript interfaces for all API responses
- Automatic JSON parsing
- Error handling
- Configurable base URL via environment variables

### 2. Custom React Hooks

#### `useInstances` Hook

Manages Caddy instances with automatic data fetching:

```typescript
import { useInstances } from '@/hooks/useInstances';

function MyComponent() {
  const {
    instances,      // Array of instances
    loading,        // Loading state
    error,          // Error message
    createInstance, // Create function
    updateInstance, // Update function
    deleteInstance, // Delete function
    testConnection, // Test connection
  } = useInstances();
}
```

#### `useConfig` Hook

Manages configuration for a specific instance:

```typescript
import { useConfig } from '@/hooks/useConfig';

function ConfigEditor({ instanceId }) {
  const {
    config,
    loading,
    fetchConfig,
    updateConfig,
    patchConfig,
    deleteConfig,
    adaptCaddyfile,
  } = useConfig(instanceId);
}
```

#### `useTemplates` Hook

Manages configuration templates:

```typescript
import { useTemplates } from '@/hooks/useTemplates';

function Templates() {
  const {
    templates,
    loading,
    getTemplate,
    createTemplate,
    generateConfig,
  } = useTemplates();
}
```

### 3. Environment Configuration

#### Development (`.env.development`)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_DEV_MODE=true
```

#### Production (`.env.production`)
```bash
VITE_API_URL=/api
VITE_DEV_MODE=false
```

### 4. Vite Proxy Configuration

Development server automatically proxies API requests to backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## Updated Components

### Instances Page (`src/pages/Instances.tsx`)

**Before:** Static mock data  
**After:** Live data from backend API

**New Features:**
- ✅ Create instances with authentication options
- ✅ Real-time status updates
- ✅ Test connection functionality
- ✅ Delete instances with confirmation
- ✅ Loading states and empty states
- ✅ Toast notifications for all actions

**Usage Example:**

```tsx
const Instances = () => {
  const { instances, loading, createInstance, deleteInstance } = useInstances();
  
  // Create instance
  const handleCreate = async () => {
    await createInstance({
      name: "My Server",
      admin_url: "http://localhost:2019",
      auth_type: "none",
    });
  };
  
  // Delete instance
  const handleDelete = async (id: string) => {
    await deleteInstance(id);
  };
  
  return (
    // UI components...
  );
};
```

## Development Workflow

### 1. Start Backend Server

```bash
# Terminal 1: Start Go backend
cd /workspace
go run cmd/server/main.go

# Backend runs on http://localhost:3000
```

### 2. Start Frontend Dev Server

```bash
# Terminal 2: Start React frontend
npm run dev

# Frontend runs on http://localhost:8080
# API requests automatically proxy to backend
```

### 3. Test Integration

1. Open browser to `http://localhost:8080`
2. Navigate to "Instances" page
3. Click "Add Instance"
4. Fill in form:
   - Name: Local Test
   - Admin URL: http://localhost:2019
   - Auth Type: none
5. Click "Connect Instance"
6. Instance should appear in list with status

### 4. Start Test Caddy Instance (Optional)

```bash
# Terminal 3: Start test Caddy
docker-compose up caddy-test

# Or with Caddy installed:
caddy run --config Caddyfile.test
```

## API Response Handling

All API responses follow this format:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    timestamp: string;
    request_id?: string;
  };
}
```

**Success Example:**
```json
{
  "success": true,
  "data": {
    "id": "abc-123",
    "name": "Production",
    "status": "online",
    ...
  }
}
```

**Error Example:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Instance not found",
    "details": "No instance with ID xyz-789"
  }
}
```

## Error Handling

Hooks automatically handle errors and show toast notifications:

```typescript
// In useInstances hook
try {
  const response = await apiClient.createInstance(instance);
  if (response.success) {
    toast({
      title: 'Success',
      description: 'Instance created successfully',
    });
  }
} catch (err) {
  toast({
    title: 'Error',
    description: err.message,
    variant: 'destructive',
  });
}
```

## TypeScript Types

All API types are defined in `src/lib/api-client.ts`:

```typescript
// Main types
export interface CaddyInstance { ... }
export interface ConfigTemplate { ... }
export interface HealthCheckResult { ... }
export interface APIResponse<T> { ... }
export interface APIError { ... }
```

Import and use in components:

```typescript
import type { CaddyInstance, ConfigTemplate } from '@/lib/api-client';
```

## Next Steps

### Additional Components to Integrate

1. **Dashboard** (`src/pages/Dashboard.tsx`)
   - Show instance statistics
   - Display health status overview
   - Recent activity log

2. **Config Editor** (`src/pages/Config.tsx`)
   - Use `useConfig` hook
   - Implement JSON editor
   - Add save/revert functionality

3. **Upstreams** (`src/pages/Upstreams.tsx`)
   - Fetch upstream status
   - Display health checks
   - Real-time updates

4. **Certificates** (`src/pages/Certificates.tsx`)
   - Use PKI/CA endpoints
   - Show certificate details
   - Renewal status

## Testing the Integration

### Manual Testing Checklist

- [ ] Create a new instance
- [ ] View instance list
- [ ] Test connection to instance
- [ ] Update instance details
- [ ] Delete an instance
- [ ] View configuration
- [ ] Update configuration
- [ ] Test with offline backend
- [ ] Test with network errors
- [ ] Verify toast notifications
- [ ] Check loading states
- [ ] Verify empty states

### Integration Test Example

```typescript
// Future: Add to tests/integration.test.ts
describe('Instance Management', () => {
  it('should create and delete instance', async () => {
    const instance = await apiClient.createInstance({
      name: "Test",
      admin_url: "http://test:2019",
      auth_type: "none"
    });
    
    expect(instance.data?.id).toBeDefined();
    
    await apiClient.deleteInstance(instance.data!.id);
  });
});
```

## Troubleshooting

### Backend not responding

```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","service":"caddy-orchestrator"}
```

### CORS errors

Ensure `cors_origins` in `config/config.yaml` includes frontend URL:

```yaml
security:
  cors_origins:
    - "http://localhost:8080"
    - "http://localhost:5173"
```

### Proxy not working

Check Vite proxy configuration in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

### Type errors

Regenerate types if backend API changes:

```bash
# Update types in src/lib/api-client.ts
# to match backend response structures
```

## Production Build

### Build Frontend

```bash
npm run build
# Creates dist/ folder
```

### Integrated Deployment

```bash
# Build both frontend and backend
npm run build
CGO_ENABLED=1 go build -o caddy-orchestrator ./cmd/server

# Or use Docker
docker build -t caddy-orchestrator .
docker run -p 3000:3000 caddy-orchestrator
```

Frontend is served from backend at `http://localhost:3000/`

### Production Configuration

Set production API URL:

```bash
# During build
VITE_API_URL=/api npm run build
```

## Summary

The frontend is now fully integrated with the Go backend:

✅ **API Client** - Type-safe communication layer  
✅ **React Hooks** - Reusable data fetching logic  
✅ **Updated Components** - Live data from backend  
✅ **Error Handling** - User-friendly notifications  
✅ **Development Proxy** - Seamless local development  
✅ **Production Ready** - Optimized builds  

The integration provides a solid foundation for building out the remaining features like configuration editing, template management, and real-time monitoring.
