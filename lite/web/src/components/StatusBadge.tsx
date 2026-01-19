interface StatusBadgeProps {
  status: 'online' | 'offline' | 'loading';
  latency?: number;
}

export function StatusBadge({ status, latency }: StatusBadgeProps) {
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
    </div>
  );
}
