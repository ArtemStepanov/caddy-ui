# Single Container Deployment Guide

This guide explains how to deploy Caddy Orchestrator as a **single Docker container** with both frontend and backend running together.

## Overview

The application is designed to run as a unified service where:
- **Go backend** serves the API on `/api/*`
- **Go backend** also serves the React frontend (static files) on `/*`
- **Everything runs on port 3000**
- **Single process, single container, single deployment**

```
┌─────────────────────────────────────────┐
│  Docker Container (Alpine Linux)        │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Go Backend (Port 3000)            │ │
│  │                                    │ │
│  │  ├─ API Routes (/api/*)           │ │
│  │  │  └─ Instance Management        │ │
│  │  │  └─ Configuration Proxy        │ │
│  │  │  └─ Template System            │ │
│  │  │                                 │ │
│  │  └─ Static Files (/*)             │ │
│  │     └─ React Frontend (SPA)       │ │
│  │     └─ HTML, CSS, JS, Assets      │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  SQLite Database                   │ │
│  │  /root/data/orchestrator.db        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## How It Works

### Build Process (Multi-Stage Dockerfile)

```dockerfile
# Stage 1: Build Go backend
FROM golang:1.21-alpine AS go-builder
# ... compiles Go binary

# Stage 2: Build React frontend
FROM node:20-alpine AS frontend-builder
# ... builds React app to /dist

