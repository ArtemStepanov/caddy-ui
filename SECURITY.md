# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing the maintainers directly instead of opening a public issue.

**Email:** [Create a private security advisory](https://github.com/ArtemStepanov/caddy-orchestrator/security/advisories/new)

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

## Response Timeline

- **Initial response:** Within 48 hours
- **Status update:** Within 7 days
- **Fix timeline:** Depends on severity

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |

## Security Best Practices

When deploying Caddy Orchestrator:

1. **Set a strong JWT_SECRET** - Use a randomly generated 32+ character secret
2. **Use HTTPS** - Deploy behind a reverse proxy with TLS
3. **Restrict network access** - Limit access to the admin interface
4. **Keep updated** - Regularly update to the latest version
