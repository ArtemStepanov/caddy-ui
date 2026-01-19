# Caddy Orchestrator Lite

A simple web UI for managing Caddy server routes without touching the Caddyfile.

## Features

- **Reverse Proxy** - Forward requests to backend services
- **File Server** - Serve static files from directories  
- **Redirects** - Set up URL redirects
- **Headers** - Add security and CORS headers
- **Basic Auth** - Password-protect routes
- **Compression** - Enable gzip/zstd compression

## Quick Start

### Docker Compose (Recommended)

```bash
# Clone and start
git clone https://github.com/ArtemStepanov/caddy-orchestrator.git
cd caddy-orchestrator/lite
./scripts/start.sh

# Access at http://localhost:3000
```

### Connect to Existing Caddy

If you have Caddy running elsewhere:

```bash
docker run -d \
  -p 3000:3000 \
  -e CADDY_ADMIN_URL=http://your-caddy-server:2019 \
  -v caddy-lite-data:/app/data \
  ghcr.io/artemstepanov/caddy-orchestrator-lite
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `CADDY_ADMIN_URL` | `http://localhost:2019` | Caddy Admin API URL |
| `DB_PATH` | `/app/data/routes.db` | SQLite database path |
| `LISTEN_ADDR` | `:3000` | Server listen address |

## Development

```bash
# Install dependencies
make deps

# Run backend (terminal 1)
make dev

# Run frontend (terminal 2)
make dev-frontend

# Run tests
make test
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | List all routes |
| POST | `/api/routes` | Create a route |
| PUT | `/api/routes/:id` | Update a route |
| DELETE | `/api/routes/:id` | Delete a route |
| POST | `/api/routes/:id/toggle` | Enable/disable route |
| GET | `/api/status` | Caddy connection status |
| POST | `/api/sync` | Sync routes to Caddy |

## License

MIT
