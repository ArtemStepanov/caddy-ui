# CI Pipeline Setup Checklist

Use this checklist to verify your CI setup and configure GitHub repository settings.

## ✅ Files Verification

### GitHub Actions Workflows
- [x] `.github/workflows/ci.yml` - Main CI pipeline
- [x] `.github/workflows/pr-checks.yml` - PR validation
- [x] `.github/workflows/security.yml` - Security scanning
- [x] `.github/workflows/dependency-review.yml` - Dependency review
- [x] `.github/workflows/cleanup.yml` - Cleanup automation

### Configuration Files
- [x] `.golangci.yml` - Go linter configuration
- [x] `.gitattributes` - Git attributes for diffs
- [x] `.github/dependabot.yml` - Dependency automation
- [x] `.github/CODEOWNERS` - Code ownership

### Templates
- [x] `.github/pull_request_template.md` - PR template
- [x] `.github/ISSUE_TEMPLATE/bug_report.yml` - Bug reports
- [x] `.github/ISSUE_TEMPLATE/feature_request.yml` - Feature requests
- [x] `.github/ISSUE_TEMPLATE/config.yml` - Issue config

### Documentation
- [x] `.github/workflows/README.md` - Workflow documentation
- [x] `.github/CI_QUICK_REFERENCE.md` - Quick reference
- [x] `.github/WORKFLOWS.txt` - Visual diagram
- [x] `CI_SETUP.md` - Complete setup guide
- [x] `README.md` - Updated with CI badges

## 🔧 Repository Configuration

### Branch Protection (Main Branch)
- [ ] Navigate to Settings → Branches → Add rule for `main`
- [ ] Enable "Require a pull request before merging"
- [ ] Enable "Require status checks to pass before merging"
- [ ] Select required status checks:
  - [ ] Backend Lint
  - [ ] Backend Tests
  - [ ] Backend Build
  - [ ] Frontend Lint
  - [ ] Frontend Type Check
  - [ ] Frontend Build
  - [ ] Docker Build
  - [ ] CI Success
- [ ] Enable "Require branches to be up to date before merging"
- [ ] Enable "Do not allow bypassing the above settings"
- [ ] Save changes

### Security Settings
- [ ] Navigate to Settings → Security & analysis
- [ ] Enable "Dependabot alerts"
- [ ] Enable "Dependabot security updates"
- [ ] Enable "Dependabot version updates" (should auto-enable with dependabot.yml)
- [ ] Enable "Code scanning" (CodeQL should auto-enable with workflow)
- [ ] Enable "Secret scanning"

### Actions Settings
- [ ] Navigate to Settings → Actions → General
- [ ] Under "Actions permissions", select "Allow all actions and reusable workflows"
- [ ] Under "Workflow permissions", select "Read and write permissions"
- [ ] Enable "Allow GitHub Actions to create and approve pull requests" (for Dependabot)
- [ ] Save

### Secrets (Optional)
- [ ] Navigate to Settings → Secrets and variables → Actions
- [ ] Add `CODECOV_TOKEN` if using Codecov (optional)

## 🧪 Testing the Pipeline

### Initial Test
- [ ] Push current branch to GitHub
- [ ] Check Actions tab for workflow runs
- [ ] Verify all jobs pass (or identify expected failures)
- [ ] Review any linter warnings/errors

### Pull Request Test
- [ ] Create a test PR from current branch to main
- [ ] Verify PR checks run automatically
- [ ] Check that PR template appears
- [ ] Verify PR gets size label
- [ ] Verify coverage comment appears (if tests exist)
- [ ] Check dependency review runs

### Security Scan Test
- [ ] Wait for weekly security scan or trigger manually
- [ ] Navigate to Security → Code scanning
- [ ] Verify CodeQL results appear
- [ ] Navigate to Security → Dependabot
- [ ] Verify Dependabot is monitoring dependencies

## 📝 Post-Setup Tasks

### Documentation
- [ ] Review `CI_SETUP.md` for complete documentation
- [ ] Share `.github/CI_QUICK_REFERENCE.md` with team
- [ ] Update team on new PR requirements
- [ ] Document any project-specific CI customizations

### Team Communication
- [ ] Notify team about new CI pipeline
- [ ] Share conventional commit format guidelines
- [ ] Explain PR template requirements
- [ ] Set expectations for CI check times

### Monitoring
- [ ] Bookmark Actions dashboard
- [ ] Set up notifications for failed workflows
- [ ] Schedule weekly review of security alerts
- [ ] Monitor Dependabot PRs

## 🎯 Optional Enhancements

### Code Coverage
- [ ] Set up Codecov account
- [ ] Add `CODECOV_TOKEN` secret
- [ ] Configure coverage thresholds in Codecov settings
- [ ] Add coverage badge to README

### Status Badges
- [x] CI Pipeline badge added to README
- [x] Security Scanning badge added to README
- [ ] Add Codecov badge (if using)
- [ ] Add Go Report Card badge
- [ ] Add License badge

### Advanced CI Features
- [ ] Add performance benchmarking workflow
- [ ] Set up nightly builds
- [ ] Add end-to-end testing
- [ ] Configure release automation (for CD)
- [ ] Add integration tests

### Code Quality Tools
- [ ] Set up SonarCloud (optional)
- [ ] Configure code coverage minimum thresholds
- [ ] Add pre-commit hooks for local development
- [ ] Set up commit message linting

## ✨ Success Criteria

Your CI is properly set up when:
- [x] All workflow files are committed and pushed
- [ ] Workflows run automatically on push/PR
- [ ] All jobs pass (or only expected failures)
- [ ] Branch protection is enabled
- [ ] Security scanning is active
- [ ] Dependabot is creating PRs
- [ ] Team is aware of new processes
- [ ] Documentation is accessible

## 🔍 Verification Commands

Run these locally to verify CI will pass:

```bash
# Backend checks
gofmt -l .                              # Should return nothing
golangci-lint run ./...                 # Should pass
go vet ./...                            # Should pass
go test -v -race ./...                  # Should pass
go mod verify                           # Should pass

# Frontend checks
npm run lint                            # Should pass
npx tsc --noEmit                        # Should pass
npm run build                           # Should succeed

# Docker check
docker build -t test .                  # Should succeed
```

## 📞 Support

If you encounter issues:

1. Check workflow logs in Actions tab
2. Review troubleshooting section in `.github/workflows/README.md`
3. Consult `CI_SETUP.md` for detailed documentation
4. Search existing issues
5. Create new issue using bug report template

## 📊 Expected Workflow Times

- **ci.yml**: 8-12 minutes (backend tests dominate)
- **pr-checks.yml**: 5-8 minutes (depends on changes)
- **security.yml**: 10-15 minutes (CodeQL takes time)
- **dependency-review**: 2-3 minutes
- **cleanup**: 1-2 minutes

## 🎉 Completion

Once all items are checked:
- [ ] CI pipeline is fully operational
- [ ] Team is trained on new processes
- [ ] Monitoring is in place
- [ ] Documentation is complete

---

**Date Setup Completed**: _____________

**Configured By**: _____________

**Next Review Date**: _____________ (recommend quarterly)
