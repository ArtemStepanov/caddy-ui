# Upstreams Dashboard - Testing Checklist

## Pre-Testing Setup

- [ ] Backend API is running and accessible
- [ ] At least one Caddy instance is configured
- [ ] Instance has reverse_proxy configuration with upstreams
- [ ] Dependencies installed: `npm install` or `bun install`
- [ ] Development server running: `npm run dev`

## Feature Testing

### 1. Dashboard Loading
- [ ] Page loads without errors
- [ ] Loading skeleton appears while fetching data
- [ ] Data loads successfully
- [ ] No console errors

### 2. Instance Selection
- [ ] Dropdown shows all available instances
- [ ] Can select different instances
- [ ] Status badge shows correct instance status
- [ ] Data refreshes when changing instance
- [ ] Empty state shows when no instance selected

### 3. Statistics Cards
- [ ] Total Upstreams count is correct
- [ ] Healthy count matches actual healthy upstreams
- [ ] Unhealthy count is accurate
- [ ] Average response time is calculated correctly
- [ ] Cards display icons and badges properly

### 4. View Modes
**Grouped View:**
- [ ] Pools are displayed as collapsible sections
- [ ] Pool headers show correct statistics
- [ ] Can expand/collapse pool sections
- [ ] Upstreams cards display in grid layout
- [ ] Pool actions dropdown works

**Flat View:**
- [ ] All upstreams shown in table format
- [ ] Table columns display correct data
- [ ] Can click rows to view details
- [ ] Actions column works

### 5. Filtering
- [ ] "All" tab shows all upstreams
- [ ] "Healthy" tab filters to healthy only
- [ ] "Unhealthy" tab filters to unhealthy only
- [ ] "Slow" tab shows upstreams >500ms
- [ ] Badge counts are accurate

### 6. Search
- [ ] Can search by upstream URL
- [ ] Can search by pool name
- [ ] Search filters results in real-time
- [ ] Clear search shows all results
- [ ] Search is case-insensitive

### 7. Sorting
- [ ] "Sort by Health Status" orders correctly (unhealthy first)
- [ ] "Sort by Response Time" orders by latency
- [ ] "Sort by Name" alphabetizes URLs
- [ ] Sorting persists across view mode changes

### 8. Upstream Cards
- [ ] Status indicator shows correct color
- [ ] Healthy upstreams have pulse animation
- [ ] Protocol badge displays (HTTP/HTTPS/H2C)
- [ ] Response time shows with color coding:
  - Green: <100ms
  - Yellow: 100-500ms
  - Red: >500ms
- [ ] Request count displays
- [ ] Fails progress bar shows correctly
- [ ] Uptime percentage displays
- [ ] Last check time uses relative format ("5 seconds ago")
- [ ] "Test Now" button works
- [ ] "View Details" button opens drawer

### 9. Details Drawer
**Overview Tab:**
- [ ] Status card shows current status
- [ ] Uptime percentage with progress bar
- [ ] Last check timestamp
- [ ] Real-time metrics display
- [ ] Recent activity log shows events

**Health Checks Tab:**
- [ ] Active health check settings display
- [ ] Passive health check settings display
- [ ] Shows "No health checks configured" when none exist

**Performance Tab:**
- [ ] Chart placeholder displays
- [ ] Latency percentiles table shows
- [ ] P50, P75, P90, P99 values calculated

**Config Tab:**
- [ ] JSON configuration displays
- [ ] Proper syntax highlighting
- [ ] "Edit in Configuration" button present

**General:**
- [ ] Drawer opens smoothly
- [ ] Can close drawer with X or background click
- [ ] Top action buttons work (Test Health, Copy URL)
- [ ] Tabs switch without issues
- [ ] Drawer scrolls when content is long

