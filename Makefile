.PHONY: all build run dev docker clean test

# Build all
all: build

# Build backend
build:
	CC="zig cc" CGO_ENABLED=1 go build -o bin/caddy-orchestrator ./cmd/server

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
	CC="zig cc" CGO_ENABLED=1 go test ./...
	cd web && npm test -- run

# Clean build artifacts
clean:
	rm -rf bin/
	rm -rf web/dist/
	rm -rf web/node_modules/

# Install dependencies
deps:
	go mod download
	cd web && npm install
