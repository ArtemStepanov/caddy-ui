# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Caddy Admin UI is a web UI for managing Caddy server routes without manually editing the Caddyfile. It provides CRUD operations for reverse proxies, file servers, and redirects, with real-time sync to Caddy's Admin API.

## Build & Development Commands

### Prerequisites

Tool versions are pinned in `mise.toml`: Go 1.25.6, Node.js 25.3.0, Zig 0.15.2.

### Common Commands

| Command | Purpose |
|---------|---------|
| `make build` | Build backend (uses Zig as C compiler for CGO/SQLite) |
| `make frontend` | Install deps and build frontend |
| `make dev` | Run backend dev server (`go run ./cmd/server`) |
| `make dev-frontend` | Run frontend dev server with HMR (`cd web && npm run dev`) |
| `make test` | Run all tests (Go + frontend coverage) |
| `make docker-up` / `make docker-down` | Start/stop Docker Compose stack |

### Running Individual Tests

**Go (backend):**
```sh
go test -v -race ./internal/api/...
go test -v -race ./internal/config/...
go test -v -race ./internal/storage/...
```

**Frontend:**
```sh
cd web && npx vitest run              # all tests
cd web && npx vitest run StatusBadge  # single test file by name
cd web && npm run lint                # ESLint
cd web && npx tsc --noEmit            # type-check only
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `CADDY_ADMIN_URL` | `http://localhost:2019` | Caddy Admin API endpoint |
| `DB_PATH` | `/app/data/routes.db` | SQLite database path |
| `LISTEN_ADDR` | `:3000` | Server listen address |
| `GIN_MODE` | `debug` | Gin framework mode |
| `WEB_DIR` | `./web/dist` | Frontend static files directory |

## Architecture

```
Frontend (Preact/TS)  ──/api/*──►  Go Backend (Gin)  ──HTTP──►  Caddy Admin API
                                       │
                                   SQLite DB
```

### Backend (`internal/`)

- **`api/`** — HTTP handlers and route definitions. All mutation endpoints (create/update/delete/toggle) auto-sync to Caddy after persisting to SQLite. Sync failures return warnings but don't fail the request.
- **`config/builder.go`** — Converts internal Route models into Caddy JSON config. Separate builder functions per handler type (reverse_proxy, file_server, redir). Injects encode middleware globally when enabled.
- **`config/parser.go`** — Parses Caddy JSON config back into internal Route models for the import feature.
- **`caddy/client.go`** — HTTP client for Caddy's Admin API (health, get/load/set config).
- **`storage/`** — SQLite persistence layer with models. Routes store handler-specific config as `json.RawMessage` blobs. `RawCaddyRoute` field preserves unknown handlers during round-trip sync to prevent data loss.

### Frontend (`web/src/`)

- **`pages/`** — Dashboard (route list), RouteForm (create/edit), Settings (global config)
- **`lib/api.ts`** — TypeScript API client matching backend endpoints
- **`components/`** — Layout, StatusBadge, Toast, HeaderEditor

### Key Design Decisions

1. **Raw route preservation**: Unknown Caddy handler types are stored in `RawCaddyRoute` and merged back during export, preventing data loss on round-trip.
2. **Dynamic Caddy URL**: Configurable at runtime via GlobalConfig (stored in DB), falling back to `CADDY_ADMIN_URL` env var.
3. **CGO required**: SQLite driver (`mattn/go-sqlite3`) requires CGO. The build uses Zig as the C compiler (`CC="zig cc"`).
4. **Preact over React**: Chosen for minimal bundle size with the same component model.

## API Endpoints

- `GET/POST /api/routes`, `GET/PUT/DELETE /api/routes/:id`, `POST /api/routes/:id/toggle`
- `GET/PUT /api/config` — Global configuration
- `GET /api/status`, `POST /api/sync`, `POST /api/test-connection`
- `POST /api/import-preview`, `POST /api/import` — Import from running Caddy instance
