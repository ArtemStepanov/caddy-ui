# Build stage for Go backend
FROM golang:1.25-alpine AS go-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev sqlite-dev

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY config/ ./config/

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -o caddy-orchestrator ./cmd/server

# Build stage for frontend
FROM node:25-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy frontend source
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY components.json ./
COPY src/ ./src/
COPY public/ ./public/

# Build frontend
RUN npm run build

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates sqlite-libs

WORKDIR /root/

# Copy backend binary
COPY --from=go-builder /app/caddy-orchestrator .

# Copy frontend build
COPY --from=frontend-builder /app/dist ./web

# Copy default config (using example as template)
COPY config/config.yaml.example ./config/config.yaml

# Create data directory
RUN mkdir -p ./data ./templates

# Expose port
EXPOSE 3000

# Set environment variables
ENV GIN_MODE=release

# Create volume for persistent data
VOLUME ["/root/data"]

# Run the application
CMD ["./caddy-orchestrator"]
