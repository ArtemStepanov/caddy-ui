# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and continuous deployment.

## Available Workflows

### 1. CI Pipeline (`ci.yml`)
**Trigger**: Push to `main`, `develop`, or `cursor/**` branches; Pull requests to `main` and `develop`

**Jobs**:
- **backend-lint**: Lints Go code using gofmt, golangci-lint, and go vet
- **backend-test**: Runs Go tests with race detection and coverage
- **backend-build**: Builds the Go backend binary
- **frontend-lint**: Runs ESLint on TypeScript/React code
- **frontend-typecheck**: Validates TypeScript types
- **frontend-build**: Builds the frontend with Vite
- **docker-build**: Verifies Docker image can be built
- **ci-success**: Aggregates all job results

**Artifacts**:
- Backend binary (retention: 7 days)
- Frontend dist folder (retention: 7 days)
- Test coverage reports (uploaded to Codecov)

### 2. Pull Request Checks (`pr-checks.yml`)
**Trigger**: Pull request opened, synchronized, or reopened

**Jobs**:
- **pr-metadata**: Validates PR title follows conventional commits, adds size labels
- **changes**: Detects which parts of the codebase changed (backend/frontend/docker/docs)
- **backend-checks**: Runs additional backend checks if Go files changed
- **frontend-checks**: Runs additional frontend checks if JS/TS files changed
- **comment-coverage**: Posts test coverage as a PR comment

**Features**:
- Smart change detection to skip unnecessary jobs
- Conventional commit validation
- Automatic PR size labeling
- Coverage reporting in PR comments

### 3. Security Scanning (`security.yml`)
**Trigger**: Push to main/develop, Pull requests, Weekly schedule (Mondays at 9 AM UTC)

**Jobs**:
- **gosec**: Go security scanner for common security issues
- **dependency-scan-go**: Scans Go dependencies for vulnerabilities using govulncheck
- **dependency-scan-npm**: Scans npm dependencies using npm audit
- **trivy-scan**: Filesystem vulnerability scanning
- **docker-scan**: Docker image vulnerability scanning with Trivy
- **codeql**: Advanced semantic code analysis for Go and JavaScript

**Security Features**:
- SARIF report upload to GitHub Security tab
- Scheduled weekly scans
- Multi-layer security scanning (code, dependencies, containers)

### 4. Dependency Review (`dependency-review.yml`)
**Trigger**: Pull requests to main/develop

**Jobs**:
- **dependency-review**: Reviews dependency changes for security issues and license compliance

**Features**:
- Fails on moderate or higher severity vulnerabilities
- Blocks GPL-3.0 and AGPL-3.0 licenses
- Comments summary on PR when issues found

### 5. Cleanup (`cleanup.yml`)
**Trigger**: Weekly schedule (Sundays at midnight UTC), Manual dispatch

**Jobs**:
- **cleanup-caches**: Placeholder for cache cleanup
- **cleanup-artifacts**: Deletes workflow runs older than 30 days

## Configuration Files

### `.golangci.yml`
Configures golangci-lint with the following linters:
- errcheck, gosimple, govet, ineffassign, staticcheck, unused
- gofmt, goimports, misspell, revive
- gosec (security), unconvert, unparam
- goconst, gocritic

## Quick Start

### Running CI Locally

**Backend checks**:
```bash
# Lint
make lint
golangci-lint run ./...

# Test
make test

# Build
make build
```

**Frontend checks**:
```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build
```

**Docker**:
```bash
# Build
docker build -t caddy-admin-ui:local .
```

## Status Badges

Add these badges to your README.md:

```markdown
[![CI Pipeline](https://github.com/ArtemStepanov/caddy-admin-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/ArtemStepanov/caddy-admin-ui/actions/workflows/ci.yml)
[![Security Scanning](https://github.com/ArtemStepanov/caddy-admin-ui/actions/workflows/security.yml/badge.svg)](https://github.com/ArtemStepanov/caddy-admin-ui/actions/workflows/security.yml)
```

## Required Secrets

No secrets are required for the basic CI workflows. Optional:

- `CODECOV_TOKEN`: For uploading coverage to Codecov (optional, will continue on error)

## Best Practices

1. **Commit Messages**: Use conventional commits format (feat:, fix:, docs:, etc.)
2. **Pull Requests**: Keep PRs small (under 500 lines when possible)
3. **Tests**: Ensure tests pass locally before pushing
4. **Dependencies**: Review dependency changes carefully
5. **Security**: Address security scan findings promptly

## Troubleshooting

### CI Failing on Dependencies
```bash
# Backend
go mod tidy
go mod verify

# Frontend
rm -rf node_modules package-lock.json
npm install
```

### Linter Errors
```bash
# Auto-fix Go formatting
gofmt -w .

# Auto-fix frontend issues
npm run lint -- --fix
```

### Test Failures
```bash
# Run tests with verbose output
go test -v ./...

# Run specific test
go test -v -run TestName ./path/to/package
```

## Performance Optimization

The workflows use several optimization techniques:
- **Caching**: Go modules and npm packages are cached
- **Parallel Jobs**: Independent jobs run in parallel
- **Conditional Execution**: Jobs skip when changes don't affect them
- **Docker Buildx**: Uses GitHub Actions cache for Docker layers

## Future Enhancements

Consider adding:
- [ ] End-to-end testing workflow
- [ ] Performance benchmarking
- [ ] Nightly builds
- [ ] Release automation
- [ ] Deployment workflows (CD)
- [ ] Integration testing with external services
