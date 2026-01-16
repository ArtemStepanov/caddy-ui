# Caddy Orchestrator

A modern, web-based management interface for multiple Caddy server instances. Built with Go backend and React frontend, this orchestrator provides centralized control over multiple Caddy servers through their Admin API.

[![CI Pipeline](https://github.com/ArtemStepanov/caddy-orchestrator/actions/workflows/ci.yml/badge.svg)](https://github.com/ArtemStepanov/caddy-orchestrator/actions/workflows/ci.yml)
[![Security Scanning](https://github.com/ArtemStepanov/caddy-orchestrator/actions/workflows/security.yml/badge.svg)](https://github.com/ArtemStepanov/caddy-orchestrator/actions/workflows/security.yml)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Go Version](https://img.shields.io/badge/go-1.24+-00ADD8.svg)
![React](https://img.shields.io/badge/react-18.0+-61DAFB.svg)

## Features

### 🎯 Core Features
- **Multi-Instance Management**: Connect and manage multiple Caddy servers from a single interface
- **Real-time Health Monitoring**: Automatic health checks and status updates
- **Configuration Management**: View, edit, and apply configurations with ETag support
- **Template System**: Pre-built and custom templates for common configurations
- **Bulk Operations**: Apply changes to multiple instances simultaneously
- **Audit Logging**: Track all configuration changes and operations
- **Configuration Backups**: Automatic backups before applying changes

### 🔒 Security
- **mTLS Support**: Secure connections to remote Caddy instances
- **Bearer Token Authentication**: Support for token-based auth
- **Rate Limiting**: Protection against API abuse
- **CORS Configuration**: Configurable cross-origin resource sharing

### 📊 Management Features
- **Metrics Monitoring**: View Prometheus metrics from Caddy instances (requests, errors, duration, upstream health)
- **Application Settings**: Customize UI appearance (theme, language, time formats) and dashboard preferences
- **Upstream Monitoring**: View reverse proxy upstream status
- **PKI/Certificate Management**: Access PKI CA information
- **Caddyfile Adapter**: Convert Caddyfile format to JSON configuration
- **Config Validation**: Validate configurations before applying

## Architecture

### 🎯 Single Container Design

The application is designed as a **unified service** that runs in a single Docker container:

```
┌─────────────────────────────────────┐
│  Docker Container (~50MB)           │
│  ┌───────────────────────────────┐  │
│  │  Go Backend (Port 3000)       │  │
│  │  • Serves API (/api/*)        │  │
│  │  • Serves Frontend (/)        │  │
│  │  • Manages Caddy instances    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  SQLite Database              │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Benefits:**
- ✅ Simple deployment (one image, one container)
- ✅ Small footprint (~50MB Alpine-based image)
- ✅ No separate web server needed
- ✅ Unified configuration and logging
- ✅ Easy to scale vertically

## Tech Stack

### Backend
- **Go 1.24+** - High-performance backend
- **Gin** - HTTP web framework
- **SQLite** - Embedded database for configuration storage
- **Goroutines** - Concurrent operations on multiple instances

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **shadcn/ui** - Beautiful component library
- **Tailwind CSS** - Utility-first styling

## Quick Start

### 🐳 Single Container Deployment (Recommended)

The entire application (frontend + backend) runs in one Docker container!

```bash
# 1. Clone the repository
git clone https://github.com/ArtemStepanov/caddy-orchestrator.git
cd caddy-orchestrator

# 2. Deploy with one command
./scripts/deploy.sh

# Or manually with Docker
docker build -t caddy-orchestrator .
docker run -d -p 3000:3000 \
  -v caddy-data:/root/data \
  -e JWT_SECRET=$(openssl rand -base64 32) \
  --name caddy-orchestrator \
  caddy-orchestrator

# 3. Access at http://localhost:3000
```

**That's it!** Both frontend and backend are running in a single ~50MB container. 🚀

See [Single Container Deployment Guide](docs/SINGLE_CONTAINER_DEPLOYMENT.md) for details.

### 💻 Local Development Setup

For development with hot reload:

#### Prerequisites
- Go 1.24 or higher
- Node.js 20 or higher

#### Setup

```bash
# 1. Clone the repository
git clone https://github.com/ArtemStepanov/caddy-orchestrator.git
cd caddy-orchestrator

# 2. Run setup script
./scripts/setup.sh

# 3. Start backend (Terminal 1)
go run cmd/server/main.go

# 4. Start frontend (Terminal 2)
npm run dev

# Frontend: http://localhost:8080 (with hot reload)
# Backend: http://localhost:3000
```

### 🧪 Testing Deployment

```bash
# Run automated tests
./scripts/test-deployment.sh
```

### 🐋 Docker Compose (Development)

```bash
# Start with test Caddy instance
docker-compose up -d

# This starts:
# - caddy-orchestrator: Main app on port 3000
# - caddy-test: Test Caddy instance on port 2019
```

### 🚀 Production Deployment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Access at http://localhost:3000
```

### Configuration

The application can be configured via `config/config.yaml` or environment variables:

**First time setup:**
```bash
# Copy the example configuration
cp config/config.yaml.example config/config.yaml

# Generate a secure JWT secret
openssl rand -base64 32

# Edit config.yaml and update the jwt_secret
```

**Configuration options:**

```yaml
server:
  host: "0.0.0.0"
  port: 3000
  read_timeout: 30s
  write_timeout: 30s

storage:
  type: "sqlite"
  path: "./data/orchestrator.db"

security:
  jwt_secret: "${JWT_SECRET}"
  cors_origins:
    - "http://localhost:5173"
    - "http://localhost:3000"

caddy:
  default_timeout: 10s
  health_check_interval: 30s
  config_backup_count: 5
```

#### Environment Variables
- `JWT_SECRET` - Secret key for JWT authentication
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `DB_PATH` - Path to SQLite database file

## API Documentation

### Instance Management
```http
GET    /api/instances              # List all instances
POST   /api/instances              # Create instance
GET    /api/instances/:id          # Get instance details
PUT    /api/instances/:id          # Update instance
DELETE /api/instances/:id          # Delete instance
POST   /api/instances/:id/test-connection  # Test connection
```

### Configuration Management
```http
GET    /api/instances/:id/config[/*path]   # Get configuration
POST   /api/instances/:id/config[/*path]   # Set configuration
POST   /api/instances/:id/load             # Load configuration (Caddy native)
PATCH  /api/instances/:id/config[/*path]   # Patch configuration
DELETE /api/instances/:id/config/*path     # Delete configuration
```

### Application Settings
```http
GET    /api/settings              # Get application settings
PUT    /api/settings              # Update application settings
```

### Utilities
```http
POST   /api/instances/:id/adapt        # Adapt Caddyfile to JSON
GET    /api/instances/:id/upstreams    # Get upstream status
GET    /api/instances/:id/metrics      # Get instance metrics
GET    /api/instances/:id/pki/ca/:ca_id  # Get PKI CA info
GET    /api/health                     # Health check
```

### Templates
```http
GET    /api/templates           # List templates
POST   /api/templates           # Create custom template
GET    /api/templates/:id       # Get template
POST   /api/templates/:id/generate  # Generate config from template
```

### Bulk Operations
```http
POST   /api/bulk/config-update   # Update multiple instances
POST   /api/bulk/template-apply  # Apply template to multiple instances
```

## Built-in Templates

The orchestrator comes with several pre-built templates:

1. **Basic Reverse Proxy** - Simple reverse proxy for internal services
2. **Static File Server** - Serve static files with HTTPS
3. **WebSocket Proxy** - Reverse proxy with WebSocket support
4. **Load Balancer** - Load balancer with health checks

## Project Structure

```
caddy-orchestrator/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/           # HTTP request handlers
│   │   ├── middleware/         # Middleware (CORS, logging, etc.)
│   │   └── routes.go           # Route definitions
│   ├── caddy/
│   │   ├── client.go           # Caddy Admin API client
│   │   ├── manager.go          # Instance manager
│   │   └── metrics.go          # Metrics collection & parsing
│   ├── docker/                 # Docker integration (upcoming)
│   ├── storage/
│   │   ├── models.go           # Data models
│   │   └── sqlite.go           # SQLite storage implementation
│   └── templates/
│       ├── builtin.go          # Built-in templates
│       └── manager.go          # Template manager
├── config/
│   ├── config.go               # Configuration loader
│   └── config.yaml             # Default configuration
├── src/                        # React frontend source
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Docker Compose configuration
├── Caddyfile                   # Development Caddyfile
└── README.md
```

## Development

### Frontend Development
```bash
# Run frontend dev server with hot reload
npm run dev

# Build frontend for production
npm run build
# Note: Builds to 'dist/' directory
# Docker build copies 'dist/' to 'web/' for the backend to serve.
```

### Backend Development
```bash
# Run backend with hot reload (requires air)
air

# Build backend
go build -o caddy-orchestrator ./cmd/server

# Run tests
go test ./...

# Run with specific config
go run cmd/server/main.go -config ./config/config.yaml
```

### Building for Production

#### Binary Build
```bash
# Build frontend
npm run build

# Build backend
CGO_ENABLED=1 go build -o caddy-orchestrator ./cmd/server

# To run locally without Docker, ensure 'dist' is moved/linked to 'web':
ln -s dist web

# Run
./caddy-orchestrator
```

#### Docker Build
```bash
# Build image
docker build -t caddy-orchestrator:latest .

# Run container
docker run -p 3000:3000 -v $(pwd)/data:/root/data caddy-orchestrator:latest
```

## Adding a Caddy Instance

### Via Web Interface
1. Navigate to "Instances" page
2. Click "Add Instance"
3. Fill in the details:
   - Name: Friendly name for the instance
   - Admin URL: `http://localhost:2019` (or remote URL)
   - Auth Type: none, bearer, or mtls
4. Test connection
5. Save

### Via API
```bash
curl -X POST http://localhost:3000/api/instances \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "admin_url": "http://caddy-server:2019",
    "auth_type": "none"
  }'
```

## Security Best Practices

1. **Change JWT Secret**: Always set a strong `JWT_SECRET` in production
2. **Use mTLS**: Configure mTLS for remote Caddy instances
3. **Restrict CORS**: Configure specific origins instead of using `*`
4. **Enable HTTPS**: Run behind a reverse proxy with HTTPS
5. **Regular Backups**: Keep backups of the SQLite database
6. **Audit Logs**: Monitor audit logs for suspicious activity

## Roadmap

### Phase 1 (MVP) ✅
- [x] Basic instance management
- [x] Configuration proxy with ETag support
- [x] Built-in templates
- [x] Health monitoring
- [x] Metrics collection

### Phase 2 (In Progress)
- [ ] User authentication and authorization
- [ ] Role-based access control
- [ ] Docker container discovery (Initial integration structure added)
- [ ] Enhanced templates with wizards
- [ ] Metrics and monitoring dashboard

### Phase 3 (Future)
- [ ] Cluster support
- [ ] Auto-scaling capabilities
- [ ] Third-party integrations API
- [ ] Plugin architecture
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- **Code Quality**: All PRs must pass CI checks (linting, tests, builds)
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update documentation for API or feature changes
- **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/) format
- **PR Size**: Keep PRs focused and reasonably sized

See our [PR template](.github/pull_request_template.md) for more details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Caddy Server](https://caddyserver.com/) - Amazing web server with automatic HTTPS
- [Gin Web Framework](https://gin-gonic.com/) - High-performance HTTP framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful React components
- [Lovable](https://lovable.dev) - Project initialization and development platform

## Support

- **Documentation**: [Caddy Admin API](https://caddyserver.com/docs/api)
- **Issues**: [GitHub Issues](https://github.com/ArtemStepanov/caddy-orchestrator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ArtemStepanov/caddy-orchestrator/discussions)

---

Made with ❤️ by [Artem Stepanov](https://github.com/ArtemStepanov)
