import { ComponentChildren } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api, StatusResponse } from '../lib/api';
import { StatusBadge } from './StatusBadge';
import { Toast } from './Toast';

interface LayoutProps {
  children: ComponentChildren;
}

export function Layout({ children }: LayoutProps) {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    setChecking(true);
    try {
      const data = await api.getStatus();
      setStatusData(data);
    } catch {
      setStatusData({ status: 'offline', error: 'Failed to check status' });
    } finally {
      setChecking(false);
    }
  }

  const status = checking && !statusData ? 'loading' : (statusData?.status || 'offline');

  return (
    <div class="min-h-screen flex flex-col">
      {/* Header */}
      <header class="bg-slate-800 border-b border-slate-700">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Caddy Lite
          </a>

          <div class="flex items-center gap-4">
            <StatusBadge
              status={status}
              latency={statusData?.latency}
              lastSyncedAt={statusData?.last_synced_at}
              lastSyncError={statusData?.last_sync_error}
            />
            <nav class="flex gap-4">
              <a href="/" class="text-slate-300 hover:text-white">Dashboard</a>
              <a href="/settings" class="text-slate-300 hover:text-white">Settings</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Offline Warning Banner */}
      {status === 'offline' && (
        <div class="bg-red-900/50 border-b border-red-700 px-4 py-2 text-center text-sm text-red-300">
          Unable to connect to Caddy server.{' '}
          <a href="/settings" class="underline">Check settings</a>
        </div>
      )}

      {/* Main Content */}
      <main class="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer class="bg-slate-800 border-t border-slate-700 py-4 text-center text-sm text-slate-500">
        Caddy Orchestrator Lite
      </footer>

      <Toast />
    </div>
  );
}
