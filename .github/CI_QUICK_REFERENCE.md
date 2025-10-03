# CI Pipeline Quick Reference

## 🚀 Quick Commands

### Local Testing (Before Push)
```bash
# Full check
make lint && make test && make build

# Individual checks
make lint           # Run all linters
make test           # Run Go tests
make build          # Build frontend + backend
npm run lint        # Frontend lint only
npx tsc --noEmit    # TypeScript check only
```

### Fix Common Issues
```bash
# Fix Go formatting
gofmt -w .

# Fix frontend lint issues
npm run lint -- --fix

# Update dependencies
go mod tidy         # Go
npm install         # Frontend
```

## 📋 Workflows Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push, PR | Main CI pipeline (lint, test, build) |
| `pr-checks.yml` | PR | PR validation, size labels, coverage |
| `security.yml` | Push, PR, Weekly | Security scanning, vulnerability detection |
| `dependency-review.yml` | PR | Dependency security and license check |
| `cleanup.yml` | Weekly, Manual | Cleanup old workflow runs |

## ✅ CI Checklist

### Before Creating a PR
- [ ] All tests pass locally (`make test`)
- [ ] Code is formatted (`gofmt -l .` returns nothing)
- [ ] Linter passes (`make lint`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Build succeeds (`make build`)
- [ ] Commit messages follow conventions

### PR Requirements
- [ ] PR title uses conventional commits format
- [ ] PR template is filled out
- [ ] Tests added for new features/fixes
- [ ] Documentation updated if needed
- [ ] All CI checks pass (green)
- [ ] No security vulnerabilities introduced

## 🔧 Conventional Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools
- `ci`: Changes to CI configuration files

**Examples:**
```bash
git commit -m "feat: add instance health check endpoint"
git commit -m "fix: resolve race condition in config update"
git commit -m "docs: update API documentation for bulk operations"
git commit -m "chore(deps): update Go dependencies"
```

## 🐛 Troubleshooting

### "Go format check failed"
```bash
gofmt -w .
git add .
git commit --amend --no-edit
```

### "Linter found issues"
```bash
golangci-lint run ./... --fix
npm run lint -- --fix
```

### "Tests failing"
```bash
# Run verbose
go test -v ./...

# Run specific test
go test -v -run TestName ./path

# Check for race conditions
go test -race ./...
```

### "Docker build failed"
```bash
# Clean build
docker system prune -f
docker build --no-cache -t caddy-orchestrator:local .
```

### "Dependencies out of sync"
```bash
# Go
go mod tidy
go mod verify

# NPM
rm -rf node_modules package-lock.json
npm install
```

## 📊 CI Status

### Check CI Status
- [Actions Dashboard](../../actions)
- [Security Alerts](../../security)
- [Dependabot PRs](../../pulls?q=is%3Apr+author%3Aapp%2Fdependabot)

### Required Checks for Merge
1. Backend Lint ✓
2. Backend Tests ✓
3. Backend Build ✓
4. Frontend Lint ✓
5. Frontend Type Check ✓
6. Frontend Build ✓
7. Docker Build ✓
8. CI Success ✓

## 🔐 Security

### Security Scans Run
- **Gosec**: Go code security
- **govulncheck**: Go vulnerability database
- **npm audit**: NPM package vulnerabilities
- **Trivy**: Container and filesystem scanning
- **CodeQL**: Advanced semantic analysis

### Reviewing Security Alerts
1. Check [Security Tab](../../security)
2. Review alerts and recommendations
3. Update dependencies if needed
4. Re-run security workflows to verify

## 📦 Dependabot

### Automated Updates
- **Schedule**: Weekly, Mondays at 9 AM UTC
- **Categories**:
  - Go modules
  - NPM packages (grouped)
  - GitHub Actions
  - Docker images

### Reviewing Dependabot PRs
1. Check changelog/release notes
2. Review security advisories
3. Run tests locally if major update
4. Merge if all checks pass

## 💡 Tips

### Speed Up CI
- Use `[skip ci]` in commit message to skip (use sparingly!)
- Keep PRs small and focused
- Write fast, isolated tests
- Use caching (already configured)

### Best Practices
- ✅ Run checks locally before pushing
- ✅ Keep dependencies updated
- ✅ Write tests for new code
- ✅ Follow conventional commits
- ✅ Keep PRs under 500 lines when possible
- ✅ Address CI failures immediately
- ✅ Don't merge with failing checks

### Getting Help
- Check [Workflow README](workflows/README.md) for details
- Review [CI_SETUP.md](../../CI_SETUP.md) for full documentation
- Search [existing issues](../../issues)
- Ask in [Discussions](../../discussions)

## 🎯 Success Metrics

Good CI health indicators:
- ✅ >95% success rate on main branch
- ✅ Average PR approval time < 24h
- ✅ Test coverage >70%
- ✅ No critical security vulnerabilities
- ✅ All dependencies up to date (< 30 days)

---

Last updated: 2025-10-03
