# Uptime Display Fix

## Problem

The uptime percentage shown in the UI was displaying mock/random data and not based on any real metrics from Caddy. The values were:
- Random values between 99.5-100% for healthy upstreams
- 0% for unhealthy upstreams

This was misleading because:
1. **Caddy Admin API doesn't provide uptime statistics** - The `/reverse_proxy/upstreams` endpoint only shows current health status, not historical uptime
2. **No historical data** - We have no way to track uptime over time without implementing our own monitoring
3. **Unreliable display** - Showing fake numbers creates false expectations

## Solution

Replaced the unreliable uptime percentage with accurate current status display:

### Changes Made

1. **`src/hooks/useUpstreams.ts`**
   - Removed mock `uptime_percentage` calculation
   - Added comment explaining Caddy API limitation
   - Kept only data that Caddy actually provides

2. **`src/components/upstreams/UpstreamCard.tsx`**
   - Replaced uptime progress bar with simple status indicator
   - Shows "Operational" (green) or "Down" (red) based on current health
   - More honest representation of available data

3. **`src/components/upstreams/UpstreamDetailsDrawer.tsx`**
   - Replaced "Uptime (24h)" with "Current Status"
   - Removed misleading progress bar
   - Shows actual health state from Caddy

4. **`src/types/api.ts`**
   - Removed `uptime_percentage` field from Upstream interface
   - Added comment explaining why it's not available

## What Caddy Actually Provides

The Caddy Admin API `/reverse_proxy/upstreams` endpoint provides:
- ✅ Current health status (`healthy: true/false`)
- ✅ Number of requests served
- ✅ Current fail count
- ✅ Health check configuration
- ❌ Historical uptime percentage
- ❌ Response time metrics (we use mock data)
- ❌ Uptime tracking over time

## Before vs After

### Before (Incorrect)
```typescript
// Showing fake uptime
uptime_percentage: u.healthy ? 99.5 + Math.random() * 0.5 : 0

// UI displayed:
Uptime: 99.7% [progress bar]
```

### After (Correct)
```typescript
// Only show what we actually know
healthy: u.healthy !== undefined ? u.healthy : true

// UI displays:
Status: Operational (green) or Down (red)
```

## Future Improvements

To provide real uptime statistics, we would need to:

### Option 1: Track Client-Side
- Store health check results in browser localStorage
- Calculate uptime from stored history
- **Limitation**: Only tracks while user has page open, resets on clear data

### Option 2: Backend Tracking
- Implement separate uptime monitoring service
- Poll Caddy health endpoints regularly
- Store historical data in database (SQLite/PostgreSQL)
- Calculate uptime from stored results

### Option 3: Prometheus Integration
- If Caddy exports metrics to Prometheus (via `/metrics` endpoint)
- Query Prometheus for historical uptime data
- Display accurate long-term statistics
- **Best option** for production monitoring

### Example Backend Implementation
```go
// Track upstream health over time
type UpstreamHealthHistory struct {
    UpstreamID  string
    Timestamp   time.Time
    Healthy     bool
    ResponseTime int
}

// Calculate uptime percentage
func CalculateUptime(upstreamID string, duration time.Duration) float64 {
    // Query health history from database
    // Return percentage of time upstream was healthy
}
```

## Testing

To verify the fix:

1. ✅ Open upstreams page
2. ✅ Verify upstream cards show "Status: Operational" or "Status: Down"
3. ✅ No uptime percentage or progress bar shown
4. ✅ Details drawer shows "Current Status" instead of "Uptime (24h)"
5. ✅ Status color-coded (green/red) based on actual health

## Impact

**Benefits:**
- ✅ No misleading information shown to users
- ✅ Honest representation of available data
- ✅ Clearer understanding of what the system knows
- ✅ Sets correct expectations

**Trade-off:**
- ❌ Less detailed metrics (but they were fake anyway)
- ⚠️ If uptime tracking is needed, requires additional implementation

## Recommendation

For production monitoring of Caddy upstreams:
1. Enable Caddy metrics export: `http://localhost:2019/metrics`
2. Set up Prometheus to scrape Caddy metrics
3. Use Grafana or custom dashboard to visualize uptime
4. This provides accurate, long-term uptime statistics

---

**Status**: ✅ Fixed - Now shows only accurate data from Caddy Admin API
