# Task 14: Docker Deployment

## Objective
Create Dockerfile and docker-compose for production deployment.

## Prerequisites
- All previous tasks completed
- Backend and frontend working

## Deployment Goals
- Single container with frontend + backend
- Small image size (~30-50MB)
- SQLite data persistence via volume
- Environment variable configuration
- Health check endpoint

## Steps

### 14.1 Create Dockerfile

```dockerfile
# Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/web

# Install dependencies
COPY web/package*.json ./
RUN npm ci

# Build
COPY web/ ./
RUN npm run build

# Build backend
FROM golang:1.21-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY cmd/ cmd/
COPY internal/ internal/
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o caddy-orchestrator ./cmd/server

# Final image
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache ca-certificates sqlite-libs tzdata

WORKDIR /app

# Copy binary
COPY --from=backend-builder /app/caddy-orchestrator .

# Copy frontend
COPY --from=frontend-builder /app/web/dist ./web/dist

# Create data directory
RUN mkdir -p /app/data

# Environment variables
ENV GIN_MODE=release
ENV DB_PATH=/app/data/routes.db
ENV CADDY_ADMIN_URL=http://localhost:2019
ENV LISTEN_ADDR=:3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/status || exit 1

# Run
CMD ["./caddy-orchestrator"]
```

### 14.2 Create .dockerignore

```
# Dependencies
node_modules/
vendor/

# Build outputs
dist/
web/dist/
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test files
*_test.go
*.test

# IDE
.idea/
.vscode/
*.swp
*.swo

# Git
.git/
.gitignore

# Docker
Dockerfile*
docker-compose*.yml
.docker/

# Misc
*.md
*.log
.env*
.tasks/
docs/
scripts/
```

### 14.3 Create docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  # Caddy Orchestrator Lite
  orchestrator:
    build: .
    ports:
      - "3000:3000"
    environment:
      - CADDY_ADMIN_URL=http://caddy:2019
      - DB_PATH=/app/data/routes.db
    volumes:
      - orchestrator-data:/app/data
    depends_on:
      - caddy
    restart: unless-stopped

  # Test Caddy instance
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
      - "2019:2019"
    volumes:
      - caddy-data:/data
      - caddy-config:/config
    command: caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
    configs:
      - source: caddyfile
        target: /etc/caddy/Caddyfile
    restart: unless-stopped

configs:
  caddyfile:
    content: |
      {
        admin 0.0.0.0:2019
      }

volumes:
  orchestrator-data:
  caddy-data:
  caddy-config:
```

### 14.4 Create docker-compose.prod.yml

```yaml
version: '3.8'

services:
  orchestrator:
    image: ghcr.io/artemstepanov/caddy-orchestrator-lite:latest
    # Or build locally:
    # build: .
    ports:
      - "3000:3000"
    environment:
      - CADDY_ADMIN_URL=${CADDY_ADMIN_URL:-http://localhost:2019}
      - DB_PATH=/app/data/routes.db
      - GIN_MODE=release
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

# For external Caddy, set CADDY_ADMIN_URL environment variable
# Example: CADDY_ADMIN_URL=http://192.168.1.100:2019 docker-compose -f docker-compose.prod.yml up -d
```

### 14.5 Create Quick Start Script (`scripts/start.sh`)

```bash
#!/bin/bash

set -e

echo "🚀 Starting Caddy Orchestrator Lite..."

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Create data directory
mkdir -p data

# Build and start
docker compose up -d --build

echo ""
echo "✅ Caddy Orchestrator Lite is starting..."
echo ""
echo "🌐 Access the UI at: http://localhost:3000"
echo "📊 Caddy Admin API: http://localhost:2019"
echo ""
echo "📝 View logs: docker compose logs -f"
echo "🛑 Stop: docker compose down"
```

### 14.6 Create Makefile

```makefile
.PHONY: all build run dev docker clean test

# Build all
all: build

# Build backend
build:
	CGO_ENABLED=1 go build -o bin/caddy-orchestrator ./cmd/server

# Build frontend
frontend:
	cd web && npm install && npm run build

# Run locally (development)
dev:
	go run ./cmd/server

# Run frontend dev server
dev-frontend:
	cd web && npm run dev

# Build Docker image
docker:
	docker build -t caddy-orchestrator-lite .

# Run with Docker Compose
docker-up:
	docker compose up -d --build

# Stop Docker Compose
docker-down:
	docker compose down

# View logs
logs:
	docker compose logs -f

# Run tests
test:
	go test ./...
	cd web && npm test

# Clean build artifacts
clean:
	rm -rf bin/
	rm -rf web/dist/
	rm -rf web/node_modules/

# Install dependencies
deps:
	go mod download
	cd web && npm install
```

### 14.7 Update README for Lite Version

Create a new `README.md`:

```markdown
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
git clone https://github.com/ArtemStepanov/caddy-orchestrator-lite.git
cd caddy-orchestrator-lite
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
```

## Verification
- [ ] Docker build completes successfully
- [ ] Image size is under 50MB
- [ ] docker-compose up starts all services
- [ ] Application accessible at localhost:3000
- [ ] Caddy accessible at localhost:2019
- [ ] Data persists after container restart
- [ ] Health check passes
- [ ] Environment variables work correctly

## Files Created
- `Dockerfile`
- `.dockerignore`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `scripts/start.sh`
- `Makefile`
- `README.md`

## Estimated Time
1-2 hours
