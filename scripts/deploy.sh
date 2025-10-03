#!/bin/bash

# Production deployment script for Caddy Orchestrator
set -e

echo "🚀 Caddy Orchestrator - Production Deployment"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo ""
    echo "Creating from example..."
    cp .env.production.example .env.production
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s|your-super-secret-jwt-key-change-this-in-production|$JWT_SECRET|g" .env.production
    rm .env.production.bak 2>/dev/null || true
    
    echo -e "${GREEN}✅ Created .env.production with random JWT_SECRET${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Please review .env.production before continuing${NC}"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to abort..."
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📋 Configuration:"
echo "   - JWT_SECRET: ${JWT_SECRET:0:10}... (${#JWT_SECRET} chars)"
echo "   - LOG_LEVEL: ${LOG_LEVEL:-info}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Build the image
echo "🔨 Building Docker image..."
docker-compose -f docker-compose.prod.yml build || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Check if container is already running
if docker ps -a --format '{{.Names}}' | grep -q '^caddy-orchestrator$'; then
    echo -e "${YELLOW}⚠️  Existing container found${NC}"
    echo ""
    read -p "Stop and remove existing container? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping and removing existing container..."
        docker-compose -f docker-compose.prod.yml down
        echo -e "${GREEN}✅ Removed${NC}"
    else
        echo "Aborting deployment"
        exit 1
    fi
    echo ""
fi

# Start the container
echo "🚀 Starting container..."
docker-compose -f docker-compose.prod.yml up -d || {
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
}
echo -e "${GREEN}✅ Container started${NC}"
echo ""

# Wait for health check
echo "⏳ Waiting for application to be ready..."
RETRIES=30
COUNT=0
while [ $COUNT -lt $RETRIES ]; do
    if docker-compose -f docker-compose.prod.yml ps | grep -q "healthy"; then
        echo -e "${GREEN}✅ Application is healthy${NC}"
        break
    fi
    COUNT=$((COUNT + 1))
    if [ $COUNT -eq $RETRIES ]; then
        echo -e "${RED}❌ Application failed health check${NC}"
        echo ""
        echo "Logs:"
        docker-compose -f docker-compose.prod.yml logs --tail 50
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Show status
echo ""
echo "📊 Deployment Status:"
echo ""
docker-compose -f docker-compose.prod.yml ps
echo ""

# Test endpoints
echo "🧪 Testing endpoints..."
echo ""

sleep 2  # Give it a moment to fully start

# Test health
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    echo -e "   ${GREEN}✅${NC} Health check: http://localhost:3000/api/health"
else
    echo -e "   ${YELLOW}⚠️${NC}  Health check may not be responding yet"
fi

# Test frontend
if curl -s http://localhost:3000/ | grep -q "<!doctype html"; then
    echo -e "   ${GREEN}✅${NC} Frontend: http://localhost:3000/"
else
    echo -e "   ${YELLOW}⚠️${NC}  Frontend may not be responding yet"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🌐 Access your application:"
echo "   - URL: http://localhost:3000"
echo "   - API: http://localhost:3000/api"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:    docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Stop:         docker-compose -f docker-compose.prod.yml stop"
echo "   - Restart:      docker-compose -f docker-compose.prod.yml restart"
echo "   - Remove:       docker-compose -f docker-compose.prod.yml down"
echo "   - Stats:        docker stats caddy-orchestrator"
echo ""
echo "💾 Data is persisted in Docker volume: caddy-orchestrator-data"
echo ""
echo "🔐 Security reminders:"
echo "   - Change JWT_SECRET to a strong random value"
echo "   - Configure CORS_ORIGINS for your domain"
echo "   - Run behind HTTPS reverse proxy in production"
echo "   - Set up regular backups of the data volume"
echo ""
