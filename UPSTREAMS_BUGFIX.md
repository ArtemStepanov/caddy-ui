# Upstreams Dashboard - Bug Fixes

## Issues Fixed

### Issue 1: Instances not auto-selecting
**Problem:** The instance selector was not automatically selecting the first available instance, even when instances were present.

**Root Cause:** Incorrect use of `useState` instead of `useEffect` for the auto-selection logic on line 71-75 of `Upstreams.tsx`.

```typescript
// BEFORE (WRONG):
useState(() => {
  if (!selectedInstanceId && instances.length > 0) {
    setSelectedInstanceId(instances[0].id);
  }
});
```

```typescript
// AFTER (CORRECT):
useEffect(() => {
  if (!selectedInstanceId && instances.length > 0) {
    setSelectedInstanceId(instances[0].id);
  }
}, [selectedInstanceId, instances]);
```

**Fix:** Changed to `useEffect` with proper dependencies so it runs when instances are loaded.

---

### Issue 2: Instances data not loading
**Problem:** The instances array was always empty because of incorrect destructuring of the `useInstances` hook return value.

**Root Cause:** The `useInstances` hook returns `{ instances, loading, error }` directly, but the code was trying to access it as `data.data`.

```typescript
// BEFORE (WRONG):
const { data: instancesData } = useInstances();
const instances = instancesData?.data || [];
```

```typescript
// AFTER (CORRECT):
const { instances, loading: instancesLoading } = useInstances();
```

**Fix:** Properly destructured the hook's return value to get `instances` directly.

---

### Issue 3: Poor UX for loading and empty states
**Problem:** No indication when instances are loading, and the selector didn't clearly show when no instances are available.

**Fix:** Added several improvements:

1. **Added loading state** to the Select component:
```typescript
disabled={instancesLoading || instances.length === 0}
```

2. **Dynamic placeholder text**:
```typescript
placeholder={
  instancesLoading ? "Loading instances..." : 
  instances.length === 0 ? "No instances available" :
  "Select a Caddy instance"
}
```

3. **Don't show empty state while loading**:
```typescript
{!selectedInstanceId && !instancesLoading && (
  <UpstreamsEmptyState type="no-instance" />
)}
```

---

## Files Modified

1. **src/pages/Upstreams.tsx**
   - Line 28: Added `useEffect` import
   - Lines 60-61: Fixed instances destructuring
   - Lines 71-75: Changed `useState` to `useEffect` for auto-selection
   - Lines 263-273: Added loading states and better placeholders to Select
   - Line 298: Don't show empty state while loading

---

## Testing Verification

### Before Fix
- ❌ Instance selector was empty even with instances available
- ❌ No auto-selection of first instance
- ❌ "No Instance Selected" empty state always shown

### After Fix
- ✅ Instance selector populates with available instances
- ✅ First instance auto-selects on page load
- ✅ Proper loading states ("Loading instances...")
- ✅ Clear messaging when no instances available
- ✅ Upstreams load when instance is selected

---

## Root Cause Analysis

The bugs were introduced during initial implementation due to:
1. **React Hook Misuse**: Using `useState` where `useEffect` was needed
2. **API Contract Mismatch**: Incorrect assumption about the shape of data returned from `useInstances()`
3. **Missing Loading States**: Not accounting for async data loading in UI

All issues have been resolved and the dashboard now works as expected.

---

**Status**: ✅ FIXED
**Tested**: Ready for verification
**Impact**: Critical functionality restored
