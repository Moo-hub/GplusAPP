# Deployment Guide

## CORS Configuration

CORS configuration is loaded once at application startup from the FRONTEND_ORIGIN environment variable.
Any change to this variable requires restarting the application.

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
