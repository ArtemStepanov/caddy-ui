import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { UpstreamsData } from "@/types/api";
import type {
  CaddyConfig,
  CaddyUpstreamStatus,
  CaddyReverseProxyHandler,
  CaddyHandler,
  CaddyMatcher,
  CaddyRoute,
  ParsedUpstream,
  ParsedUpstreamPool,
} from "@/types/caddy";
import { useEffect, useRef } from "react";

// Metrics data structure from backend
interface PrometheusMetrics {
  upstreams: Record<string, { address: string; healthy: boolean }>;
  handlers: Record<
    string,
    {
      server: string;
      handler: string;
      requests_total: number;
      errors_total: number;
      requests_in_flight: number;
      avg_duration_ms: number;
    }
  >;
  total_requests_in_flight: number;
  timestamp: string;
}

/**
 * Hook to fetch upstreams data with auto-refresh support
 */
export function useUpstreams(
  instanceId: string | null,
  autoRefreshInterval?: number
) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const query = useQuery({
    queryKey: ["upstreams", instanceId],
    queryFn: async () => {
      if (!instanceId) return null;

      // Fetch upstreams status, config, and metrics in parallel
      const [upstreamsResponse, configResponse, metricsResponse] =
        await Promise.all([
          apiClient.getUpstreams(instanceId),
          apiClient
            .getConfig(instanceId)
            .catch(() => ({ success: false, data: null })),
          apiClient.getMetrics(instanceId).catch(() => ({
            success: true,
            data: { metrics_available: false, metrics: null },
          })),
        ]);

      if (!upstreamsResponse.success || !upstreamsResponse.data) {
        throw new Error(
          upstreamsResponse.error?.message || "Failed to fetch upstreams"
        );
      }

      const config = configResponse.success
        ? (configResponse.data as CaddyConfig) ?? null
        : null;

      // Extract metrics data if available
      const metricsData =
        metricsResponse.success && metricsResponse.data?.metrics_available
          ? (metricsResponse.data.metrics as PrometheusMetrics | undefined)
          : undefined;

      return transformUpstreamsData(
        upstreamsResponse.data as CaddyUpstreamStatus[],
        config,
        metricsData
      );
    },
    enabled: !!instanceId,
    refetchOnWindowFocus: false,
    staleTime: 5000, // 5 seconds
  });

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshInterval && autoRefreshInterval > 0 && instanceId) {
      intervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["upstreams", instanceId] });
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
      queryClient.invalidateQueries({ queryKey: ["upstreams", instanceId] });
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
    mutationFn: async () => {
      // In a real implementation, this would call a specific health check endpoint
      // For now, we'll trigger a refresh
      const response = await apiClient.getUpstreams(instanceId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Failed to test health");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upstreams", instanceId] });
    },
  });
}

/**
 * Transform raw upstreams data from backend to our format
 */
function transformUpstreamsData(
  rawData: CaddyUpstreamStatus[] | UpstreamsData,
  config: CaddyConfig | null,
  metrics?: PrometheusMetrics
): UpstreamsData & {
  total_requests_in_flight?: number;
  metrics_available?: boolean;
} {
  // Handle case where rawData is already in our format
  if (!Array.isArray(rawData) && "pools" in rawData) {
    return rawData as UpstreamsData;
  }

  // Handle raw Caddy API response - transform it
  const upstreamsArray = Array.isArray(rawData) ? rawData : [];
  const pools = groupUpstreamsToPools(upstreamsArray, config, metrics);

  let totalUpstreams = 0;
  let healthy = 0;
  let unhealthy = 0;
  let degraded = 0;
  let totalResponseTime = 0;
  let responseTimes = 0;

  pools.forEach((pool) => {
    pool.upstreams.forEach((upstream) => {
      totalUpstreams++;

      const status = determineUpstreamStatus(upstream);
      upstream.status = status;

      if (status === "healthy") healthy++;
      else if (status === "unhealthy") unhealthy++;
      else if (status === "degraded") degraded++;

      if (upstream.response_time) {
        totalResponseTime += upstream.response_time;
        responseTimes++;
      }
    });

    // Calculate pool stats
    pool.total_upstreams = pool.upstreams.length;
    pool.healthy_count = pool.upstreams.filter(
      (u) => u.status === "healthy"
    ).length;
    pool.unhealthy_count = pool.upstreams.filter(
      (u) => u.status === "unhealthy"
    ).length;

    const poolResponseTimes = pool.upstreams
      .map((u) => u.response_time)
      .filter((rt): rt is number => rt !== undefined);

    pool.avg_response_time =
      poolResponseTimes.length > 0
        ? poolResponseTimes.reduce((a, b) => a + b, 0) /
          poolResponseTimes.length
        : 0;
  });

  return {
    pools,
    total_upstreams: totalUpstreams,
    healthy,
    unhealthy,
    degraded,
    avg_response_time:
      responseTimes > 0 ? totalResponseTime / responseTimes : 0,
    // Include Prometheus metrics if available
    total_requests_in_flight: metrics?.total_requests_in_flight,
    metrics_available: !!metrics,
  };
}

