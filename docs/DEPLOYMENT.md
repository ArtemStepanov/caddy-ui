# Deployment Guide

This guide covers deploying Caddy Orchestrator in production environments.

## Table of Contents

- [Production Considerations](#production-considerations)
- [Deployment Options](#deployment-options)
- [Security Hardening](#security-hardening)
- [Backup and Recovery](#backup-and-recovery)
- [Monitoring](#monitoring)
- [Scaling](#scaling)

## Production Considerations

### Environment Variables

Create a `.env` file with production values:

```bash
# Strong random secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Logging
LOG_LEVEL=info

# Database
DB_PATH=/data/orchestrator.db

# CORS - Restrict to your domains
CORS_ORIGINS=https://orchestrator.yourdomain.com
```

### Configuration File

Update `config/config.yaml` for production:

```yaml
server:
  host: "0.0.0.0"
  port: 3000
  read_timeout: 30s
  write_timeout: 30s

storage:
  type: "sqlite"
  path: "/data/orchestrator.db"

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

## Deployment Options

### Option 1: Docker with Reverse Proxy (Recommended)

#### 1. Create production docker-compose.yml

```yaml
version: '3.8'

services:
  caddy-orchestrator:
    image: caddy-orchestrator:latest
    build: .
    container_name: caddy-orchestrator
    restart: always
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - LOG_LEVEL=info
      - GIN_MODE=release
    volumes:
      - ./data:/root/data
      - ./config:/root/config:ro
      - ./logs:/root/logs
    networks:
      - web
    labels:
      - "caddy.reverse_proxy={{upstreams}}"
      - "caddy.address=orchestrator.yourdomain.com"
      - "caddy.tls.email=admin@yourdomain.com"

  caddy-proxy:
    image: caddy:2-alpine
    container_name: caddy-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3
    volumes:
      - ./Caddyfile.prod:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - web

networks:
  web:
    external: true

volumes:
  caddy_data:
  caddy_config:
```

#### 2. Create Caddyfile.prod

```caddyfile
{
    email admin@yourdomain.com
}

orchestrator.yourdomain.com {
    reverse_proxy caddy-orchestrator:3000
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Enable compression
    encode gzip zstd
    
    # Logging
    log {
        output file /var/log/caddy/access.log
        format json
    }
}
```

#### 3. Deploy

```bash
# Create network
docker network create web

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 2: Systemd Service

#### 1. Build the application

```bash
npm run build
CGO_ENABLED=1 go build -o caddy-orchestrator ./cmd/server
```

#### 2. Create systemd service

Create `/etc/systemd/system/caddy-orchestrator.service`:

```ini
[Unit]
Description=Caddy Orchestrator
After=network.target

[Service]
Type=simple
User=caddy-orchestrator
Group=caddy-orchestrator
WorkingDirectory=/opt/caddy-orchestrator
Environment="JWT_SECRET=your-secret-key"
Environment="LOG_LEVEL=info"
ExecStart=/opt/caddy-orchestrator/caddy-orchestrator
Restart=always
RestartSec=10

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/caddy-orchestrator/data

[Install]
WantedBy=multi-user.target
```

#### 3. Deploy

```bash
# Create user
sudo useradd -r -s /bin/false caddy-orchestrator

# Copy files
sudo mkdir -p /opt/caddy-orchestrator
sudo cp -r . /opt/caddy-orchestrator/
sudo chown -R caddy-orchestrator:caddy-orchestrator /opt/caddy-orchestrator

# Start service
sudo systemctl daemon-reload
sudo systemctl enable caddy-orchestrator
sudo systemctl start caddy-orchestrator

# Check status
sudo systemctl status caddy-orchestrator
```

### Option 3: Kubernetes

#### 1. Create deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: caddy-orchestrator
  namespace: caddy-system
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
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: orchestrator-secrets
              key: jwt-secret
        - name: LOG_LEVEL
          value: "info"
        volumeMounts:
        - name: data
          mountPath: /root/data
        - name: config
          mountPath: /root/config
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: orchestrator-data
      - name: config
        configMap:
          name: orchestrator-config
---
apiVersion: v1
kind: Service
metadata:
  name: caddy-orchestrator
  namespace: caddy-system
spec:
  selector:
    app: caddy-orchestrator
  ports:
  - port: 3000
    targetPort: 3000
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: orchestrator-data
  namespace: caddy-system
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

#### 2. Deploy

```bash
kubectl create namespace caddy-system
kubectl create secret generic orchestrator-secrets \
  --from-literal=jwt-secret=your-secret-key \
  -n caddy-system
kubectl apply -f deployment.yaml
```

## Security Hardening

### 1. Enable mTLS for Remote Instances

#### Generate certificates

```bash
# CA certificate
openssl req -x509 -newkey rsa:4096 -days 3650 -nodes \
  -keyout ca-key.pem -out ca-cert.pem \
  -subj "/CN=Caddy Orchestrator CA"

# Server certificate
openssl req -newkey rsa:4096 -nodes \
  -keyout server-key.pem -out server-req.pem \
  -subj "/CN=caddy-server"

openssl x509 -req -in server-req.pem -days 365 \
  -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial \
  -out server-cert.pem
```

#### Configure Caddy instance

On remote Caddy server:

```json
{
  "admin": {
    "listen": "0.0.0.0:2019",
    "enforce_origin": true,
    "origins": ["https://orchestrator.yourdomain.com"]
  }
}
```

#### Add instance with mTLS

```json
{
  "name": "Secure Server",
  "admin_url": "https://caddy-server:2019",
  "auth_type": "mtls",
  "credentials": {
    "cert_file": "/path/to/client-cert.pem",
    "key_file": "/path/to/client-key.pem",
    "ca_file": "/path/to/ca-cert.pem"
  }
}
```

### 2. Configure Firewall

```bash
# Allow only from orchestrator
ufw allow from ORCHESTRATOR_IP to any port 2019 proto tcp

# Or use iptables
iptables -A INPUT -p tcp --dport 2019 -s ORCHESTRATOR_IP -j ACCEPT
iptables -A INPUT -p tcp --dport 2019 -j DROP
```

### 3. Use Bearer Token Authentication

```bash
# Generate secure token
TOKEN=$(openssl rand -base64 32)

# Configure Caddy with auth
caddy run --admin-token "$TOKEN"
```

Add instance:

```json
{
  "name": "Token Protected",
  "admin_url": "http://caddy:2019",
  "auth_type": "bearer",
  "credentials": {
    "token": "your-generated-token"
  }
}
```

### 4. Network Segmentation

Use Docker networks or VPNs:

```bash
# Create isolated network
docker network create --internal caddy-internal

# Deploy with network
docker-compose --file docker-compose.secure.yml up -d
```

### 5. Regular Updates

```bash
# Update base images
docker pull alpine:latest
docker pull golang:1.21-alpine
docker pull caddy:2-alpine

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## Backup and Recovery

### Automated Backups

#### Backup script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/caddy-orchestrator"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/opt/caddy-orchestrator/data/orchestrator.db"

mkdir -p "$BACKUP_DIR"

# Backup database
cp "$DB_FILE" "$BACKUP_DIR/orchestrator_$DATE.db"

# Backup config
tar czf "$BACKUP_DIR/config_$DATE.tar.gz" /opt/caddy-orchestrator/config

# Keep only last 30 days
find "$BACKUP_DIR" -name "orchestrator_*.db" -mtime +30 -delete
find "$BACKUP_DIR" -name "config_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

#### Cron job

```bash
# Daily backup at 2 AM
0 2 * * * /opt/caddy-orchestrator/backup.sh >> /var/log/backup.log 2>&1
```

### Recovery

```bash
# Stop service
systemctl stop caddy-orchestrator

# Restore database
cp /backups/caddy-orchestrator/orchestrator_YYYYMMDD.db \
   /opt/caddy-orchestrator/data/orchestrator.db

# Start service
systemctl start caddy-orchestrator
```

## Monitoring

### Health Checks

```bash
# Simple health check
curl http://localhost:3000/api/health

# Check instance status
curl http://localhost:3000/api/instances | jq '.data[] | {name, status}'
```

### Prometheus Integration (Future)

Metrics endpoint will be added in future versions:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'caddy-orchestrator'
    static_configs:
      - targets: ['orchestrator:3000']
```

### Log Aggregation

#### ELK Stack

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/caddy-orchestrator/*.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

## Scaling

### Horizontal Scaling

For high availability, run multiple instances behind a load balancer.

**Note**: Current version uses SQLite which doesn't support concurrent writes across multiple instances. For horizontal scaling, future versions will support PostgreSQL/MySQL.

### Vertical Scaling

Increase resources:

```yaml
# docker-compose.yml
services:
  caddy-orchestrator:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Performance Tuning

1. **Increase worker count**: Set `GOMAXPROCS` environment variable
2. **Optimize database**: Regular VACUUM and ANALYZE
3. **Enable caching**: Future feature for config caching
4. **Use CDN**: For static frontend assets

## Troubleshooting Production Issues

### High Memory Usage

```bash
# Check memory usage
docker stats caddy-orchestrator

# Restart if needed
docker-compose restart caddy-orchestrator
```

### Database Lock Issues

```bash
# Check for long-running queries
sqlite3 data/orchestrator.db "PRAGMA lock_status;"

# Restart application
systemctl restart caddy-orchestrator
```

### Connection Timeouts

Increase timeouts in config:

```yaml
caddy:
  default_timeout: 30s
  health_check_interval: 60s
```

## Maintenance

### Database Maintenance

```bash
# Vacuum database
sqlite3 data/orchestrator.db "VACUUM;"

# Check integrity
sqlite3 data/orchestrator.db "PRAGMA integrity_check;"
```

### Log Rotation

```bash
# /etc/logrotate.d/caddy-orchestrator
/opt/caddy-orchestrator/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 caddy-orchestrator caddy-orchestrator
    sharedscripts
    postrotate
        systemctl reload caddy-orchestrator > /dev/null 2>&1 || true
    endscript
}
```

## Support

For production support:

- GitHub Issues: [Report bugs](https://github.com/ArtemStepanov/caddy-orchestrator/issues)
- Documentation: Check the docs folder
- Caddy Community: [Caddy Forum](https://caddy.community)
