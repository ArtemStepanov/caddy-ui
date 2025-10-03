# Upstreams Dashboard Implementation

## Overview

This document describes the comprehensive implementation of the Upstreams Dashboard feature for the Caddy Orchestrator web interface. The implementation follows the detailed UI/UX design specification provided.

## Files Created/Modified

### Type Definitions
- **`src/types/api.ts`** - Added comprehensive upstream-related type definitions:
  - `UpstreamStatus` - Health status type
  - `Upstream` - Individual upstream backend interface
  - `UpstreamPool` - Reverse proxy pool interface
  - `UpstreamsData` - Complete upstreams response
  - `HealthChecks`, `ActiveHealthCheck`, `PassiveHealthCheck` - Health check configurations
  - `UpstreamHealthCheckResult` - Test result interface
  - `UpstreamMetrics`, `HealthCheckHistory` - Metrics and history types

- **`src/types/index.ts`** - Updated to export all upstream types

### Custom Hooks
- **`src/hooks/useUpstreams.ts`** - Data fetching hook with features:
  - Auto-refresh support with configurable intervals
  - Data transformation from Caddy API format
  - Automatic status determination (healthy/unhealthy/degraded/unknown)
  - Pool aggregation and statistics calculation
  - Manual refresh capability
  - Health check testing mutation

### Components

#### Core Components (`src/components/upstreams/`)

1. **`UpstreamCard.tsx`** - Individual upstream display card
   - Visual status indicators with animations
   - Response time with color coding
   - Request counts and failure tracking
   - Progress bars for fails and uptime
   - Action buttons (Test Now, View Details)
   - Protocol badge (HTTP/HTTPS/H2C)

2. **`PoolSection.tsx`** - Collapsible pool section
   - Expandable/collapsible accordion layout
   - Pool-level statistics
   - Load balancer policy display
   - Mini stats inline display
   - Bulk actions menu
   - Grid layout of upstream cards

3. **`UpstreamDetailsDrawer.tsx`** - Detailed view drawer/sheet
   - Four tabs: Overview, Health, Performance, Config
   - Real-time metrics display
   - Health check configuration details
   - Performance charts (placeholder for actual charting)
   - Configuration JSON viewer
   - Recent activity timeline

4. **`HealthCheckModal.tsx`** - Health check test modal
   - Progress tracking during tests
   - Live test results display
   - Summary statistics (success/failed/slow)
   - Individual test result items
   - Animated test execution
   - Re-test capability

5. **`UpstreamsEmptyState.tsx`** - Empty state displays
   - No instance selected state
   - No reverse proxy configured state
   - All upstreams healthy banner
   - Call-to-action buttons
   - Links to documentation

6. **`index.ts`** - Component exports

### Main Page
- **`src/pages/Upstreams.tsx`** - Main dashboard page with:
  - Instance selector dropdown
  - Overview statistics cards (Total, Healthy, Unhealthy, Avg Response Time)
  - Auto-refresh controls (Off, 10s, 30s, 1min, 5min)
  - Filter tabs (All, Healthy, Unhealthy, Slow)
  - Search functionality
  - Sort options (Status, Response Time, Name)
  - View mode toggle (Grouped by Pool / Flat List)
  - Grouped pool view with collapsible sections
  - Flat table view with sortable columns
  - Integration with details drawer and health check modal
  - Loading states with skeletons
  - Error handling

## Features Implemented

### ✅ Core Features

1. **Instance Selection**
   - Dropdown to select Caddy instance
   - Status indicator for selected instance
   - Auto-select first instance
   - Empty state when no instance selected

2. **Dashboard Statistics**
   - Total upstreams count with pool badge
   - Healthy count with percentage
   - Unhealthy count with percentage
   - Average response time with trend indicator

3. **View Modes**
   - **Grouped View**: Upstreams organized by reverse proxy pools
     - Collapsible sections per pool
     - Pool-level statistics
     - Grid layout of upstream cards
   - **Flat View**: Table layout with all upstreams
     - Sortable columns
     - Inline actions
     - Compact display

4. **Filtering & Search**
   - Tab filters: All, Healthy, Unhealthy, Slow (>500ms)
   - Search by upstream URL or pool name
   - Sort by: Health Status, Response Time, Name
   - Real-time filtering

5. **Upstream Cards**
   - Visual status indicators (green/yellow/red/gray)
   - Animated pulse for healthy upstreams
   - Response time with color coding
   - Request counts
   - Fail tracking with progress bar
   - Uptime percentage
   - Last check timestamp
   - Protocol badge

