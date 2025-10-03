# Configuration Guide

## Environment Variables

### Required (Production)

#### JWT_SECRET
**Required for production use**

The JWT secret is used for authentication and session management (planned feature).

**How to set:**

```bash
# Generate a secure random secret (recommended)
export JWT_SECRET=$(openssl rand -base64 32)

# Or set manually
export JWT_SECRET="your-very-secure-random-string-here"
```

**In Docker:**

```bash
# Docker run
docker run -e JWT_SECRET=$(openssl rand -base64 32) caddy-orchestrator

# Docker Compose
# Add to .env file:
JWT_SECRET=your-generated-secret-here
```

**Default behavior:**
- If not set, a warning is logged and an insecure default is used
- This is OK for local development only
- **Never use default in production**

### Optional

#### LOG_LEVEL
Controls logging verbosity.

**Values:** `debug`, `info`, `warn`, `error`  
**Default:** `info`

```bash
export LOG_LEVEL=debug
```

#### DB_PATH
Path to SQLite database file.

**Default:** `./data/orchestrator.db`

```bash
export DB_PATH=/custom/path/db.sqlite
```

#### CORS_ORIGINS
Comma-separated list of allowed CORS origins.

**Default:** `*` (all origins - development only)  
**Production:** Set specific domains

```bash
export CORS_ORIGINS=https://orchestrator.yourdomain.com,https://backup.yourdomain.com
```

## Configuration File

You can also use a YAML configuration file at `config/config.yaml`:

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
  # JWT secret from environment variable
  jwt_secret: "${JWT_SECRET}"
  cors_origins:
    - "https://orchestrator.yourdomain.com"

caddy:
  default_timeout: 10s
  health_check_interval: 30s
  config_backup_count: 10

logging:
  level: "info"
  format: "json"
  audit_enabled: true
```

## Configuration Priority

1. **Environment variables** (highest priority)
2. **Configuration file** (`config/config.yaml`)
3. **Default values** (lowest priority)

## Security Best Practices

### ✅ DO

- Set `JWT_SECRET` to a strong random value in production
- Use `openssl rand -base64 32` to generate secrets
- Store secrets in environment variables or secret management systems
- Restrict CORS origins to specific domains
- Use HTTPS in production

### ❌ DON'T

- Use default JWT_SECRET in production
- Commit secrets to version control
- Use `CORS_ORIGINS=*` in production
- Expose the application without authentication

## Quick Setup

### Development

```bash
# .env.development (optional - has defaults)
LOG_LEVEL=debug
```

### Production

```bash
# .env.production (required)
JWT_SECRET=$(openssl rand -base64 32)
LOG_LEVEL=info
CORS_ORIGINS=https://your-domain.com
DB_PATH=/data/orchestrator.db
```

### Docker Production

```bash
# Generate and save secret
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env.production

# Run with environment file
docker run --env-file .env.production -p 3000:3000 caddy-orchestrator
```

## Verification

Check your configuration:

```bash
# The application logs its configuration on startup
docker logs caddy-orchestrator | grep -E "JWT_SECRET|LOG_LEVEL|CORS"

# You should see warnings if JWT_SECRET is not set properly
```

## Troubleshooting

### "WARNING: JWT_SECRET not set"

**Problem:** Application is using insecure default  
**Solution:** Set `JWT_SECRET` environment variable

```bash
export JWT_SECRET=$(openssl rand -base64 32)
```

### "CORS error in browser"

**Problem:** CORS origins not configured correctly  
**Solution:** Set specific origins

```yaml
# config/config.yaml
security:
  cors_origins:
    - "http://localhost:8080"  # Development
    - "https://your-domain.com"  # Production
```

Or via environment:
```bash
CORS_ORIGINS=http://localhost:8080,https://your-domain.com
```
