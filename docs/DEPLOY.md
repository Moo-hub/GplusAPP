# Deployment Guide

## Security Configuration

### CORS Configuration

CORS configuration is loaded once at application startup from the FRONTEND_ORIGIN environment variable.
Any change to this variable requires restarting the application.

### JWT Token Authentication

The application uses JWT tokens for authentication with the following security features:

- **Access Tokens:** Short-lived tokens (15 minutes) used for API authentication
- **Refresh Tokens:** Longer-lived tokens (7 days) used to obtain new access tokens
- **Token Refresh:** Automatic token refresh mechanism in the frontend to maintain sessions
- **CSRF Protection:** Double submit cookie pattern implementation for protection against CSRF attacks

#### Required Environment Variables:

- `JWT_SECRET_KEY`: Secret key for signing JWT tokens
- `JWT_ALGORITHM`: Algorithm for JWT signing (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Lifetime of access tokens in minutes (default: 15)
- `REFRESH_TOKEN_EXPIRE_DAYS`: Lifetime of refresh tokens in days (default: 7)

## CI/CD Pipeline

The backend uses GitHub Actions for continuous integration and quality enforcement. The pipeline runs automatically on every push and pull request.

- **Lint:** Runs black, isort, and flake8 on all backend code and tests. Fails if any style or lint errors are found.
- **Test:** Runs pytest with coverage. The build fails if coverage is below 85%. Coverage results are shown in the GitHub Actions output.
- **Security:** Runs bandit for static security analysis. The build fails if any medium or high severity issues are found.

### Coverage Threshold

Coverage must be at least 85% for the test job to pass. If coverage drops below this threshold, the workflow will fail and block merges.

### Rerunning Jobs

You can rerun failed jobs from the GitHub Actions UI. Click on the failed workflow run, then click "Re-run jobs".

### Interpreting Results

- Green check: All jobs passed, code is safe to merge.
- Red X: At least one job failed. Click the job for details and fix issues before merging.
