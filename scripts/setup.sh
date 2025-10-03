#!/bin/bash

# Setup script for Caddy Orchestrator
set -e

echo "🚀 Setting up Caddy Orchestrator..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Go $(go version | awk '{print $3}')"
echo "✅ Node.js $(node --version)"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p logs
mkdir -p templates

# Install Go dependencies
echo "📦 Installing Go dependencies..."
go mod download

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Build backend
echo "🔨 Building backend..."
CGO_ENABLED=1 go build -o caddy-orchestrator ./cmd/server

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the application:"
echo "  ./caddy-orchestrator"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
echo "Or use Make:"
echo "  make run"
echo ""
echo "Access the application at: http://localhost:3000"
