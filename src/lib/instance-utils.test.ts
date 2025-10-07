import { describe, it, expect } from 'vitest';
import type { CaddyInstance, InstanceStatus } from '@/types';
import {
  mapInstanceStatus,
  getStatusConfig,
  formatLastSeen,
  calculateStats,
  filterInstancesBySearch,
  filterInstancesByStatus,
  sortInstances,
  validateInstanceName,
  validateAdminUrl,
  isInstanceNameUnique,
} from './instance-utils';

describe('mapInstanceStatus', () => {
  it('should map online to healthy', () => {
    expect(mapInstanceStatus('online')).toBe('healthy');
    expect(mapInstanceStatus('ONLINE')).toBe('healthy');
  });

  it('should map offline to unreachable', () => {
    expect(mapInstanceStatus('offline')).toBe('unreachable');
  });

  it('should map error to unhealthy', () => {
    expect(mapInstanceStatus('error')).toBe('unhealthy');
  });

  it('should map unknown status to unknown', () => {
    expect(mapInstanceStatus('unknown')).toBe('unknown');
    expect(mapInstanceStatus('other')).toBe('unknown');
  });
});

describe('getStatusConfig', () => {
  it('should return correct config for healthy status', () => {
    const config = getStatusConfig('healthy');
    expect(config.label).toBe('Healthy');
    expect(config.pulse).toBe(true);
  });

  it('should return correct config for unhealthy status', () => {
    const config = getStatusConfig('unhealthy');
    expect(config.label).toBe('Unhealthy');
    expect(config.pulse).toBe(false);
  });

  it('should return correct config for unreachable status', () => {
    const config = getStatusConfig('unreachable');
    expect(config.label).toBe('Unreachable');
  });

  it('should return unknown config for invalid status', () => {
    const config = getStatusConfig('invalid' as InstanceStatus);
    expect(config.label).toBe('Unknown');
  });
});