# Stage 3: Runtime (Alpine Linux)
FROM alpine:latest
COPY --from=go-builder /app/caddy-orchestrator .
COPY --from=frontend-builder /app/dist ./web
# Result: Single image ~50MB
```

### Runtime Behavior

When the container starts:

1. **Go backend starts** on port 3000
2. **Serves API** at `/api/*` → Gin handlers
3. **Serves frontend** at `/*` → Static files from `./web/`
4. **SPA routing** → All non-API routes return `index.html`

Example request flow:

```
User visits: http://localhost:3000/
  ↓ Go backend serves ./web/index.html

User navigates: /instances
  ↓ React Router handles (client-side)
  ↓ No server request

User clicks "Add Instance"
  ↓ API call to /api/instances
  ↓ Go backend handles request
  ↓ Returns JSON response
```

## Quick Start - Production Deployment

### Option 1: Docker Run (Simplest)

```bash
# Build the image
docker build -t caddy-orchestrator:latest .

# Run the container
docker run -d \
  --name caddy-orchestrator \
  -p 3000:3000 \
  -v caddy-data:/root/data \
  -e JWT_SECRET="your-secret-key-here" \
  --restart unless-stopped \
  caddy-orchestrator:latest

# Access at http://localhost:3000
```

### Option 2: Docker Compose (Recommended)

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  caddy-orchestrator:
    build: .
    image: caddy-orchestrator:latest
    container_name: caddy-orchestrator
    restart: always
    ports:
      - "3000:3000"
    volumes:
      # Persistent database
      - caddy-data:/root/data
      # Optional: Custom config
      - ./config/config.yaml:/root/config/config.yaml:ro
    environment:
      - JWT_SECRET=${JWT_SECRET:-please-change-this-secret}
      - LOG_LEVEL=info
      - GIN_MODE=release
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  caddy-data:
    driver: local
```

Deploy:

```bash
# Set environment variables
export JWT_SECRET=$(openssl rand -base64 32)

# Start the container
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Option 3: Kubernetes

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: caddy-orchestrator
  labels:
    app: caddy-orchestrator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: caddy-orchestrator
  template:
    metadata:
      labels:
        app: caddy-orchestrator
    spec:
      containers:
      - name: caddy-orchestrator
        image: caddy-orchestrator:latest
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: orchestrator-secrets
              key: jwt-secret
        - name: LOG_LEVEL
          value: "info"
        - name: GIN_MODE
          value: "release"
        volumeMounts:
        - name: data
          mountPath: /root/data
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: orchestrator-data
---
apiVersion: v1
kind: Service
metadata:
  name: caddy-orchestrator
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: caddy-orchestrator
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: orchestrator-data
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

Deploy:

```bash
# Create secret
kubectl create secret generic orchestrator-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 32)

# Apply manifests
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -l app=caddy-orchestrator
kubectl get svc caddy-orchestrator
```

## Building the Image

### Standard Build

```bash
# Build with default tag
docker build -t caddy-orchestrator:latest .

# Build with version tag
docker build -t caddy-orchestrator:v1.0.0 .

# Build with custom registry
docker build -t registry.example.com/caddy-orchestrator:latest .
```

### Optimized Build

```bash
# Build with build args
docker build \
  --build-arg GO_VERSION=1.21 \
  --build-arg NODE_VERSION=20 \
  -t caddy-orchestrator:latest \
  .

# Build with cache optimization
docker build \
  --cache-from caddy-orchestrator:latest \
  -t caddy-orchestrator:latest \
  .
```

### Build Statistics

- **Image Size**: ~50MB (Alpine + Go binary + React build)
- **Build Time**: 2-3 minutes (with cache: 30 seconds)
- **Layers**: 8 layers
- **Base Image**: Alpine Linux (5MB)

## Configuration

### Environment Variables

```bash
# Required
JWT_SECRET=your-secret-key         # Strong random string

# Optional
LOG_LEVEL=info                     # debug, info, warn, error
GIN_MODE=release                   # release, debug
DB_PATH=/root/data/orchestrator.db # Database path
CORS_ORIGINS=https://your-domain   # Comma-separated
```

### Configuration File

Mount custom config at `/root/config/config.yaml`:

```yaml
server:
  host: "0.0.0.0"
  port: 3000

storage:
  type: "sqlite"
  path: "/root/data/orchestrator.db"

security:
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

## Accessing the Application

### Direct Access

```bash
# Application URL
http://localhost:3000

# API Health Check
curl http://localhost:3000/api/health

# API Endpoints
curl http://localhost:3000/api/instances
```

### Behind Reverse Proxy (Recommended)

#### Caddy

```caddyfile
orchestrator.yourdomain.com {
    reverse_proxy caddy-orchestrator:3000
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
    }
    
    # Compression
    encode gzip zstd
}
```

#### Nginx

```nginx
server {
    listen 80;
    server_name orchestrator.yourdomain.com;
    
    location / {
        proxy_pass http://caddy-orchestrator:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Traefik

```yaml
# docker-compose.yml with Traefik labels
services:
  caddy-orchestrator:
    image: caddy-orchestrator:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.orchestrator.rule=Host(`orchestrator.yourdomain.com`)"
      - "traefik.http.routers.orchestrator.entrypoints=websecure"
      - "traefik.http.routers.orchestrator.tls.certresolver=letsencrypt"
      - "traefik.http.services.orchestrator.loadbalancer.server.port=3000"
```

## Data Persistence

### Volume Management

```bash
# Create named volume
docker volume create caddy-data

# Inspect volume
docker volume inspect caddy-data

# Backup database
docker run --rm \
  -v caddy-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup.tar.gz /data

# Restore database
docker run --rm \
  -v caddy-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/backup.tar.gz -C /
```

### Database Location

Inside container:
- Database: `/root/data/orchestrator.db`
- Templates: `/root/templates/`
- Config: `/root/config/config.yaml`

## Health Checks

### Container Health

```bash
# Docker health check (built-in)
docker ps  # Shows health status

# Manual check
docker exec caddy-orchestrator wget -qO- http://localhost:3000/api/health
```

### Application Health

```bash
# API health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","service":"caddy-orchestrator"}

# Check instances
curl http://localhost:3000/api/instances
```

## Monitoring

### Logs

```bash
# View logs
docker logs caddy-orchestrator

# Follow logs
docker logs -f caddy-orchestrator

# Last 100 lines
docker logs --tail 100 caddy-orchestrator

# With timestamps
docker logs -t caddy-orchestrator
```

### Metrics (Future)

Prometheus metrics endpoint will be added:
```bash
curl http://localhost:3000/metrics
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs caddy-orchestrator

# Common issues:
# 1. Port already in use
lsof -i :3000

# 2. Database permissions
docker exec caddy-orchestrator ls -la /root/data

# 3. Configuration error
docker exec caddy-orchestrator cat /root/config/config.yaml
```

### Frontend Not Loading

```bash
# Verify frontend files exist
docker exec caddy-orchestrator ls -la /root/web

# Check if backend is serving static files
docker logs caddy-orchestrator | grep "Serving static files"

# Test direct file access
docker exec caddy-orchestrator cat /root/web/index.html
```

### API Not Responding

```bash
# Check if backend is running
docker exec caddy-orchestrator ps aux

# Test API health
docker exec caddy-orchestrator wget -qO- http://localhost:3000/api/health

# Check database
docker exec caddy-orchestrator sqlite3 /root/data/orchestrator.db ".tables"
```

### High Memory Usage

```bash
# Check container stats
docker stats caddy-orchestrator

# Restart container
docker restart caddy-orchestrator

# Set memory limit
docker update --memory 512m caddy-orchestrator
```

## Production Checklist

### Before Deployment

- [ ] Set strong `JWT_SECRET`
- [ ] Configure CORS origins
- [ ] Set up data volume
- [ ] Configure backup strategy
- [ ] Set up reverse proxy with HTTPS
- [ ] Configure firewall rules
- [ ] Set up monitoring/alerting
- [ ] Test health checks
- [ ] Document access credentials
- [ ] Plan rollback strategy

### After Deployment

- [ ] Verify frontend loads
- [ ] Test API endpoints
- [ ] Add first Caddy instance
- [ ] Test instance connectivity
- [ ] Verify database persistence
- [ ] Check logs for errors
- [ ] Test backup restore
- [ ] Monitor resource usage
- [ ] Document deployment

## Scaling Considerations

### Current Limitations

- **SQLite**: Single writer, not suitable for multiple replicas
- **No shared state**: Each container has its own DB
- **Local storage**: Volume per container

### Future Scaling

For horizontal scaling, future versions will support:
- PostgreSQL/MySQL for shared database
- Redis for session storage
- Distributed configuration
- Load balancer compatibility

### Current Recommendations

- **Vertical scaling**: Increase CPU/memory
- **High availability**: Use orchestration health checks
- **Data backup**: Regular automated backups
- **Monitoring**: Implement comprehensive monitoring

## Cost Estimation

### Resource Requirements

**Minimum:**
- CPU: 0.1 cores
- Memory: 128MB
- Storage: 1GB

**Recommended:**
- CPU: 0.5 cores
- Memory: 512MB
- Storage: 10GB

**Enterprise:**
- CPU: 2 cores
- Memory: 2GB
- Storage: 50GB

### Cloud Costs (Estimated Monthly)

- **AWS**: $10-50/month (t3.micro to t3.small)
- **DigitalOcean**: $6-24/month (Basic Droplet)
- **GCP**: $10-45/month (e2-micro to e2-small)
- **Azure**: $13-52/month (B1S to B2S)

## Summary

✅ **Single Docker image** containing frontend + backend  
✅ **~50MB total size** with Alpine Linux  
✅ **Single port (3000)** for easy deployment  
✅ **Self-contained** - no external dependencies  
✅ **Easy to deploy** - single `docker run` command  
✅ **Production-ready** - health checks, graceful shutdown  
✅ **Scalable vertically** - add more CPU/memory  
✅ **Persistent data** - via Docker volumes  

The application is designed from the ground up to run as a unified single-container service, making deployment simple and maintenance easy!

---

**Next Steps:**
1. Build the image: `docker build -t caddy-orchestrator .`
2. Run the container: `docker run -p 3000:3000 caddy-orchestrator`
3. Access at: `http://localhost:3000`
4. Start managing your Caddy instances! 🚀
