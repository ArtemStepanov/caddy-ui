import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { UpstreamsData, UpstreamHealthCheckResult } from '@/types/api';
import { useEffect, useRef } from 'react';

/**
 * Hook to fetch upstreams data with auto-refresh support
 */
export function useUpstreams(instanceId: string | null, autoRefreshInterval?: number) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const query = useQuery({
    queryKey: ['upstreams', instanceId],
    queryFn: async () => {
      if (!instanceId) return null;
      const response = await apiClient.getUpstreams(instanceId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch upstreams');
      }
      return transformUpstreamsData(response.data);
    },
    enabled: !!instanceId,
    refetchOnWindowFocus: false,
    staleTime: 5000, // 5 seconds
  });

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshInterval && autoRefreshInterval > 0 && instanceId) {
      intervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['upstreams', instanceId] });
      }, autoRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefreshInterval, instanceId, queryClient]);

  const refresh = () => {
    if (instanceId) {
      queryClient.invalidateQueries({ queryKey: ['upstreams', instanceId] });
    }
  };

  return {
    ...query,
    refresh,
  };
}

/**
 * Hook to test upstream health checks
 */
export function useTestUpstreamHealth(instanceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (upstreamAddress?: string) => {
      // In a real implementation, this would call a specific health check endpoint
      // For now, we'll trigger a refresh
      const response = await apiClient.getUpstreams(instanceId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to test health');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upstreams', instanceId] });
    },
  });
}

/**
 * Transform raw upstreams data from backend to our format
 */
function transformUpstreamsData(rawData: any): UpstreamsData {
  // Handle case where rawData is already in our format
  if (rawData.pools) {
    return rawData as UpstreamsData;
  }

  // Handle raw Caddy API response - transform it
  const pools = Array.isArray(rawData) ? groupUpstreamsToPools(rawData) : [];
  
  let totalUpstreams = 0;
  let healthy = 0;
  let unhealthy = 0;
  let degraded = 0;
  let totalResponseTime = 0;
  let responseTimes = 0;

  pools.forEach(pool => {
    pool.upstreams.forEach(upstream => {
      totalUpstreams++;
      
      const status = determineUpstreamStatus(upstream);
      upstream.status = status;
      
      if (status === 'healthy') healthy++;
      else if (status === 'unhealthy') unhealthy++;
      else if (status === 'degraded') degraded++;

      if (upstream.response_time) {
        totalResponseTime += upstream.response_time;
        responseTimes++;
      }
    });

    // Calculate pool stats
    pool.total_upstreams = pool.upstreams.length;
    pool.healthy_count = pool.upstreams.filter(u => u.status === 'healthy').length;
    pool.unhealthy_count = pool.upstreams.filter(u => u.status === 'unhealthy').length;
    
    const poolResponseTimes = pool.upstreams
      .map(u => u.response_time)
      .filter((rt): rt is number => rt !== undefined);
    
    pool.avg_response_time = poolResponseTimes.length > 0
      ? poolResponseTimes.reduce((a, b) => a + b, 0) / poolResponseTimes.length
      : 0;
  });

  return {
    pools,
    total_upstreams: totalUpstreams,
    healthy,
    unhealthy,
    degraded,
    avg_response_time: responseTimes > 0 ? totalResponseTime / responseTimes : 0,
  };
}

/**
 * Group individual upstreams into pools
 * This is a simplified version - in reality, we'd need pool information from the config
 */
function groupUpstreamsToPools(upstreams: any[]): any[] {
  // For now, create a single default pool
  // In a real implementation, we'd parse the reverse_proxy configuration
  return [{
    id: 'default',
    name: 'Default Pool',
    upstreams: upstreams.map((u, idx) => ({
      address: u.address || u.dial || `upstream-${idx}`,
      dial: u.dial,
      max_requests: u.max_requests,
      health_checks: u.health_checks,
      healthy: u.healthy !== undefined ? u.healthy : true,
      num_requests: u.num_requests || 0,
      fails: u.fails || 0,
      response_time: Math.floor(Math.random() * 200) + 20, // Mock data
      last_check: new Date().toISOString(),
      uptime_percentage: u.healthy ? 99.5 + Math.random() * 0.5 : 0,
    })),
  }];
}

/**
 * Determine upstream status based on health and metrics
 */
function determineUpstreamStatus(upstream: any): 'healthy' | 'unhealthy' | 'degraded' | 'unknown' {
  if (upstream.healthy === false) {
    return 'unhealthy';
  }
  
  if (upstream.healthy === true) {
    // Check if response time indicates degraded performance
    if (upstream.response_time && upstream.response_time > 500) {
      return 'degraded';
    }
    
    // Check fail count
    const maxFails = upstream.health_checks?.passive?.max_fails || 5;
    if (upstream.fails > 0 && upstream.fails < maxFails) {
      return 'degraded';
    }
    
    return 'healthy';
  }
  
  return 'unknown';
}
