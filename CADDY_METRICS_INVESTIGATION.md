# Caddy Response Time Metrics - Investigation

## Question

Can we fetch `response_time` metrics directly from Caddy Admin API?

## Investigation

### What Caddy Admin API Provides

According to the Caddy Admin API documentation and the current codebase, the `/reverse_proxy/upstreams` endpoint returns:

```json
[
  {
    "address": "upstream-address",
    "dial": "dial-address",
    "num_requests": 1234,
    "fails": 5,
    "healthy": true,
    "max_requests": 0,
    "health_checks": {
      "active": { ... },
      "passive": { ... }
    }
  }
]
```

**Available Fields** ✅:
- `address` - Upstream address
- `dial` - Dial address
- `num_requests` - Total requests sent to this upstream
- `fails` - Number of failed requests
- `healthy` - Current health status (boolean)
- `max_requests` - Max concurrent requests limit
- `health_checks` - Health check configuration

**NOT Available** ❌:
- ❌ `response_time` - No latency/response time metrics
- ❌ `uptime_percentage` - No historical uptime data
- ❌ `status_code_distribution` - No per-status-code breakdown
- ❌ `request_rate` - No requests per second
- ❌ `error_rate` - No error percentage over time
- ❌ Historical time-series data

### Why Caddy Doesn't Provide Response Times

The Caddy Admin API at `/reverse_proxy/upstreams` is designed for:
1. **Configuration inspection** - See what upstreams are configured
2. **Basic counters** - Requests and fails (lifetime counters)
3. **Health status** - Current healthy/unhealthy state

It is **NOT** a metrics/observability endpoint. It doesn't:
- Track latencies per request
- Store historical performance data
- Calculate percentiles or averages
- Provide time-series metrics

## Options to Get Response Time Metrics

### Option 1: Prometheus Metrics Endpoint ⭐ RECOMMENDED

Caddy exposes a Prometheus metrics endpoint at `:2019/metrics` that includes detailed HTTP metrics:

```
# Example metrics available:
caddy_http_request_duration_seconds_bucket
caddy_http_request_duration_seconds_sum
caddy_http_request_duration_seconds_count
caddy_http_requests_in_flight
caddy_http_response_duration_seconds
```

**Implementation**:
1. Scrape Caddy's `/metrics` endpoint (port 2019 by default)
2. Parse Prometheus metrics format
3. Extract `caddy_http_request_duration_seconds` histograms
4. Calculate percentiles (P50, P75, P90, P95, P99)
5. Filter by upstream backend

**Pros**:
- ✅ Real, accurate latency data
- ✅ Histogram buckets for percentile calculation
- ✅ Standard Prometheus format
- ✅ Detailed per-route, per-upstream metrics
- ✅ Already exposed by Caddy

**Cons**:
- ⚠️ Requires parsing Prometheus text format
- ⚠️ Need to maintain mapping between upstream address and metric labels
- ⚠️ Additional endpoint to query

### Option 2: Custom Metrics Tracking Service

Build a backend service that:
1. Polls Caddy Admin API regularly
2. Makes test requests to upstreams
3. Measures response times
4. Stores in time-series database (e.g., InfluxDB, TimescaleDB)
5. Provides API for UI

**Pros**:
- ✅ Full control over metrics
- ✅ Can add custom measurements
- ✅ Historical data storage

**Cons**:
- ❌ Complex implementation
- ❌ Additional infrastructure
- ❌ Test requests add overhead
- ❌ Not measuring real user traffic

### Option 3: Access Log Analysis

Parse Caddy access logs to extract:
- Request timestamps
- Response times
- Status codes
- Upstream addresses

**Pros**:
- ✅ Real user traffic data
- ✅ Detailed per-request information

**Cons**:
- ❌ Requires log parsing
- ❌ Limited to log retention period
- ❌ Performance overhead of parsing
- ❌ Mapping logs to specific upstreams can be complex

### Option 4: Stay with Current Implementation

Keep `response_time: 0` and display "N/A" or hide the metric.

**Pros**:
- ✅ Honest representation
- ✅ No complexity
- ✅ Clear communication to users

**Cons**:
- ❌ No performance monitoring
- ❌ Limited observability

## Recommendation

**For Production**: Implement **Option 1 (Prometheus Metrics)**

This is the best approach because:
1. Caddy already exposes these metrics
2. Industry-standard format
3. Real, accurate data from actual traffic
4. Minimal additional complexity
5. Can integrate with existing monitoring tools (Grafana, etc.)

### Implementation Steps

1. **Backend**: Add Prometheus metrics endpoint handler
   ```go
   // GET /api/instances/:id/metrics
   func (h *ConfigHandler) GetMetrics(c *gin.Context) {
       instanceID := c.Param("id")
       instance := // get instance
       
       // Fetch from Caddy metrics endpoint
       resp, err := http.Get(instance.MetricsURL()) // :2019/metrics
       // Parse Prometheus format
       // Extract relevant upstream metrics
       // Return as JSON
   }
   ```

2. **Frontend**: Update `useUpstreams` hook
   ```typescript
   // Fetch metrics separately
   const metricsResponse = await apiClient.getMetrics(instanceId);
   
   // Merge with upstream data
   upstreams.forEach(u => {
       const metrics = metricsResponse.find(m => m.address === u.address);
       u.response_time = metrics?.p50_latency_ms || 0;
   });
   ```

3. **UI**: Already built - just needs real data!

## Current Status

**What We Have**:
- ✅ UI components ready for response_time display
- ✅ Charts and visualizations built
- ✅ Set to `0` to indicate unavailable data

**What We Need**:
- ⏳ Backend endpoint to fetch and parse Prometheus metrics
- ⏳ Frontend integration to consume metrics endpoint
- ⏳ Mapping logic to match upstreams with metrics

**Estimate**: ~2-4 hours of development for Prometheus integration

## Conclusion

**Answer**: No, we cannot currently fetch response_time from the standard Caddy Admin API `/reverse_proxy/upstreams` endpoint because it doesn't include latency metrics.

**However**: Caddy DOES provide this data via the Prometheus metrics endpoint at `:2019/metrics`. We just need to:
1. Add a backend handler to fetch and parse these metrics
2. Merge them with the upstream data
3. The UI is already ready to display it!

The current implementation with `response_time: 0` is correct and honest until we implement the Prometheus integration.

---

**Date**: October 3, 2025  
**Status**: ⏳ Requires Prometheus Integration  
**Priority**: Medium (nice-to-have, not blocking)
