# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-build

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Backend ---
FROM golang:1.23.2-alpine AS backend-build

WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend-build /frontend/dist ./frontend/dist
RUN go build -o /server .

# --- Final Stage: Run the Application ---
FROM alpine:latest
COPY --from=backend-build /server /server
COPY --from=backend-build /app/frontend/dist /frontend/dist
EXPOSE 8080
CMD ["/server"]