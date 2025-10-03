# Debugging Guide: "Test Now" and "View Details" Buttons Not Working

## Changes Made

I've added console logging throughout the click event chain to help diagnose the issue.

### Files Modified:

1. **src/pages/Upstreams.tsx**
   - Added logging to `handleViewDetails()` 
   - Added logging to `handleTestHealth()`

2. **src/components/upstreams/UpstreamCard.tsx**
   - Added logging to button onClick handlers
   - Added `e.stopPropagation()` to prevent event bubbling issues

3. **src/components/upstreams/UpstreamDetailsDrawer.tsx**
   - Added logging to track when drawer renders and with what props

4. **src/components/upstreams/HealthCheckModal.tsx**
   - Added logging to track when modal renders and with what props

## How to Debug

### Step 1: Open Browser Console
1. Navigate to `/upstreams` page
2. Open browser developer tools (F12)
3. Go to the Console tab
4. Clear any existing logs

### Step 2: Click "Test Now" Button
Click the "Test Now" button on any upstream card and observe the console output.

**Expected console output:**
```
Test Now button clicked for: localhost:8080
handleTestHealth called with: {address: "localhost:8080", ...}
HealthCheckModal render - open: true, upstreams count: 1
```

### Step 3: Click "View Details" Button  
Click the "View Details" button on any upstream card.

**Expected console output:**
```
View Details button clicked for: localhost:8080
handleViewDetails called with: {address: "localhost:8080", ...}
UpstreamDetailsDrawer render - open: true, upstream: localhost:8080
```

## Possible Issues and Solutions

### Issue 1: No Console Logs at All
**Symptom:** Clicking buttons produces no console output

**Possible Causes:**
- JavaScript error preventing code execution
- Buttons are being overlapped by another element
- Event listener not attached

**Solution:**
- Check for JavaScript errors in console (red text)
- Use browser inspector to verify button elements are clickable
- Check z-index and pointer-events CSS

### Issue 2: Button Click Logged But Handler Not Called
**Symptom:** See "Test Now button clicked" but not "handleTestHealth called"

**Possible Causes:**
- The `onTestHealth` prop is undefined or not a function
- There's an error in the callback function

**Solution:**
- Check if PoolSection is receiving the handlers properly
- Verify the function signatures match

### Issue 3: Handler Called But Modal/Drawer Doesn't Open
**Symptom:** See "handleTestHealth called" but not "HealthCheckModal render"

**Possible Causes:**
- State update not triggering re-render
- Modal/Drawer component not mounted in DOM
- React rendering issue

**Solution:**
- Check React DevTools to see state values
- Verify modal/drawer is in the component tree
- Check for conditional rendering that might prevent display

### Issue 4: Modal/Drawer Renders But Not Visible
**Symptom:** See "Modal render - open: true" but don't see modal on screen

**Possible Causes:**
- CSS z-index issues
- Modal backdrop or content has display: none
- Portal rendering issue with Radix UI

**Solution:**
- Inspect element in DevTools to check CSS
- Check if Dialog/Sheet components are properly imported
- Verify Radix UI components are working

## Quick Fixes to Try

### Fix 1: Verify Button Props
Check that buttons aren't disabled:
```tsx
<Button
  variant="outline"
  size="sm"
  className="flex-1"
  disabled={false}  // Add this explicitly
  onClick={...}
>
```

### Fix 2: Check Event Propagation
The buttons now have `e.stopPropagation()` but you can also try:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onTestHealth(upstream);
}}
```

### Fix 3: Force Modal Open
Temporarily hardcode the modal to always be open to verify it renders:
```tsx
<HealthCheckModal
  open={true}  // Change from healthCheckModalOpen
  ...
/>
```

### Fix 4: Check for CSS Issues
Inspect the card/buttons in DevTools and verify:
- `pointer-events` is not set to `none`
- No element with higher `z-index` is covering buttons
- Buttons have proper hit area (padding/size)

## Common Culprits

1. **Radix UI Dialog/Sheet not properly configured** - Check if you have the required providers
2. **Missing TooltipProvider** - Can break Radix components
3. **CSS from shadcn/ui** - Might have conflicting styles
4. **Event bubbling** - Fixed by adding `e.stopPropagation()`
5. **TypeScript errors** - Check build output for any errors

## Next Steps

After reviewing console logs, report back with:
1. Which log statements you see
2. Any error messages (red text in console)
3. Screenshot of browser DevTools showing the console output

This will help pinpoint exactly where the issue is occurring.
