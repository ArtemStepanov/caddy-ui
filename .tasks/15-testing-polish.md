# Task 15: Testing and Polish

## Objective
Final testing, bug fixes, and polish before release.

## Prerequisites
- All previous tasks completed
- Application running locally

## Areas to Test

### 15.1 End-to-End Route Testing

Test each route type works correctly:

```bash
# 1. Start the stack
docker compose up -d

# 2. Create a reverse proxy route via API
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "test.localhost",
    "handler_type": "reverse_proxy",
    "config": {"upstreams": ["httpbin.org:80"]}
  }'

# 3. Verify the route was synced to Caddy
curl http://localhost:2019/config/apps/http/servers

# 4. Test the route works (add test.localhost to /etc/hosts first)
curl -H "Host: test.localhost" http://localhost/get
```

### 15.2 UI Testing Checklist

**Dashboard:**
- [ ] Routes list loads correctly
- [ ] Empty state shows when no routes
- [ ] Filter by domain works
- [ ] Filter by type works
- [ ] Enable/disable toggle works
- [ ] Delete with confirmation works
- [ ] Sync button works

**Route Form:**
- [ ] Create new reverse proxy route
- [ ] Create new file server route
- [ ] Create new redirect route
- [ ] Edit existing route
- [ ] Form validation (required fields)
- [ ] Cancel returns to dashboard

**Settings:**
- [ ] Caddy URL saved correctly
- [ ] Compression toggle works
- [ ] Test connection button works
- [ ] Settings persist after refresh

**Status:**
- [ ] Online status shows when connected
- [ ] Offline status shows when disconnected
- [ ] Latency displayed correctly
- [ ] Auto-refresh works

### 15.3 Error Handling

Test error scenarios:
- [ ] Invalid Caddy URL shows error
- [ ] Failed sync shows error message
- [ ] API errors display properly
- [ ] Network errors handled gracefully

### 15.4 Mobile Responsiveness

Test on mobile viewport:
- [ ] Navigation works
- [ ] Forms are usable
- [ ] Route cards display correctly
- [ ] Buttons are tappable

### 15.5 Code Cleanup

**Backend:**
```go
// Add request validation helper
func validateRequired(c *gin.Context, fields map[string]string) bool {
    for field, value := range fields {
        if value == "" {
            c.JSON(http.StatusBadRequest, gin.H{
                "error": fmt.Sprintf("%s is required", field),
            })
            return false
        }
    }
    return true
}

// Add consistent error responses
type ErrorResponse struct {
    Error   string `json:"error"`
    Details string `json:"details,omitempty"`
}

func respondError(c *gin.Context, status int, message string) {
    c.JSON(status, ErrorResponse{Error: message})
}
```

**Frontend:**
```tsx
// Add loading spinner component
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  return (
    <div class={`${sizes[size]} animate-spin rounded-full border-2 border-slate-600 border-t-primary-500`} />
  );
}

// Add toast notifications
export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div class={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
      type === 'error' ? 'bg-red-600' : 'bg-green-600'
    } text-white`}>
      {message}
    </div>
  );
}
```

### 15.6 Performance Checks

- [ ] Frontend bundle size < 100KB gzipped
- [ ] API responses < 100ms
- [ ] Docker image < 50MB
- [ ] Memory usage reasonable (< 50MB)

Check bundle size:
```bash
cd web
npm run build
du -sh dist/
# Should be under 500KB total, < 100KB gzipped
```

### 15.7 Security Review

- [ ] No secrets in code
- [ ] Passwords hashed before storage
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)

### 15.8 Documentation Updates

Verify all documentation is accurate:
- [ ] README has correct setup instructions
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Docker instructions work

### 15.9 Pre-Release Checklist

```bash
# 1. Run all tests
make test

# 2. Build and verify Docker image
docker build -t caddy-orchestrator-lite .
docker images caddy-orchestrator-lite  # Check size

# 3. Test fresh deployment
docker compose down -v  # Remove volumes
docker compose up -d --build
# Wait and test manually

# 4. Check logs for errors
docker compose logs

# 5. Verify data persistence
# Create a route, restart containers, verify route still exists
```

### 15.10 Known Issues to Document

Create `KNOWN_ISSUES.md`:

```markdown
# Known Issues

## Current Limitations

1. **Single Caddy Instance Only**
   - This lite version only supports managing one Caddy server
   - For multi-instance management, use the full version

2. **No Authentication**
   - The management UI has no authentication
   - Secure it behind a reverse proxy with auth, or bind to localhost only

3. **Basic Auth Password Display**
   - Once a password is hashed, it cannot be retrieved
   - To change a user's password, delete and re-add them

4. **No Real-time Updates**
   - Dashboard doesn't auto-refresh route status
   - Click "Sync to Caddy" to ensure changes are applied

## Planned Improvements

- [ ] Add simple UI authentication
- [ ] Auto-sync on route changes
- [ ] Import/export routes
- [ ] Caddyfile format support
```

## Final Deliverables

After completing this task, the project should have:

- Working Docker image
- Documented API
- Tested routes (reverse proxy, file server, redirect)
- Working header manipulation
- Working basic auth
- Working compression toggle
- Clean, responsive UI
- Health monitoring
- Data persistence

## Estimated Time
2-4 hours

---

## Summary

After completing all 15 tasks, you'll have:

| Metric | Full Version | Lite Version |
|--------|-------------|--------------|
| Lines of Code | ~18,000 | ~2,500 |
| Components | 90+ | ~15 |
| Features | Multi-instance, templates, metrics, audit logs | Single instance, routes only |
| Docker Image | ~50MB | ~30MB |
| Dependencies | Many | Minimal |
| Setup Time | Minutes | Seconds |

The lite version is focused, simple, and does exactly what you originally wanted:
**Add domains and reverse proxies on the fly without touching Caddyfile.**
