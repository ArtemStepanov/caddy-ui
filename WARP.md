# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Caddy Orchestrator is a web-based management interface for multiple Caddy server instances. It consists of a Go backend and React frontend, unified in a single Docker container (~50MB Alpine-based image). The application provides centralized control over multiple Caddy servers through their Admin API.

**Key Design Philosophy**: Single-container architecture where the Go backend serves both the API and static frontend files, eliminating the need for a separate web server.

## Common Development Commands

### Backend Development

```bash
# Run backend server (starts on port 3000)
go run cmd/server/main.go

# Run backend with hot reload (requires 'air' tool)
air

# Build backend binary
CGO_ENABLED=1 go build -o caddy-orchestrator ./cmd/server

# Run all tests with verbose output
go test -v ./...

# Run tests with coverage report
go test -v -coverprofile=coverage.out -covermode=atomic ./...
go tool cover -html=coverage.out -o coverage.html

# Run tests with race detection
go test -v -race ./...

# Run single test function
go test -v ./internal/storage -run TestFunctionName

# Format code
go fmt ./...

# Tidy dependencies
go mod tidy
```

### Frontend Development

```bash
# Run frontend dev server with hot reload (starts on port 8080)
npm run dev

# Build frontend for production
npm run build

# Build frontend in development mode
npm run build:dev

# Run linter
npm run lint

# TypeScript type checking
npx tsc --noEmit

# Preview production build
npm run preview
```

### Linting

```bash
# Run Go linter (golangci-lint)
golangci-lint run ./...

# Run frontend linter
npm run lint

# Run all linters
make lint
```

### Docker & Deployment

```bash
# Build Docker image
docker build -t caddy-orchestrator:latest .

# Run container
docker run -d -p 3000:3000 \
  -v caddy-data:/root/data \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  --name caddy-orchestrator \
  caddy-orchestrator

# Docker Compose (development with test Caddy instance)
docker-compose up -d

# Docker Compose (production)
docker-compose -f docker-compose.prod.yml up -d

# Automated deployment script
./scripts/deploy.sh

# Test deployment
./scripts/test-deployment.sh
```

### Makefile Shortcuts

```bash
make help           # Show all available commands
make build          # Build frontend and backend
make run            # Build and run the application
make dev-backend    # Run backend in dev mode
make dev-frontend   # Run frontend in dev mode
make test           # Run all tests
make test-coverage  # Run tests with coverage
make docker         # Build Docker image
make docker-up      # Start Docker Compose services
make clean          # Clean build artifacts
make deps           # Install dependencies
make install-tools  # Install development tools (air, golangci-lint)
```

## Architecture & Code Structure

### Backend Architecture (Go)

The backend follows a layered architecture:

1. **Entry Point**: `cmd/server/main.go`
   - Loads configuration from `config/config.yaml` or environment variables
   - Initializes SQLite storage, Caddy manager, and template manager
   - Sets up Gin router with routes and middleware
   - Serves static frontend files from `./web` directory
   - Implements graceful shutdown on SIGINT/SIGTERM

2. **API Layer**: `internal/api/`
   - `routes.go`: Route definitions and middleware setup
   - `handlers/`: HTTP request handlers organized by feature:
     - `instances.go`: Instance CRUD operations
     - `config.go`: Configuration management (GET/POST/PATCH/DELETE with ETag support)
     - `templates.go`: Template management
     - `bulk.go`: Bulk operations across multiple instances
   - `middleware/`: CORS, logging, recovery, rate limiting

3. **Business Logic**: `internal/caddy/`
   - `manager.go`: Manages multiple Caddy instances
     - Maintains in-memory client map with mutex for thread safety
     - Handles instance lifecycle (add, update, delete)
     - Coordinates health checks via goroutines
   - `client.go`: Caddy Admin API client
     - Supports authentication: none, bearer token, mTLS
     - Handles ETag-based configuration updates
     - Implements all Caddy Admin API endpoints (config, adapt, upstreams, PKI)

4. **Storage Layer**: `internal/storage/`
   - `sqlite.go`: SQLite database operations
   - `models.go`: Data models for instances, templates, audit logs, backups
   - Database auto-migrates schema on startup

5. **Templates**: `internal/templates/`
   - `manager.go`: Template management and variable substitution
   - `builtin.go`: Pre-built templates (reverse proxy, static server, load balancer)
   - Uses Go's `text/template` for variable interpolation

### Frontend Architecture (React + TypeScript)

1. **Entry Point**: `src/main.tsx` → `src/App.tsx`
   - React Router setup with routes
   - Theme provider (dark/light mode)

2. **Pages**: `src/pages/`
   - `Dashboard.tsx`: Overview with stats and health monitoring
   - `Instances.tsx`: Instance management (table/grid view)
   - `Config.tsx`: Configuration editor with Monaco editor
   - `Upstreams.tsx`: Reverse proxy upstream monitoring
   - `Certificates.tsx`: PKI/certificate management
   - `Settings.tsx`: Application settings

3. **Components**: `src/components/`
   - `instances/`: Instance-specific components (dialogs, cards, tables)
   - `config/`: Config editor components (diff viewer, conflict dialog, validation)
   - `ui/`: shadcn/ui components (buttons, dialogs, cards, etc.)

4. **Hooks**: `src/hooks/`
   - Custom React hooks for data fetching and state management
   - Uses `@tanstack/react-query` for API state