describe('formatLastSeen', () => {
  it('should return Never for undefined', () => {
    expect(formatLastSeen()).toBe('Never');
  });

  it('should return Just now for very recent times', () => {
    const now = new Date();
    expect(formatLastSeen(now)).toBe('Just now');
  });

  it('should format seconds ago', () => {
    const date = new Date(Date.now() - 45000);
    expect(formatLastSeen(date)).toBe('45 seconds ago');
  });

  it('should format minutes ago', () => {
    const date = new Date(Date.now() - 120000);
    expect(formatLastSeen(date)).toBe('2 minutes ago');
  });

  it('should format hours ago', () => {
    const date = new Date(Date.now() - 7200000);
    expect(formatLastSeen(date)).toBe('2 hours ago');
  });

  it('should format days ago', () => {
    const date = new Date(Date.now() - 172800000);
    expect(formatLastSeen(date)).toBe('2 days ago');
  });

  it('should format date for older times', () => {
    const date = new Date(Date.now() - 604800000);
    expect(formatLastSeen(date)).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('should handle string dates', () => {
    const dateStr = new Date(Date.now() - 60000).toISOString();
    expect(formatLastSeen(dateStr)).toBe('1 minute ago');
  });
});

describe('calculateStats', () => {
  it('should calculate stats correctly', () => {
    const instances: CaddyInstance[] = [
      { id: '1', name: 'Test1', admin_url: 'http://test1', status: 'online' } as CaddyInstance,
      { id: '2', name: 'Test2', admin_url: 'http://test2', status: 'offline' } as CaddyInstance,
      { id: '3', name: 'Test3', admin_url: 'http://test3', status: 'error' } as CaddyInstance,
      { id: '4', name: 'Test4', admin_url: 'http://test4', status: 'unknown' } as CaddyInstance,
    ];

    const stats = calculateStats(instances);
    expect(stats.total).toBe(4);
    expect(stats.healthy).toBe(1);
    expect(stats.unreachable).toBe(1);
    expect(stats.unhealthy).toBe(1);
    expect(stats.unknown).toBe(1);
  });

  it('should handle empty array', () => {
    const stats = calculateStats([]);
    expect(stats.total).toBe(0);
    expect(stats.healthy).toBe(0);
  });
});

describe('filterInstancesBySearch', () => {
  const instances: CaddyInstance[] = [
    { id: '1', name: 'Production', admin_url: 'http://prod.example.com', status: 'online' } as CaddyInstance,
    { id: '2', name: 'Development', admin_url: 'http://dev.example.com', status: 'online' } as CaddyInstance,
    { id: '3', name: 'Staging', admin_url: 'http://staging.example.com', status: 'online' } as CaddyInstance,
  ];

  it('should filter by name', () => {
    const result = filterInstancesBySearch(instances, 'prod');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Production');
  });

  it('should filter by URL', () => {
    const result = filterInstancesBySearch(instances, 'dev.example');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Development');
  });

  it('should filter by ID', () => {
    const result = filterInstancesBySearch(instances, '2');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should return all instances for empty query', () => {
    const result = filterInstancesBySearch(instances, '');
    expect(result).toHaveLength(3);
  });

  it('should be case insensitive', () => {
    const result = filterInstancesBySearch(instances, 'PRODUCTION');
    expect(result).toHaveLength(1);
  });
});

describe('filterInstancesByStatus', () => {
  const instances: CaddyInstance[] = [
    { id: '1', name: 'Test1', admin_url: 'http://test1', status: 'online' } as CaddyInstance,
    { id: '2', name: 'Test2', admin_url: 'http://test2', status: 'offline' } as CaddyInstance,
    { id: '3', name: 'Test3', admin_url: 'http://test3', status: 'online' } as CaddyInstance,
  ];

  it('should filter by healthy status', () => {
    const result = filterInstancesByStatus(instances, 'healthy');
    expect(result).toHaveLength(2);
  });

  it('should filter by unreachable status', () => {
    const result = filterInstancesByStatus(instances, 'unreachable');
    expect(result).toHaveLength(1);
  });

  it('should return all instances for all status', () => {
    const result = filterInstancesByStatus(instances, 'all');
    expect(result).toHaveLength(3);
  });
});

describe('sortInstances', () => {
  const instances: CaddyInstance[] = [
    { id: '1', name: 'Charlie', admin_url: 'http://c', status: 'online', last_seen: '2024-01-01' } as CaddyInstance,
    { id: '2', name: 'Alice', admin_url: 'http://a', status: 'offline', last_seen: '2024-01-03' } as CaddyInstance,
    { id: '3', name: 'Bob', admin_url: 'http://b', status: 'error', last_seen: '2024-01-02' } as CaddyInstance,
  ];

  it('should sort by name ascending', () => {
    const result = sortInstances(instances, 'name', 'asc');
    expect(result[0].name).toBe('Alice');
    expect(result[2].name).toBe('Charlie');
  });

  it('should sort by name descending', () => {
    const result = sortInstances(instances, 'name', 'desc');
    expect(result[0].name).toBe('Charlie');
    expect(result[2].name).toBe('Alice');
  });

  it('should sort by status', () => {
    const result = sortInstances(instances, 'status', 'asc');
    expect(result[0].status).toBe('error');
  });

  it('should sort by last_seen', () => {
    const result = sortInstances(instances, 'last_seen', 'asc');
    expect(result[0].id).toBe('1');
    expect(result[2].id).toBe('2');
  });
});

describe('validateInstanceName', () => {
  it('should accept valid names', () => {
    expect(validateInstanceName('Production')).toBeNull();
    expect(validateInstanceName('dev-server-1')).toBeNull();
  });

  it('should reject empty names', () => {
    expect(validateInstanceName('')).toBe('Name is required');
    expect(validateInstanceName('   ')).toBe('Name is required');
  });

  it('should reject names too short', () => {
    expect(validateInstanceName('ab')).toBe('Name must be at least 3 characters');
  });

  it('should reject names too long', () => {
    const longName = 'a'.repeat(51);
    expect(validateInstanceName(longName)).toBe('Name must be less than 50 characters');
  });
});

describe('validateAdminUrl', () => {
  it('should accept valid HTTP URLs', () => {
    expect(validateAdminUrl('http://localhost:2019')).toBeNull();
    expect(validateAdminUrl('https://caddy.example.com:2019')).toBeNull();
  });

  it('should reject empty URLs', () => {
    expect(validateAdminUrl('')).toBe('Admin URL is required');
    expect(validateAdminUrl('   ')).toBe('Admin URL is required');
  });

  it('should reject invalid URLs', () => {
    expect(validateAdminUrl('not-a-url')).toBe('Please enter a valid URL (e.g., http://localhost:2019)');
  });

  it('should reject non-HTTP protocols', () => {
    expect(validateAdminUrl('ftp://example.com')).toBe('URL must use http:// or https://');
  });
});

describe('isInstanceNameUnique', () => {
  const instances: CaddyInstance[] = [
    { id: '1', name: 'Production', admin_url: 'http://prod', status: 'online' } as CaddyInstance,
    { id: '2', name: 'Development', admin_url: 'http://dev', status: 'online' } as CaddyInstance,
  ];

  it('should return true for unique names', () => {
    expect(isInstanceNameUnique('Staging', instances)).toBe(true);
  });

  it('should return false for duplicate names', () => {
    expect(isInstanceNameUnique('Production', instances)).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isInstanceNameUnique('production', instances)).toBe(false);
  });

  it('should allow same name when editing current instance', () => {
    expect(isInstanceNameUnique('Production', instances, '1')).toBe(true);
  });

  it('should reject duplicate name even when editing different instance', () => {
    expect(isInstanceNameUnique('Production', instances, '2')).toBe(false);
  });
});
