# Task 05: Frontend Core

## Objective
Set up the minimal frontend shell using Preact and Tailwind CSS.

## Prerequisites
- Task 01 completed (project structure with Vite initialized)

## Design Goals
- Simple, clean interface
- Single-page application with client-side routing
- Minimal component count (~15-20 total)
- Mobile-responsive

## Steps

### 5.1 Configure Tailwind (`web/tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}
```

### 5.2 Create Main CSS (`web/src/index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, -apple-system, sans-serif;
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }
  
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white;
  }
  
  .btn-secondary {
    @apply bg-slate-700 hover:bg-slate-600 text-white;
  }
  
  .btn-danger {
    @apply bg-red-600 hover:bg-red-700 text-white;
  }

  .card {
    @apply bg-slate-800 border border-slate-700 rounded-lg p-4;
  }

  .input {
    @apply w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg 
           text-white placeholder-slate-500 focus:outline-none focus:border-primary-500;
  }

  .label {
    @apply block text-sm font-medium text-slate-300 mb-1;
  }
}
```

### 5.3 Create Main App Entry (`web/src/main.tsx`)

```tsx
import { render } from 'preact';
import { Router, Route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';
import './index.css';

import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RouteForm } from './pages/RouteForm';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <Layout>
      <Router>
        <Route path="/" component={Dashboard} />
        <Route path="/routes/new" component={RouteForm} />
        <Route path="/routes/:id" component={RouteForm} />
        <Route path="/settings" component={Settings} />
        <Route default component={NotFound} />
      </Router>
    </Layout>
  );
}

render(<App />, document.getElementById('app')!);
```

### 5.4 Create Layout Component (`web/src/components/Layout.tsx`)

```tsx
import { ComponentChildren } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { StatusBadge } from './StatusBadge';

interface LayoutProps {
  children: ComponentChildren;
}

export function Layout({ children }: LayoutProps) {
  const [status, setStatus] = useState<'online' | 'offline' | 'loading'>('loading');

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data.status === 'online' ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    }
  }

  return (
    <div class="min-h-screen flex flex-col">
      {/* Header */}
      <header class="bg-slate-800 border-b border-slate-700">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Caddy Lite
          </a>
          
          <div class="flex items-center gap-4">
            <StatusBadge status={status} />
            <nav class="flex gap-4">
              <a href="/" class="text-slate-300 hover:text-white">Dashboard</a>
              <a href="/settings" class="text-slate-300 hover:text-white">Settings</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer class="bg-slate-800 border-t border-slate-700 py-4 text-center text-sm text-slate-500">
        Caddy Orchestrator Lite
      </footer>
    </div>
  );
}
```

### 5.5 Create Status Badge (`web/src/components/StatusBadge.tsx`)

```tsx
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'loading';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    loading: 'bg-yellow-500',
  };

  const labels = {
    online: 'Caddy Online',
    offline: 'Caddy Offline',
    loading: 'Checking...',
  };

  return (
    <div class="flex items-center gap-2 text-sm">
      <span class={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span class="text-slate-400">{labels[status]}</span>
    </div>
  );
}
```

### 5.6 Create API Client (`web/src/lib/api.ts`)

```typescript
const API_BASE = '/api';

export interface Route {
  id: string;
  domain: string;
  path?: string;
  handler_type: string;
  config: any;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlobalConfig {
  caddy_admin_url: string;
  enable_encode: boolean;
}

class ApiClient {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Routes
  async listRoutes(): Promise<{ routes: Route[] }> {
    return this.request('/routes');
  }

  async getRoute(id: string): Promise<{ route: Route }> {
    return this.request(`/routes/${id}`);
  }

  async createRoute(route: Partial<Route>): Promise<{ route: Route }> {
    return this.request('/routes', {
      method: 'POST',
      body: JSON.stringify(route),
    });
  }

  async updateRoute(id: string, route: Partial<Route>): Promise<{ route: Route }> {
    return this.request(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(route),
    });
  }

  async deleteRoute(id: string): Promise<void> {
    return this.request(`/routes/${id}`, { method: 'DELETE' });
  }

  async toggleRoute(id: string): Promise<{ route: Route }> {
    return this.request(`/routes/${id}/toggle`, { method: 'POST' });
  }

  // Config
  async getConfig(): Promise<{ config: GlobalConfig }> {
    return this.request('/config');
  }

  async updateConfig(config: GlobalConfig): Promise<{ config: GlobalConfig }> {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Status
  async getStatus(): Promise<{ status: string }> {
    return this.request('/status');
  }

  async sync(): Promise<void> {
    return this.request('/sync', { method: 'POST' });
  }
}

export const api = new ApiClient();
```

### 5.7 Create Placeholder Pages

**`web/src/pages/Dashboard.tsx`**
```tsx
export function Dashboard() {
  return (
    <div>
      <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
      <p class="text-slate-400">Routes will be displayed here.</p>
    </div>
  );
}
```

**`web/src/pages/RouteForm.tsx`**
```tsx
export function RouteForm({ id }: { id?: string }) {
  return (
    <div>
      <h1 class="text-2xl font-bold mb-4">
        {id ? 'Edit Route' : 'New Route'}
      </h1>
      <p class="text-slate-400">Route form will be here.</p>
    </div>
  );
}
```

**`web/src/pages/Settings.tsx`**
```tsx
export function Settings() {
  return (
    <div>
      <h1 class="text-2xl font-bold mb-4">Settings</h1>
      <p class="text-slate-400">Global settings will be here.</p>
    </div>
  );
}
```

**`web/src/pages/NotFound.tsx`**
```tsx
export function NotFound() {
  return (
    <div class="text-center py-16">
      <h1 class="text-4xl font-bold mb-4">404</h1>
      <p class="text-slate-400 mb-8">Page not found</p>
      <a href="/" class="btn btn-primary">Go Home</a>
    </div>
  );
}
```

### 5.8 Update index.html (`web/index.html`)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Caddy Orchestrator Lite</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 5.9 Install Additional Dependencies

```bash
cd web
npm install preact-router
```

## Verification
- [ ] `npm run dev` starts without errors
- [ ] Layout renders with header and footer
- [ ] Client-side routing works between pages
- [ ] Status badge shows correct state
- [ ] API client compiles without type errors

## Files Created
- `web/tailwind.config.js`
- `web/src/index.css`
- `web/src/main.tsx`
- `web/src/components/Layout.tsx`
- `web/src/components/StatusBadge.tsx`
- `web/src/lib/api.ts`
- `web/src/pages/Dashboard.tsx`
- `web/src/pages/RouteForm.tsx`
- `web/src/pages/Settings.tsx`
- `web/src/pages/NotFound.tsx`

## Estimated Time
1-2 hours
