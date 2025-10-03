# Can We Fetch Response Time from Caddy?

## Short Answer

**No, the Caddy Admin API does NOT provide response time metrics for individual upstreams.**

However, there are ways to get this data. Here's the complete picture:

---

## What Caddy Admin API Provides

### `/reverse_proxy/upstreams` Endpoint

The current endpoint we use returns:

```json
[
  {
    "address": "backend.example.com",
    "dial": "backend.example.com:80",
    "num_requests": 1234,      ✅ Available
    "fails": 5,                ✅ Available
    "healthy": true,           ✅ Available
    "max_requests": 0,         ✅ Available
    "health_checks": { ... }   ✅ Available
  }
]
```

**Available** ✅:
- Request counts (lifetime totals)
- Fail counts
- Health status (current)
- Configuration

**NOT Available** ❌:
- Response times / latency
- Percentiles (P50, P90, P99)
- Request rates
- Status code distributions
- Historical data

---

## How to Get Response Time Metrics

### Option 1: Prometheus Metrics ⭐ **RECOMMENDED**

Caddy exposes Prometheus metrics at `:2019/metrics` with detailed HTTP metrics:

```
caddy_http_request_duration_seconds_bucket{handler="reverse_proxy",le="0.1"} 450
caddy_http_request_duration_seconds_bucket{handler="reverse_proxy",le="0.5"} 890
caddy_http_request_duration_seconds_sum{handler="reverse_proxy"} 234.5
caddy_http_request_duration_seconds_count{handler="reverse_proxy"} 1000
```

**What you get**:
- ✅ Real response time histograms
- ✅ Percentile calculations (P50, P90, P95, P99)
- ✅ Per-handler, per-server metrics
- ✅ Industry-standard format

**Implementation needed**:
1. Add backend endpoint to fetch Prometheus metrics
2. Parse Prometheus text format
3. Calculate percentiles from histogram buckets
4. Match metrics to specific upstreams (by label filtering)

**Complexity**: Medium (~4-6 hours)

### Option 2: Active Health Check Latency

Your code already measures latency for health checks:

```go
// internal/storage/models.go
type HealthCheckResult struct {
    InstanceID string    `json:"instance_id"`
    Healthy    bool      `json:"healthy"`
    Latency    int64     `json:"latency_ms"`  ✅ This exists!
    Timestamp  time.Time `json:"timestamp"`
}
```

**What you get**:
- ✅ Latency of health check requests
- ✅ Already implemented in your codebase
- ⚠️ Not the same as real traffic latency
- ⚠️ Only measures synthetic health check requests

**To Use This**:
1. Store health check results with latency
2. Return latest latency in upstream data
3. Update UI to display it

**Pros**: Simple, already partially implemented  
**Cons**: Not real user traffic, only health check probes

### Option 3: Access Log Parsing

Parse Caddy access logs to extract response times.

**Pros**: Real traffic data  
**Cons**: Complex, performance overhead, log retention limits

### Option 4: Custom Middleware

Add custom Go middleware to track and expose upstream latencies.

**Pros**: Full control  
**Cons**: Requires modifying Caddy or building custom module

---

## What About the Latency in Your Code?

I noticed this in your codebase:

```go
// internal/caddy/client.go:368
latency := time.Since(start).Milliseconds()
// Log latency for monitoring
_ = latency  // ← Currently discarded!
```

This measures latency for **Caddy Admin API requests** (the orchestrator → Caddy communication), NOT upstream backend response times.

---

## Recommendation

### For Immediate Use: Keep `response_time: 0`

**Current implementation is correct**:
```typescript
response_time: 0, // TODO: Get from Caddy metrics or Prometheus
```

This is honest and doesn't mislead users.

### For Full Metrics: Implement Prometheus Integration

**Best approach** for production monitoring:

1. **Backend** (`internal/api/handlers/metrics.go`):
   ```go
   func (h *ConfigHandler) GetUpstreamMetrics(c *gin.Context) {
       instanceID := c.Param("id")
       
       // Fetch Prometheus metrics from Caddy
       metricsURL := instance.AdminURL + ":2019/metrics"
       resp, _ := http.Get(metricsURL)
       
       // Parse Prometheus format
       metrics := parsePrometheusMetrics(resp.Body)
       
       // Calculate percentiles from histograms
       upstreamMetrics := calculateUpstreamLatencies(metrics)
       
       c.JSON(200, upstreamMetrics)
   }
   ```

2. **Frontend** (`src/hooks/useUpstreams.ts`):
   ```typescript
   // Fetch metrics separately and merge
   const metrics = await apiClient.getUpstreamMetrics(instanceId);
   upstreams.forEach(u => {
       const metric = metrics.find(m => m.upstream === u.address);
       u.response_time = metric?.p50_latency_ms || 0;
   });
   ```

3. **UI**: Already built and ready! ✅

### Quick Win: Use Health Check Latency

**Simpler approach** for basic monitoring:

Return the latency from your existing health check system:

```go
// In GetUpstreams, add health check latency
upstreams[i].ResponseTime = getLatestHealthCheckLatency(upstream.Address)
```

This gives you _some_ latency data quickly, though it's not real traffic.

---

## Summary

| Data | Available from Caddy? | How to Get It |
|------|----------------------|---------------|
| Request counts | ✅ Yes | `/reverse_proxy/upstreams` |
| Fail counts | ✅ Yes | `/reverse_proxy/upstreams` |
| Health status | ✅ Yes | `/reverse_proxy/upstreams` |
| Response times | ❌ No | `:2019/metrics` (Prometheus) |
| Percentiles | ❌ No | `:2019/metrics` (Prometheus) |
| Historical data | ❌ No | External time-series DB |

**Current Status**: `response_time: 0` is correct - Caddy Admin API doesn't provide it.

**Best Solution**: Prometheus metrics integration (4-6 hours of work)

**Quick Solution**: Use health check latency (already in your code, 1-2 hours)

---

**Date**: October 3, 2025  
**Answer**: Not from `/reverse_proxy/upstreams`, but available via `:2019/metrics` (Prometheus)  
**Current Approach**: Correct - set to 0 until Prometheus integration
