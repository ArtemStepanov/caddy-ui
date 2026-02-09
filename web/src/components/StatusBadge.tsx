interface StatusBadgeProps {
  status: 'online' | 'offline' | 'loading';
  latency?: number;
  lastSyncedAt?: string;
  lastSyncError?: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function StatusBadge({ status, latency, lastSyncedAt, lastSyncError }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    loading: 'bg-yellow-500 animate-pulse',
  };

  const labels: Record<string, string> = {
    online: 'Caddy Online',
    offline: 'Caddy Offline',
    loading: 'Checking...',
  };

  return (
    <div class="flex items-center gap-2 text-sm">
      <span class={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span class="text-slate-400">{labels[status]}</span>
      {latency !== undefined && status === 'online' && (
        <span class="text-xs text-slate-500">{latency}ms</span>
      )}
      {lastSyncError ? (
        <span class="text-xs text-red-400" title={lastSyncError}>Sync failed</span>
      ) : lastSyncedAt ? (
        <span class="text-xs text-slate-500">Synced {timeAgo(lastSyncedAt)}</span>
      ) : null}
    </div>
  );
}