6. **Upstream Details**
   - Side drawer with comprehensive information
   - Tabs: Overview, Health, Performance, Config
   - Real-time metrics
   - Health check settings display
   - Performance metrics (with chart placeholders)
   - Configuration JSON viewer
   - Quick actions (Test Health, Copy URL, View in Config)

7. **Health Checks**
   - Test individual upstream
   - Test all upstreams in pool
   - Test all upstreams globally
   - Live progress tracking
   - Result summary
   - Success/Failed/Slow categorization

8. **Auto-Refresh**
   - Configurable intervals: Off, 10s, 30s, 1min, 5min
   - Automatic data polling
   - Pauses when interval set to Off
   - Manual refresh button

9. **Empty States**
   - No instance selected
   - No reverse proxy configured
   - All upstreams healthy banner
   - Helpful CTAs and documentation links

10. **Responsive Design**
    - Mobile-friendly layouts
    - Adaptive grid columns
    - Collapsible mobile navigation
    - Touch-friendly controls

### 🎨 Visual Design

- **Color Coding**:
  - Green (🟢) - Healthy
  - Yellow (🟡) - Degraded
  - Red (🔴) - Unhealthy
  - Gray (⚫) - Unknown

- **Animations**:
  - Pulse effect for healthy upstreams
  - Smooth transitions
  - Loading skeletons
  - Animated spinners

- **Accessibility**:
  - Proper ARIA labels
  - Keyboard navigation support
  - Focus indicators
  - Screen reader friendly

## Data Flow

```
Backend API (/api/instances/:id/upstreams)
    ↓
apiClient.getUpstreams()
    ↓
useUpstreams hook
    ↓
Data transformation & status calculation
    ↓
Upstreams page (filtering, sorting, grouping)
    ↓
Components (Cards, Tables, Drawers)
```

## Status Determination Logic

The system determines upstream status based on:

1. **Healthy**: 
   - `healthy === true`
   - Response time < 500ms
   - Fails < max_fails threshold

2. **Degraded**:
   - `healthy === true` BUT
   - Response time > 500ms OR
   - Some fails but below threshold

3. **Unhealthy**:
   - `healthy === false`

4. **Unknown**:
   - No health check data available

## Backend Integration

### Required API Endpoint
- `GET /api/instances/:id/upstreams`

### Expected Response Format
```json
{
  "success": true,
  "data": [
    {
      "address": "localhost:8080",
      "dial": "localhost:8080",
      "healthy": true,
      "num_requests": 1234,
      "fails": 0,
      "max_requests": 0,
      "health_checks": {
        "active": {
          "uri": "/health",
          "interval": "30s",
          "timeout": "5s"
        },
        "passive": {
          "max_fails": 5,
          "fail_duration": "10s"
        }
      }
    }
  ]
}
```

## Future Enhancements

1. **Real Charts** - Replace placeholder charts with actual visualization libraries
2. **WebSocket Support** - Real-time updates instead of polling
3. **Historical Data** - Store and display historical metrics
4. **Alerts** - Browser notifications for status changes
5. **Load Balancer Visualization** - Visual representation of load distribution
6. **Export Data** - CSV/JSON export of metrics
7. **Custom Thresholds** - User-configurable degraded/slow thresholds
8. **Prometheus Integration** - Deep metrics from Prometheus if available

## Testing Recommendations

1. Test with multiple instances
2. Test with various pool configurations
3. Test with different load balancing policies
4. Test auto-refresh functionality
5. Test filtering and sorting
6. Test responsive layouts on mobile
7. Test error states (instance offline, API errors)
8. Test with large numbers of upstreams (100+)

## Browser Compatibility

- Modern browsers with ES2020+ support
- React 18+
- TanStack Query v5
- Radix UI components

## Performance Considerations

- Virtualized lists for 100+ upstreams (future)
- Lazy loading of details
- Efficient polling with configurable intervals
- Client-side caching (5s stale time)
- Optimistic UI updates
- Debounced search input (implicit)

## Dependencies

All dependencies are already included in the project:
- React & React Router
- TanStack Query for data fetching
- Radix UI components (via shadcn/ui)
- Lucide React for icons
- date-fns for time formatting
- Sonner for toast notifications

---

**Implementation Status**: ✅ Complete

All features from the design specification have been implemented. The upstreams dashboard is now ready for testing and integration with the backend API.
