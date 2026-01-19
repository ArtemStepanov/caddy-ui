# Task 01: Project Setup

## Objective
Create a new git branch for the lite version and set up the basic project structure.

## Prerequisites
- Git repository at `/home/artem/git/caddy-orchestrator`

## Steps

### 1.1 Create New Branch
```bash
git checkout -b lite
# Or if you want to start completely fresh:
git checkout --orphan lite
git reset --hard
```

### 1.2 Create Directory Structure
```
caddy-orchestrator-lite/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── api/
│   ├── caddy/
│   ├── config/
│   └── storage/
├── web/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   ├── index.html
│   └── package.json
├── go.mod
├── go.sum
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### 1.3 Initialize Go Module
```bash
go mod init github.com/ArtemStepanov/caddy-orchestrator-lite
```

### 1.4 Add Minimal Dependencies
**go.mod dependencies:**
```go
require (
    github.com/gin-gonic/gin v1.9.1
    github.com/mattn/go-sqlite3 v1.14.22
    github.com/google/uuid v1.6.0
)
```

### 1.5 Initialize Frontend (Preact + Vite)
```bash
cd web
npm create vite@latest . -- --template preact-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.6 Create Basic README
```markdown
# Caddy Orchestrator Lite

A simple web UI for managing Caddy server routes.

## Features
- Add/edit/delete routes via web UI
- Reverse proxy configuration
- Static file serving
- Redirects
- Header manipulation
- Basic auth protection
- Compression settings

## Quick Start
docker-compose up -d
# Access at http://localhost:3000
```

## Verification
- [ ] New branch created
- [ ] Directory structure in place
- [ ] Go module initializes without errors
- [ ] Frontend dev server starts with `npm run dev`

## Estimated Time
30 minutes

## Files Created
- `go.mod`
- `go.sum`
- `README.md`
- `web/package.json`
- `web/vite.config.ts`
- `web/tailwind.config.js`
- `web/index.html`