5. **Types**: `src/types/`
   - TypeScript type definitions aligned with backend models

### Key Integration Points

- **Development Proxy**: Vite dev server (port 8080) proxies `/api/*` to backend (port 3000)
- **Production**: Go backend serves both API (`/api/*`) and static files (`/`, `/assets/*`) on port 3000
- **API Communication**: JSON REST API with standard response format
- **Real-time Updates**: Health checks run on configurable intervals (default: 30s)

### Database Schema

SQLite database (`./data/orchestrator.db`) with tables:
- `instances`: Caddy server instances (with encrypted credentials JSON)
- `templates`: Configuration templates (with JSON template and variables)
- `audit_logs`: Change tracking (with JSON changes field)
- `config_backups`: Configuration backups with ETag

### Configuration Management

The application uses a hierarchical configuration system:
1. `config/config.yaml`: Default configuration
2. Environment variables: Override config values
3. Config loader: `config/config.go` handles loading and merging

Key environment variables:
- `JWT_SECRET`: JWT authentication secret (required)
- `LOG_LEVEL`: debug, info, warn, error
- `DB_PATH`: SQLite database path

## Testing Strategy

### Backend Testing
- Unit tests for individual components (`*_test.go` files)
- Integration tests for storage layer (`internal/storage/sqlite_test.go`)
- Main entry point has test coverage (`cmd/server/main_test.go`)
- CI runs tests with race detection and coverage reporting

### Frontend Testing
- TypeScript type checking in CI
- ESLint for code quality
- Build verification ensures no compilation errors

## Development Workflow

### Making Changes to Backend
1. Modify Go code in `cmd/` or `internal/`
2. Run `go fmt ./...` to format code
3. Test changes: `go test -v ./...`
4. Run linter: `golangci-lint run ./...`
5. Verify build: `go build ./cmd/server`

### Making Changes to Frontend
1. Modify TypeScript/React code in `src/`
2. Test in dev mode: `npm run dev` (hot reload enabled)
3. Check types: `npx tsc --noEmit`
4. Run linter: `npm run lint`
5. Build for production: `npm run build`

### Adding New API Endpoints
1. Define handler in `internal/api/handlers/`
2. Add route in `internal/api/routes.go`
3. Update `internal/caddy/client.go` if calling Caddy Admin API
4. Add TypeScript types in `src/types/`
5. Create React hook in `src/hooks/` for data fetching

### Adding New Caddy Instance Features
1. Add client method in `internal/caddy/client.go`
2. Add manager method in `internal/caddy/manager.go` (if coordinating multiple instances)
3. Create API handler in `internal/api/handlers/`
4. Add route in `internal/api/routes.go`
5. Update frontend to use new API

## Important Constraints

### CGO Requirement
The backend requires `CGO_ENABLED=1` due to SQLite dependency (`mattn/go-sqlite3`). This means:
- Cross-compilation is more complex
- Build requires C compiler (gcc/musl on Alpine)
- Docker builds use multi-stage builds with appropriate toolchain

### Port Configuration
- Frontend dev server: 8080
- Backend server: 3000 (serves both API and static files in production)
- Test Caddy instance (docker-compose): 2019

### Thread Safety
The `Manager` struct uses `sync.RWMutex` to protect the `clients` map. Always use mutex when accessing or modifying the clients map to avoid race conditions.

### ETag Handling
Configuration updates support ETags for optimistic concurrency control. The client tracks ETags and includes them in `If-Match` headers for updates.

## CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:
- `ci.yml`: Main CI pipeline
  - Backend: lint, test, build (Go 1.24.2)
  - Frontend: lint, typecheck, build (Node 20)
  - Docker: build verification
- `security.yml`: Security scanning
- `pr-checks.yml`: PR validation
- `cleanup.yml`: Artifact cleanup

All checks must pass for PR merge. Linting errors are non-blocking but should be addressed.

## Build Process

### Multi-Stage Docker Build
1. **Go Builder Stage**: Compiles backend with CGO enabled
2. **Frontend Builder Stage**: Builds React app with Vite
3. **Runtime Stage**: Alpine-based final image
   - Copies backend binary
   - Copies frontend build to `./web`
   - Installs runtime dependencies (ca-certificates, sqlite-libs)
   - Exposes port 3000
   - Runs as single process

Result: ~50MB production image with frontend + backend.

## Security Considerations

- **mTLS Support**: Full client certificate authentication for remote Caddy instances
- **Bearer Token Auth**: Token-based authentication option
- **Credentials Storage**: Encrypted JSON in SQLite (credentials_json field)
- **Rate Limiting**: 100 req/s with burst of 200 (configurable)
- **CORS**: Configurable origins (avoid wildcard in production)
- **JWT Secret**: Must be set via environment variable in production
- **Audit Logging**: All configuration changes tracked in database

## Known Patterns

### Goroutine Usage
- Health checks run in background goroutines
- Status updates triggered asynchronously after connection tests
- Manager uses goroutines for parallel operations on multiple instances

### Error Handling
- Errors wrapped with context using `fmt.Errorf` with `%w` verb
- HTTP handlers return JSON error responses with standard format
- Storage layer returns descriptive errors

### Configuration Backups
- Automatic backups before applying configuration changes
- Configurable backup retention count (default: 5)
- Includes ETag for version tracking
