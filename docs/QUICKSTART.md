# Quick Start Guide

This guide will help you get Caddy Orchestrator up and running in 5 minutes.

## Prerequisites

- **Docker & Docker Compose**: Recommended for the easiest setup
- **OR** Go 1.21+ and Node.js 18+ for local development

## Option 1: Docker (Recommended)

### 1. Clone the repository

```bash
git clone https://github.com/ArtemStepanov/caddy-orchestrator.git
cd caddy-orchestrator
```

### 2. Start with Docker Compose

```bash
docker-compose up -d
```

This will start:
- **Caddy Orchestrator** on http://localhost:3000
- **Test Caddy Instance** with Admin API on http://localhost:2019

### 3. Open your browser

Navigate to http://localhost:3000

### 4. Add your first instance

The test Caddy instance is already running. Add it to the orchestrator:

1. Click "Instances" in the sidebar
2. Click "Add Instance"
3. Fill in the details:
   - **Name**: Local Test
   - **Admin URL**: http://caddy-test:2019
   - **Auth Type**: none
4. Click "Test Connection"
5. Click "Save"

You should see the instance appear with a green "online" status!

### 5. Explore the features

- **Dashboard**: Overview of all instances
- **Config**: View and edit Caddy configurations
- **Upstreams**: Monitor reverse proxy upstreams
- **Certificates**: View PKI and certificate information

## Option 2: Local Development

### 1. Clone and setup

```bash
git clone https://github.com/ArtemStepanov/caddy-orchestrator.git
cd caddy-orchestrator
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Run the application

```bash
./caddy-orchestrator
```

Or using Make:

```bash
make run
```

### 3. Start a local Caddy instance

In another terminal:

```bash
caddy run --config Caddyfile
```

### 4. Access the application

Open http://localhost:3000 in your browser.

### 5. Add the local instance

- **Name**: Local Development
- **Admin URL**: http://localhost:2019
- **Auth Type**: none

## Option 3: Development Mode (Hot Reload)

### Terminal 1 - Backend

```bash
# Install air for hot reload (optional)
go install github.com/cosmtrek/air@latest

# Run with hot reload
air

# Or run directly
go run cmd/server/main.go
```

### Terminal 2 - Frontend

```bash
npm run dev
```

Frontend will be available at http://localhost:5173 and will proxy API requests to the backend.

## Next Steps

### Connect to a Remote Caddy Instance

1. **Ensure Remote Admin API is enabled**

   On your remote server, configure Caddy with remote admin:

   ```json
   {
     "admin": {
       "listen": "0.0.0.0:2019"
     }
   }
   ```

2. **Configure Firewall**

   Allow access to port 2019 from your orchestrator:

   ```bash
   ufw allow from YOUR_ORCHESTRATOR_IP to any port 2019
   ```

3. **Add Instance in Orchestrator**
   - **Name**: Production Server
   - **Admin URL**: http://server-ip:2019
   - **Auth Type**: none (or configure mTLS for security)

### Use Configuration Templates

1. Go to "Templates" page
2. Select a built-in template:
   - Basic Reverse Proxy
   - Static File Server
   - WebSocket Proxy
   - Load Balancer
3. Fill in the variables
4. Click "Generate"
5. Apply the generated configuration to an instance

### Secure Your Setup

For production use:

1. **Enable HTTPS**: Run behind a reverse proxy with HTTPS
2. **Use mTLS**: Configure mutual TLS for remote instances
3. **Change JWT Secret**: Set a strong `JWT_SECRET` environment variable
4. **Restrict CORS**: Configure specific origins in `config.yaml`
5. **Enable Firewall**: Only allow necessary ports

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed security setup.

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs caddy-orchestrator

# Check if port is already in use
lsof -i :3000
```

### Can't connect to Caddy instance

1. **Check if Caddy is running**:
   ```bash
   curl http://localhost:2019/config/
   ```

2. **Check Admin API is enabled**:
   Caddy must have admin API enabled (default: :2019)

3. **Check network connectivity**:
   ```bash
   ping caddy-host
   telnet caddy-host 2019
   ```

4. **Check firewall rules**:
   Ensure port 2019 is accessible

### Database errors

```bash
# Reset database (WARNING: deletes all data)
rm -f data/orchestrator.db

# Restart application
docker-compose restart caddy-orchestrator
```

### Frontend not loading

```bash
# Rebuild frontend
npm run build

# Rebuild Docker image
docker-compose build caddy-orchestrator
docker-compose up -d
```

## Common Tasks

### View Logs

```bash
# Docker
docker-compose logs -f caddy-orchestrator

# Local
tail -f logs/access.log
```

### Backup Database

```bash
# Copy database file
cp data/orchestrator.db data/orchestrator.db.backup

# With Docker
docker cp caddy-orchestrator:/root/data/orchestrator.db ./backup.db
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

## Getting Help

- **Documentation**: Check the [docs](./docs) folder
- **API Reference**: See [API.md](./API.md)
- **Issues**: [GitHub Issues](https://github.com/ArtemStepanov/caddy-orchestrator/issues)
- **Caddy Docs**: [Caddy Admin API](https://caddyserver.com/docs/api)

## What's Next?

Now that you have Caddy Orchestrator running, you can:

1. **Add multiple instances** - Manage all your Caddy servers from one place
2. **Create custom templates** - Build reusable configurations
3. **Automate deployments** - Use the API to automate configuration updates
4. **Monitor health** - Keep track of all instance statuses
5. **Explore advanced features** - Bulk operations, backups, audit logs

Happy orchestrating! 🎉
