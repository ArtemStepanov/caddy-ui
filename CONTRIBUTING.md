# Contributing to Caddy Orchestrator

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Go 1.25.6
- Node.js 20+
- Docker (optional)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ArtemStepanov/caddy-orchestrator.git
cd caddy-orchestrator

# Install dependencies
go mod download
npm install

# Run backend
go run cmd/server/main.go

# Run frontend (separate terminal)
npm run dev
```

## Making Changes

### Code Style

- **Go**: Run `go fmt ./...` and `go vet ./...`
- **TypeScript**: Run `npm run lint`
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) format:
  - `feat:` new features
  - `fix:` bug fixes
  - `docs:` documentation
  - `refactor:` code changes that don't add features or fix bugs

### Testing

```bash
# Backend tests
go test -v ./...

# Frontend tests
npm run test
```

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and commit
4. Push to your fork: `git push origin feat/my-feature`
5. Open a Pull Request

### PR Requirements

- All CI checks must pass
- Update documentation if needed
- Keep PRs focused and reasonably sized

## Reporting Issues

- Search existing issues before creating a new one
- Use the provided issue templates
- Include reproduction steps for bugs

## Questions?

Open a [Discussion](https://github.com/ArtemStepanov/caddy-orchestrator/discussions) for questions or ideas.
