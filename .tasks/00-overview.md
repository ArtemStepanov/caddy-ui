# Caddy Orchestrator Lite - Implementation Plan

## Project Goal
Create a simplified version of caddy-orchestrator focused on the core use case:
**Easily add domains and configure reverse proxies on-the-fly without touching Caddyfile.**

Target audience: Selfhosters who want a simple web UI to manage their Caddy server.

## Key Design Principles

1. **Single Caddy instance only** - no multi-instance orchestration
2. **Route-centric UI** - focus on "I want domain X to go to service Y"
3. **Minimal but complete** - include what selfhosters actually need
4. **Simple forms over raw JSON** - abstract away Caddy's JSON complexity
5. **Small codebase** - target ~2-3k LOC total

## Supported Handlers (UI)

Based on Caddy's directives and selfhosting needs:

| Handler | Use Case | UI Form |
|---------|----------|---------|
| `reverse_proxy` | Proxy to backend services | Domain, upstream, headers |
| `file_server` | Serve static files | Root path, browse toggle |
| `redir` | Redirects | From path, to URL, status code |
| `header` | Response headers | Add/set/delete headers |
| `encode` | Compression | Enable gzip/zstd toggle |
| `basic_auth` | Password protection | Username/password |

## Excluded Features (vs full version)

- Multi-instance management
- Bulk operations
- Template system with variables
- Metrics/monitoring dashboards
- Settings page (theme/language)
- Audit logging
- Config backups (keep simple auto-backup)
- Rate limiting infrastructure
- 90+ UI components

## Architecture

```
caddy-orchestrator-lite/
├── cmd/server/main.go           # Entry point (~100 lines)
├── internal/
│   ├── api/
│   │   └── handlers.go          # All handlers in one file (~300 lines)
│   ├── caddy/
│   │   └── client.go            # Caddy Admin API client (reuse)
│   ├── config/
│   │   └── builder.go           # Build Caddy JSON from routes (~200 lines)
│   └── storage/
│       └── sqlite.go            # Simple routes table (~150 lines)
├── web/                         # Frontend
│   ├── index.html
│   ├── app.js                   # Single-file React app or vanilla JS
│   └── styles.css
├── Dockerfile
└── docker-compose.yml
```

## Data Model

```sql
CREATE TABLE routes (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    handler_type TEXT NOT NULL,  -- 'reverse_proxy', 'file_server', 'redir'
    config JSON NOT NULL,        -- handler-specific config
    enabled BOOLEAN DEFAULT true,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE global_config (
    key TEXT PRIMARY KEY,
    value JSON NOT NULL
);
```

## Task Execution Order

1. **01-project-setup.md** - Create new branch, basic project structure
2. **02-backend-core.md** - Caddy client, storage, main server
3. **03-api-routes.md** - REST API for route management
4. **04-config-builder.md** - Convert routes to Caddy JSON config
5. **05-frontend-core.md** - Basic React/Preact UI shell
6. **06-reverse-proxy-form.md** - Reverse proxy handler form
7. **07-file-server-form.md** - File server handler form
8. **08-redirect-form.md** - Redirect handler form
9. **09-header-handler.md** - Header manipulation form
10. **10-basic-auth.md** - Basic auth form
11. **11-encode-compression.md** - Compression toggle
12. **12-routes-list.md** - Dashboard with routes list
13. **13-status-health.md** - Basic Caddy status indicator
14. **14-docker-deployment.md** - Dockerfile and compose
15. **15-testing-polish.md** - Final testing and cleanup

## Estimated Size

- Backend: ~800 lines Go
- Frontend: ~1500 lines (React/Preact + CSS)
- Config/Docker: ~200 lines
- **Total: ~2500 lines** (vs current ~18k)

## Frontend Technology Choice

Options:
1. **Preact + minimal CSS** - Small bundle, familiar React API
2. **Vanilla JS + HTMX** - Zero build step, server-rendered partials
3. **React + Tailwind (stripped)** - Keep current stack but minimal

Recommendation: **Preact + Tailwind** - small bundle (~10kb), familiar syntax, keeps some current patterns.
