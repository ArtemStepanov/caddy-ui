.PHONY: help build run dev clean docker docker-up docker-down test lint

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the application
	@echo "Building frontend..."
	npm run build
	@echo "Building backend..."
	CGO_ENABLED=1 go build -o caddy-orchestrator ./cmd/server
	@echo "Build complete!"

run: build ## Build and run the application
	./caddy-orchestrator

dev-backend: ## Run backend in development mode
	go run cmd/server/main.go

dev-frontend: ## Run frontend in development mode
	npm run dev

dev: ## Run both frontend and backend (requires two terminals)
	@echo "Run 'make dev-backend' in one terminal and 'make dev-frontend' in another"

clean: ## Clean build artifacts
	rm -f caddy-orchestrator
	rm -rf dist
	rm -rf data/*.db
	rm -rf logs

docker: ## Build Docker image
	docker build -t caddy-orchestrator:latest .

docker-up: ## Start services with Docker Compose
	docker-compose up -d

docker-down: ## Stop services with Docker Compose
	docker-compose down

docker-logs: ## Show Docker logs
	docker-compose logs -f

test: ## Run tests
	go test -v ./...

test-coverage: ## Run tests with coverage
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

lint: ## Run linters
	golangci-lint run ./...
	npm run lint

deps: ## Install dependencies
	go mod download
	npm install

tidy: ## Tidy Go modules
	go mod tidy

format: ## Format code
	go fmt ./...
	npm run format

install-tools: ## Install development tools
	go install github.com/cosmtrek/air@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

migrate: ## Create database migrations (if needed)
	@echo "Database auto-migrates on startup"

init-data: ## Initialize with sample data
	@echo "Creating sample instance..."
	curl -X POST http://localhost:3000/api/instances \
		-H "Content-Type: application/json" \
		-d '{"name":"Local Caddy","admin_url":"http://localhost:2019","auth_type":"none"}'