/**
 * Recursively find all reverse_proxy handlers in a handler tree
 * Handles nested subroute handlers common in Caddy configs with middleware
 */
interface FoundReverseProxy {
  handler: CaddyReverseProxyHandler;
  parentMatch?: CaddyMatcher[];
}

function findReverseProxyHandlers(
  handlers: CaddyHandler[],
  parentMatch?: CaddyMatcher[]
): FoundReverseProxy[] {
  const found: FoundReverseProxy[] = [];

  for (const handler of handlers) {
    if (handler.handler === "reverse_proxy") {
      const rpHandler = handler as CaddyReverseProxyHandler;
      if (rpHandler.upstreams && rpHandler.upstreams.length > 0) {
        found.push({ handler: rpHandler, parentMatch });
      }
    } else if (handler.handler === "subroute") {
      // Recursively search inside subroute handlers
      const subrouteHandler = handler as {
        handler: "subroute";
        routes?: CaddyRoute[];
      };
      if (subrouteHandler.routes) {
        for (const subroute of subrouteHandler.routes) {
          if (subroute.handle) {
            // Pass down the match from subroute if available, otherwise use parent
            const matchToUse = subroute.match || parentMatch;
            found.push(
              ...findReverseProxyHandlers(subroute.handle, matchToUse)
            );
          }
        }
      }
    }
  }

  return found;
}

/**
 * Group individual upstreams into pools based on config
 */
function groupUpstreamsToPools(
  upstreams: CaddyUpstreamStatus[],
  config: CaddyConfig | null,
  _metrics?: PrometheusMetrics
): ParsedUpstreamPool[] {
  const pools: ParsedUpstreamPool[] = [];
  const matchedUpstreamAddresses = new Set<string>();

  // Parse the Caddy config to find reverse_proxy handlers
  if (config?.apps?.http?.servers) {
    const servers = config.apps.http.servers;
    let poolIndex = 0;

    Object.entries(servers).forEach(([serverName, server]) => {
      if (!server.routes) return;

      server.routes.forEach((route, routeIndex) => {
        if (!route.handle) return;

        // Recursively find all reverse_proxy handlers (including nested in subroutes)
        const reverseProxyHandlers = findReverseProxyHandlers(
          route.handle,
          route.match
        );

        reverseProxyHandlers.forEach((found) => {
          const reverseProxyHandler = found.handler;
          poolIndex++;

          // Extract pool name from route matcher or use descriptive name
          let poolName = `${serverName} - Route ${routeIndex + 1}`;

          // Try to get a better name from match conditions (check found match first, then route match)
          const matchToCheck = found.parentMatch || route.match;
          if (matchToCheck && matchToCheck.length > 0) {
            const match = matchToCheck[0];
            if (match.host && match.host.length > 0) {
              poolName = match.host[0];
            } else if (match.path && match.path.length > 0) {
              poolName = `${serverName}${match.path[0]}`;
            }
          }

          // Get configured upstreams for this pool
          const configuredUpstreams =
            reverseProxyHandler.upstreams?.map((u) => u.dial) || [];

          // Match with runtime upstreams from /reverse_proxy/upstreams
          const matchedUpstreams: ParsedUpstream[] = upstreams
            .filter((u) => {
              const upstreamAddr = u.address || u.dial;
              return configuredUpstreams.some(
                (configured) =>
                  upstreamAddr === configured ||
                  upstreamAddr?.includes(configured || "") ||
                  (configured && configured.includes(upstreamAddr || ""))
              );
            })
            .map((u, idx) => {
              const addr = u.address || u.dial || `upstream-${idx}`;
              matchedUpstreamAddresses.add(addr);
              return {
                address: addr,
                dial: u.dial,
                max_requests: u.max_requests,
                health_checks: u.health_checks,
                healthy: u.healthy !== undefined ? u.healthy : true,
                num_requests: u.num_requests || 0,
                fails: u.fails || 0,
                response_time: 0, // TODO: Get from Caddy metrics or Prometheus
                last_check: new Date().toISOString(),
              };
            });

          // Only add pool if it has matched upstreams
          if (matchedUpstreams.length > 0) {
            pools.push({
              id: `pool-${poolIndex}`,
              name: poolName,
              lb_policy:
                reverseProxyHandler.load_balancing?.selection_policy?.policy ||
                "round_robin",
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
    let poolName = "Default Pool";
    if (config?.apps?.http?.servers) {
      const serverNames = Object.keys(config.apps.http.servers);
      if (serverNames.length > 0) {
        poolName = serverNames[0];
      }
    }

    pools.push({
      id: "default",
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
): "healthy" | "unhealthy" | "degraded" | "unknown" {
  if (upstream.healthy === false) {
    return "unhealthy";
  }

  if (upstream.healthy === true) {
    // Check if response time indicates degraded performance
    if (upstream.response_time && upstream.response_time > 500) {
      return "degraded";
    }

    // Check fail count
    const maxFails = upstream.health_checks?.passive?.max_fails || 5;
    if (upstream.fails > 0 && upstream.fails < maxFails) {
      return "degraded";
    }

    return "healthy";
  }

  return "unknown";
}
