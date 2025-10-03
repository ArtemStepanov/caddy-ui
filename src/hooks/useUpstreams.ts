import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { UpstreamsData, UpstreamHealthCheckResult } from '@/types/api';
import type {
  CaddyConfig,
  CaddyUpstreamStatus,
  CaddyReverseProxyHandler,
  ParsedUpstream,
  ParsedUpstreamPool,
} from '@/types/caddy';
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
      
      // Fetch both upstreams status and config in parallel
      const [upstreamsResponse, configResponse] = await Promise.all([
        apiClient.getUpstreams(instanceId),
        apiClient.getConfig(instanceId).catch(() => ({ success: false, data: null }))
      ]);
      
      if (!upstreamsResponse.success || !upstreamsResponse.data) {
        throw new Error(upstreamsResponse.error?.message || 'Failed to fetch upstreams');
      }
      
      const config = configResponse.success ? configResponse.data : null;
      return transformUpstreamsData(upstreamsResponse.data, config);
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
function transformUpstreamsData(
  rawData: CaddyUpstreamStatus[] | UpstreamsData,
  config: CaddyConfig | null
): UpstreamsData {
  // Handle case where rawData is already in our format
  if (!Array.isArray(rawData) && 'pools' in rawData) {
    return rawData as UpstreamsData;
  }

  // Handle raw Caddy API response - transform it
  const upstreamsArray = Array.isArray(rawData) ? rawData : [];
  const pools = groupUpstreamsToPools(upstreamsArray, config);
  
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
 * Group individual upstreams into pools based on config
 */
function groupUpstreamsToPools(
  upstreams: CaddyUpstreamStatus[],
  config: CaddyConfig | null
): ParsedUpstreamPool[] {
  const pools: ParsedUpstreamPool[] = [];
  
  // Parse the Caddy config to find reverse_proxy handlers
  if (config?.apps?.http?.servers) {
    const servers = config.apps.http.servers;
    let poolIndex = 0;
    
    Object.entries(servers).forEach(([serverName, server]) => {
      if (!server.routes) return;
      
      server.routes.forEach((route, routeIndex) => {
        if (!route.handle) return;
        
        route.handle.forEach((handler) => {
          // Type guard for reverse_proxy handler
          const isReverseProxy = handler.handler === 'reverse_proxy';
          const reverseProxyHandler = handler as CaddyReverseProxyHandler;
          
          if (isReverseProxy && reverseProxyHandler.upstreams) {
            poolIndex++;
            
            // Extract pool name from route matcher or use descriptive name
            let poolName = `${serverName} - Route ${routeIndex + 1}`;
            
            // Try to get a better name from match conditions
            if (route.match && route.match.length > 0) {
              const match = route.match[0];
              if (match.host && match.host.length > 0) {
                poolName = match.host[0];
              } else if (match.path && match.path.length > 0) {
                poolName = `${serverName}${match.path[0]}`;
              }
            }
            
            // Get configured upstreams for this pool
            const configuredUpstreams = reverseProxyHandler.upstreams.map(u => u.dial);
            
            // Match with runtime upstreams from /reverse_proxy/upstreams
            const matchedUpstreams: ParsedUpstream[] = upstreams
              .filter(u => {
                const upstreamAddr = u.address || u.dial;
                return configuredUpstreams.some(configured => 
                  upstreamAddr === configured || 
                  upstreamAddr?.includes(configured) || 
                  configured.includes(upstreamAddr || '')
                );
              })
              .map((u, idx) => ({
                address: u.address || u.dial || `upstream-${idx}`,
                dial: u.dial,
                max_requests: u.max_requests,
                health_checks: u.health_checks,
              healthy: u.healthy !== undefined ? u.healthy : true,
              num_requests: u.num_requests || 0,
              fails: u.fails || 0,
              response_time: 0, // TODO: Get from Caddy metrics or Prometheus
              last_check: new Date().toISOString(),
              }));
            
            // Always add pool with the extracted name, even if matching failed
            // If no matches found, this means the upstreams might be in a different format
            // They will be shown in the default pool instead
            pools.push({
              id: `pool-${poolIndex}`,
              name: poolName,
              lb_policy: reverseProxyHandler.load_balancing?.selection_policy?.policy || 'round_robin',
              upstreams: matchedUpstreams,
            });
          }
        });
      });
    });
  }
  
  // If no pools found, collect unmatched upstreams into a default pool
  if (pools.length === 0 && upstreams.length > 0) {
    const defaultUpstreams: ParsedUpstream[] = upstreams.map((u, idx) => ({
      address: u.address || u.dial || `upstream-${idx}`,
      dial: u.dial,
      max_requests: u.max_requests,
      health_checks: u.health_checks,
      healthy: u.healthy !== undefined ? u.healthy : true,
      num_requests: u.num_requests || 0,
      fails: u.fails || 0,
      response_time: 0, // TODO: Get from Caddy metrics or Prometheus
      last_check: new Date().toISOString(),
    }));

    // Try to extract a better name from config if available
    let poolName = 'Default Pool';
    if (config?.apps?.http?.servers) {
      const serverNames = Object.keys(config.apps.http.servers);
      if (serverNames.length > 0) {
        poolName = serverNames[0];
      }
    }

    pools.push({
      id: 'default',
      name: poolName,
      upstreams: defaultUpstreams,
    });
  }
  
  return pools;
}

/**
 * Determine upstream status based on health and metrics
 */
function determineUpstreamStatus(
  upstream: ParsedUpstream
): 'healthy' | 'unhealthy' | 'degraded' | 'unknown' {
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