### 10. Health Check Modal
- [ ] Opens when clicking "Health Check" button
- [ ] Shows progress bar during testing
- [ ] Individual upstream tests appear in real-time
- [ ] Loading spinner shows while testing
- [ ] Results categorized: Success, Failed, Slow
- [ ] Summary statistics display correctly
- [ ] "Test Again" button works
- [ ] Can close modal
- [ ] Data refreshes after test complete

### 11. Auto-Refresh
- [ ] Dropdown shows all intervals (Off, 10s, 30s, 1min, 5min)
- [ ] Selecting interval starts auto-refresh
- [ ] Data updates at correct intervals
- [ ] Selecting "Off" stops auto-refresh
- [ ] Live indicator shows when auto-refresh is active

### 12. Manual Refresh
- [ ] "Refresh All" button triggers data reload
- [ ] Loading spinner shows during refresh
- [ ] Toast notification appears
- [ ] Data updates after refresh

### 13. Empty States
- [ ] "No instance selected" shows when appropriate
- [ ] "No reverse proxy configured" shows with correct CTAs
- [ ] "All healthy" banner shows when all upstreams are healthy
- [ ] Links to Configuration and docs work
- [ ] Can dismiss "All healthy" banner

### 14. Error Handling
- [ ] Shows error message if API call fails
- [ ] Error state is user-friendly
- [ ] Can retry after error
- [ ] Network errors handled gracefully

### 15. Responsive Design
**Desktop (>1024px):**
- [ ] Stats cards in 4-column grid
- [ ] Upstream cards in 3-column grid
- [ ] All controls visible
- [ ] Drawer opens on right side

**Tablet (768-1024px):**
- [ ] Stats cards in 2-column grid
- [ ] Upstream cards in 2-column grid
- [ ] Controls adapt appropriately

**Mobile (<768px):**
- [ ] Stats cards stack vertically
- [ ] Upstream cards in single column
- [ ] Drawer takes full screen
- [ ] Touch targets are adequate
- [ ] Horizontal scroll avoided

### 16. Performance
- [ ] Initial load is fast (<2s)
- [ ] Filtering is instant
- [ ] Sorting is smooth
- [ ] No lag when switching views
- [ ] Auto-refresh doesn't cause jank
- [ ] Handles 20+ upstreams smoothly

### 17. Accessibility
- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Screen reader announces status changes
- [ ] Color is not the only status indicator
- [ ] Buttons have proper labels

### 18. Data Accuracy
- [ ] Status determination is correct
- [ ] Calculations match actual data
- [ ] Pool aggregation is accurate
- [ ] Response times are realistic
- [ ] Fail counts are tracked correctly

## Integration Testing

- [ ] Works with real Caddy Admin API
- [ ] Handles Caddy API errors gracefully
- [ ] Parses Caddy response format correctly
- [ ] Works with multiple instances
- [ ] Instance switching preserves settings
- [ ] Works with different reverse_proxy configurations

## Browser Testing

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Android)

## Edge Cases

- [ ] No upstreams configured
- [ ] Single upstream
- [ ] 100+ upstreams (performance)
- [ ] All upstreams unhealthy
- [ ] Extremely slow API response
- [ ] API timeout
- [ ] Invalid instance ID
- [ ] Instance goes offline during refresh

## Known Limitations

1. **Mock Response Times**: Currently generates random response times (20-220ms) since this data isn't in the Caddy API response. Backend integration needed.

2. **Charts**: Performance tab shows placeholder for charts. Actual charting library integration needed.

3. **Pool Detection**: Currently groups all upstreams into a single "Default Pool". Needs parsing of reverse_proxy configuration to detect actual pools.

4. **WebSocket**: Uses polling for auto-refresh. WebSocket implementation would be more efficient.

5. **Historical Data**: No historical metrics storage. Shows only current state.

## Sign-off

- [ ] All critical features tested and working
- [ ] No blocking bugs found
- [ ] Performance is acceptable
- [ ] UI/UX matches design spec
- [ ] Ready for production deployment

**Tested by:** _______________
**Date:** _______________
**Notes:** _______________
