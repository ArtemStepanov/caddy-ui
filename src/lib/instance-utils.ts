/**
 * Utility functions for instance management
 */

import type { CaddyInstance, InstanceStatus, StatusConfig, InstanceStats } from '@/types';

/**
 * Map backend status to UI status
 */
export function mapInstanceStatus(status: string): InstanceStatus {
  switch (status.toLowerCase()) {
    case 'online':
      return 'healthy';
    case 'offline':
      return 'unreachable';
    case 'error':
      return 'unhealthy';
    default:
      return 'unknown';
  }
}

/**
 * Get status configuration for UI display
 */
export function getStatusConfig(status: InstanceStatus): StatusConfig {
  const configs: Record<InstanceStatus, StatusConfig> = {
    healthy: {
      label: 'Healthy',
      color: 'bg-green-500/20 text-green-500 border-green-500/50',
      dotColor: 'bg-green-500',
      pulse: true,
    },
    unhealthy: {
      label: 'Unhealthy',
      color: 'bg-orange-500/20 text-orange-500 border-orange-500/50',
      dotColor: 'bg-orange-500',
      pulse: false,
    },
    unreachable: {
      label: 'Unreachable',
      color: 'bg-red-500/20 text-red-500 border-red-500/50',
      dotColor: 'bg-red-500',
      pulse: false,
    },
    unknown: {
      label: 'Unknown',
      color: 'bg-gray-500/20 text-gray-500 border-gray-500/50',
      dotColor: 'bg-gray-500',
      pulse: false,
    },
  };

  return configs[status] || configs.unknown;
}

/**
 * Format last seen time in human-readable format
 */
export function formatLastSeen(lastSeen?: string | Date): string {
  if (!lastSeen) return 'Never';
  
  const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 30) return 'Just now';
  if (diffSecs < 60) return `${diffSecs} seconds ago`;
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

/**
 * Calculate statistics from instances
 */
export function calculateStats(instances: CaddyInstance[]): InstanceStats {
  const stats: InstanceStats = {
    total: instances.length,
    healthy: 0,
    unhealthy: 0,
    unreachable: 0,
    unknown: 0,
  };

  instances.forEach((instance) => {
    const status = mapInstanceStatus(instance.status);
    stats[status]++;
  });

  return stats;
}

/**
 * Filter instances by search query
 */
export function filterInstancesBySearch(
  instances: CaddyInstance[],
  searchQuery: string
): CaddyInstance[] {
  if (!searchQuery.trim()) return instances;

  const query = searchQuery.toLowerCase();
  
  return instances.filter((instance) => {
    return (
      instance.name.toLowerCase().includes(query) ||
      instance.admin_url.toLowerCase().includes(query) ||
      instance.id.toLowerCase().includes(query)
    );
  });
}

/**
 * Filter instances by status
 */
export function filterInstancesByStatus(
  instances: CaddyInstance[],
  statusFilter: InstanceStatus | 'all'
): CaddyInstance[] {
  if (statusFilter === 'all') return instances;

  return instances.filter((instance) => {
    return mapInstanceStatus(instance.status) === statusFilter;
  });
}

/**
 * Sort instances by field
 */
export function sortInstances(
  instances: CaddyInstance[],
  sortBy: 'name' | 'status' | 'last_seen',
  sortOrder: 'asc' | 'desc' = 'asc'
): CaddyInstance[] {
  const sorted = [...instances].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'last_seen':
        const aTime = a.last_seen ? new Date(a.last_seen).getTime() : 0;
        const bTime = b.last_seen ? new Date(b.last_seen).getTime() : 0;
        comparison = aTime - bTime;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Validate instance name
 */
export function validateInstanceName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  if (name.length < 3) {
    return 'Name must be at least 3 characters';
  }
  if (name.length > 50) {
    return 'Name must be less than 50 characters';
  }
  return null;
}

/**
 * Validate admin URL
 */
export function validateAdminUrl(url: string): string | null {
  if (!url || url.trim().length === 0) {
    return 'Admin URL is required';
  }
  
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must use http:// or https://';
    }
    return null;
  } catch {
    return 'Please enter a valid URL (e.g., http://localhost:2019)';
  }
}

/**
 * Check if instance name is unique
 */
export function isInstanceNameUnique(
  name: string,
  instances: CaddyInstance[],
  currentInstanceId?: string
): boolean {
  return !instances.some(
    (instance) => 
      instance.name.toLowerCase() === name.toLowerCase() && 
      instance.id !== currentInstanceId
  );
}
