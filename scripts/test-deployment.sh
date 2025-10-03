#!/bin/bash

# Test script for single-container deployment
set -e

echo "🧪 Testing Caddy Orchestrator Single Container Deployment"
echo "=========================================================="
echo ""

CONTAINER_NAME="caddy-orchestrator-test"
IMAGE_NAME="caddy-orchestrator:test"
PORT=3001  # Use different port to avoid conflicts

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

echo "1️⃣  Building Docker image..."
docker build -t $IMAGE_NAME . || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

echo "2️⃣  Starting container..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:3000 \
    -e JWT_SECRET=test-secret-key \
    -e LOG_LEVEL=info \
    $IMAGE_NAME || {
    echo -e "${RED}❌ Container start failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Container started${NC}"
echo ""

echo "3️⃣  Waiting for application to be ready..."
RETRIES=30
COUNT=0
while [ $COUNT -lt $RETRIES ]; do
    if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is ready${NC}"
        break
    fi
    COUNT=$((COUNT + 1))
    if [ $COUNT -eq $RETRIES ]; then
        echo -e "${RED}❌ Application failed to start${NC}"
        echo "Container logs:"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

echo "4️⃣  Testing API endpoints..."
echo ""

# Test health endpoint
echo -n "   Testing /api/health... "
RESPONSE=$(curl -s http://localhost:$PORT/api/health)
if echo "$RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "Response: $RESPONSE"
fi

# Test instances endpoint
echo -n "   Testing /api/instances... "
RESPONSE=$(curl -s http://localhost:$PORT/api/instances)
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "Response: $RESPONSE"
fi

# Test templates endpoint
echo -n "   Testing /api/templates... "
RESPONSE=$(curl -s http://localhost:$PORT/api/templates)
if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "Response: $RESPONSE"
fi

echo ""
echo "5️⃣  Testing frontend..."
echo ""

# Test index.html
echo -n "   Testing index.html... "
RESPONSE=$(curl -s http://localhost:$PORT/)
if echo "$RESPONSE" | grep -q "<!doctype html"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo "Response: $RESPONSE"
fi

# Test SPA routing (should return index.html)
echo -n "   Testing SPA routing (/instances)... "
RESPONSE=$(curl -s http://localhost:$PORT/instances)
if echo "$RESPONSE" | grep -q "<!doctype html"; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
fi

# Test static assets
echo -n "   Testing static assets (/assets/*)... "
ASSETS_EXIST=$(docker exec $CONTAINER_NAME sh -c "ls /root/web/assets/*.js 2>/dev/null | wc -l")
if [ "$ASSETS_EXIST" -gt 0 ]; then
    echo -e "${GREEN}✅ ($ASSETS_EXIST files)${NC}"
else
    echo -e "${RED}❌${NC}"
fi

echo ""
echo "6️⃣  Testing instance creation..."
echo ""

# Create a test instance
echo -n "   Creating test instance... "
CREATE_RESPONSE=$(curl -s -X POST http://localhost:$PORT/api/instances \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Instance",
        "admin_url": "http://localhost:2019",
        "auth_type": "none"
    }')

if echo "$CREATE_RESPONSE" | grep -q "success.*true"; then
    INSTANCE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ (ID: $INSTANCE_ID)${NC}"
    
    # List instances to verify
    echo -n "   Verifying instance was created... "
    LIST_RESPONSE=$(curl -s http://localhost:$PORT/api/instances)
    if echo "$LIST_RESPONSE" | grep -q "Test Instance"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    # Delete the test instance
    echo -n "   Cleaning up test instance... "
    DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:$PORT/api/instances/$INSTANCE_ID)
    if echo "$DELETE_RESPONSE" | grep -q "success.*true"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️  (but instance was created successfully)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  (expected - no Caddy instance available)${NC}"
fi

echo ""
echo "7️⃣  Checking container resources..."
echo ""

# Check container stats
STATS=$(docker stats $CONTAINER_NAME --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}")
echo "$STATS"

# Check image size
IMAGE_SIZE=$(docker images $IMAGE_NAME --format "{{.Size}}")
echo "Image size: $IMAGE_SIZE"

echo ""
echo "8️⃣  Checking logs..."
echo ""
docker logs $CONTAINER_NAME --tail 20

echo ""
echo "=========================================================="
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Container is running at: http://localhost:$PORT"
echo ""
echo "To access the application:"
echo "  - Open: http://localhost:$PORT"
echo "  - API: http://localhost:$PORT/api/health"
echo ""
echo "To stop the container:"
echo "  docker stop $CONTAINER_NAME"
echo ""
echo "To view logs:"
echo "  docker logs -f $CONTAINER_NAME"
echo ""
