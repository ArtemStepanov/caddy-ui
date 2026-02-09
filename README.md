# Caddy Orchestrator Lite

A lightweight web UI for managing [Caddy](https://caddyserver.com/) routes without editing the Caddyfile. Create, update, and delete reverse proxies, file servers, and redirects — synced to Caddy's Admin API in real time.

## Features

- **Reverse Proxy** — forward requests to backend services
- **File Server** — serve static files from directories
- **Redirects** — set up URL redirects
- **Headers** — add security and CORS headers
- **Basic Auth** — password-protect routes
- **Compression** — enable gzip/zstd encoding
- **Import** — pull existing routes from a running Caddy instance

## Quick Start

### Docker Compose

```bash
git clone https://github.com/ArtemStepanov/caddy-orchestrator.git
cd caddy-orchestrator
docker compose up -d --build
# UI at http://localhost:3000
```

This starts the orchestrator alongside a test Caddy instance with the admin API enabled.

### Connect to an Existing Caddy Instance

Use the production compose file to connect to a Caddy server running elsewhere:

```bash
CADDY_ADMIN_URL=http://your-caddy:2019 docker compose -f docker-compose.prod.yml up -d
```

Or run the container directly:

```bash
docker run -d \
  -p 3000:3000 \
  -e CADDY_ADMIN_URL=http://your-caddy:2019 \
  -v caddy-orchestrator-data:/app/data \
  ghcr.io/artemstepanov/caddy-orchestrator-lite
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CADDY_ADMIN_URL` | `http://localhost:2019` | Caddy Admin API URL |
| `DB_PATH` | `/app/data/routes.db` | SQLite database path |
| `LISTEN_ADDR` | `:3000` | Server listen address |
| `GIN_MODE` | `debug` | Gin mode (`debug` / `release`) |

The Caddy URL can also be changed at runtime from the Settings page.

## Development

Tooling versions are pinned in `mise.toml` (Go, Node.js, Zig).

```bash
make deps            # install Go + JS dependencies
make dev             # run backend dev server
make dev-frontend    # run frontend dev server with HMR
make test            # run all tests
make build           # build backend binary (requires Zig for CGO/SQLite)
make frontend        # build frontend
```

## Architecture

```
Preact/TypeScript UI  ──/api/*──►  Go backend (Gin)  ──HTTP──►  Caddy Admin API
                                        │
                                    SQLite DB
```

- **Backend** (`internal/`) — Go with Gin. Routes are stored in SQLite and synced to Caddy on every mutation.
- **Frontend** (`web/`) — Preact + TypeScript. Minimal bundle, same React component model.
- **SQLite** via `mattn/go-sqlite3` (requires CGO, built with Zig as C compiler).

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/routes` | List all routes |
| `POST` | `/api/routes` | Create a route |
| `GET` | `/api/routes/:id` | Get a route |
| `PUT` | `/api/routes/:id` | Update a route |
| `DELETE` | `/api/routes/:id` | Delete a route |
| `POST` | `/api/routes/:id/toggle` | Enable/disable a route |
| `GET/PUT` | `/api/config` | Global configuration |
| `GET` | `/api/status` | Caddy connection status |
| `POST` | `/api/sync` | Sync all routes to Caddy |
| `POST` | `/api/import-preview` | Preview import from Caddy |
| `POST` | `/api/import` | Import routes from Caddy |

## License

MIT
