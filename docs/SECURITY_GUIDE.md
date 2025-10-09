# Security Guide

This document outlines the security features implemented in the GPlus Recycling App and provides best practices for maintaining security.

## Authentication Security

### JWT Token Implementation

The application uses a two-token system for secure authentication:

1. **Access Token**:
   - Short-lived token (15 minutes by default)
   - Used to authenticate API requests
   - Stateless verification without database lookups
   - Contains user identity and permissions

2. **Refresh Token**:
   - Longer-lived token (7 days by default)
   - Used only to obtain new access tokens
   - Stored in HTTP-only cookies for XSS protection
   - Can be revoked server-side if needed

### Token Refresh Flow

1. When the access token expires, the client automatically attempts to refresh it
2. The refresh token is sent to the `/api/auth/refresh` endpoint
3. If valid, a new access token and CSRF token are issued
4. If invalid or expired, the user is redirected to login

## CSRF Protection

Cross-Site Request Forgery protection is implemented using the double submit cookie pattern:

1. A CSRF token is generated on login and token refresh
2. The token is stored in:
   - A JavaScript-readable cookie
   - The frontend application state
3. All mutating API requests must include the CSRF token in headers
4. The server validates the CSRF token against the expected value

## Frontend Security Measures

### Protected Routes

- Routes requiring authentication are wrapped with the `ProtectedRoute` component
- Unauthorized access attempts are redirected to the login page
- Role-based route protection prevents access to admin-only features

### Error Handling

- `ErrorBoundary` component catches and gracefully handles React rendering errors
- Centralized API error handling with the `useApiErrorHandler` hook
- Consistent error feedback through the Toast notification system
- Failed network requests are automatically retried with exponential backoff

### Form Security

- Input validation on both client and server
- Protection against common form attacks (SQL injection, XSS)
- Rate limiting for login attempts
- Feedback that doesn't leak sensitive information

## Backend Security Measures

### Password Security

- Passwords are never stored in plain text
- Bcrypt algorithm for password hashing with appropriate work factor
- Password complexity requirements enforced
- Secure password reset flow with time-limited tokens

### API Security

- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Principle of least privilege for API access
- Proper error messages that don't leak implementation details

### Database Security

- Parameterized queries to prevent SQL injection
- Limited database user permissions
- Connection pooling with appropriate timeout settings
- Data encryption for sensitive fields

## Security Headers

The application sets the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-XSS-Protection: 1; mode=block`

## Environment Security

- Secrets managed through environment variables or secure vaults
- No hardcoded credentials in the codebase
- Production environment variables separate from development
- Proper logging configuration to avoid sensitive data exposure

## Security Testing

- Automated security scanning in CI/CD pipeline
- Regular dependency updates to patch vulnerabilities
- OWASP Top 10 awareness and prevention
- Regular security reviews and updates


## Secret Rotation Protocol

This section describes the steps to detect, rotate, and clean secrets from the repository history, ensuring compliance with security best practices and the Sacred Structure.

### 1. Detecting Secrets in Commits

- Use automated tools (e.g., truffleHog, git-secrets, or GitHub's secret scanning) to scan for exposed secrets in commit history.
- Manual search: `git log -S <keyword>` or `git grep <pattern>`

### 2. Rotating or Revoking Exposed Secrets

- Immediately revoke or rotate any exposed secret (API key, webhook, token) via the provider's dashboard.
- Update all dependent systems to use the new secret.

### 3. Creating a Clean Branch (Recommended Workflow)

1. Stash or commit your current changes.
2. Checkout the latest main branch: `git checkout main && git pull origin main`
3. Create a new clean branch: `git checkout -b <clean-branch>`
4. Cherry-pick only safe commits: `git cherry-pick <commit1> <commit2> ...`
5. Verify no secrets remain: `git log -S <keyword>`
6. Push the clean branch and open a PR.

### 4. Verifying Clean History

- Use `git log -S <keyword>` and secret scanning tools to confirm no secrets remain in the branch history.
- Ensure CI/CD secret scanning passes before merging.

### 5. Updating Documentation and Workflows

- Document the incident and rotation steps in this guide.
- Update CI/CD workflows to include automated secret scanning.

## Reporting Security Issues

If you discover a security vulnerability, please report it by:

1. **Do not** disclose it publicly in GitHub issues
2. Email [security@gplusapp.example.com](mailto:security@gplusapp.example.com) with details
3. Allow time for the issue to be addressed before public disclosure

## Secret Scan Failure Response

When a secret scan fails in CI/CD:

1. Halt merge immediately and mark the PR as blocked.
2. Investigate with `git log -S <keyword>` to locate the offending commit(s).
3. Create a clean branch from `origin/main` and cherry-pick only safe commits, excluding affected ones.
4. Rotate/revoke any exposed secrets at the provider.
5. Rerun the secret scan workflow and verify results.
6. Log the incident in `docs/SECURITY_LOG.md` with date, branch, commits, actions taken.
