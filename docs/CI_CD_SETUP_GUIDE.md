# GitHub Actions CI/CD Setup Guide

This guide explains how to set up the necessary GitHub Actions secrets for the CI/CD pipeline in GplusApp.

## CI/CD Workflow Files

The repository contains multiple GitHub Actions workflow files:

1. **full-ci-cd.yml**: Main CI/CD pipeline that runs on pull requests and pushes to the develop branch. Handles testing, building, and Vercel deployment.

2. **production-deployment.yml**: Production deployment workflow that triggers on pushes to the main branch or version tags. Handles testing, building Docker images, and deploying to staging or production servers via SSH.

3. **local-testing.yml**: Simplified workflow for local development testing without requiring secrets.

## GitHub Actions Used

The CI/CD pipeline uses the latest stable versions of GitHub Actions:

- actions/checkout@v4
- actions/setup-python@v5 (with pip caching)
- actions/setup-node@v4 (testing with Node.js 18.x and 20.x)
- actions/upload-artifact@v4
- docker/login-action@v3
- docker/setup-buildx-action@v3
- docker/metadata-action@v5
- docker/build-push-action@v5
- webfactory/ssh-agent@v0.9.0
- amondnet/vercel-action@v41.1.4
- slackapi/slack-github-action@v1.25.0

## Required Secrets

To make the CI/CD pipeline work correctly, you need to add the following secrets to your GitHub repository:

### 1. Vercel Deployment (Frontend)

| Secret Name | Description |
|-------------|-------------|
| `VERCEL_TOKEN` | Your Vercel API token. Generate it at [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID. Find it in your project settings or in the `.vercel` folder after linking your project locally |
| `VERCEL_PROJECT_ID` | Your Vercel project ID. Find it in your project settings or in the `.vercel` folder after linking your project locally |

### 2. Docker Hub (Backend)

| Secret Name | Description |
|-------------|-------------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token (recommended) |

### 3. Slack Notifications

| Secret Name | Description |
|-------------|-------------|
| `SLACK_WEBHOOK_URL` | Your Slack webhook URL for posting notifications |

### 4. Production/Staging Deployment

| Secret Name | Description |
|-------------|-------------|
| `SSH_PRIVATE_KEY` | SSH private key for accessing both staging and production servers |
| `STAGING_SERVER_HOST` | Hostname or IP address of the staging server |
| `STAGING_SERVER_USER` | SSH username for the staging server |
| `PRODUCTION_SERVER_HOST` | Hostname or IP address of the production server |
| `PRODUCTION_SERVER_USER` | SSH username for the production server |

### 5. Environment Variables for Deployment

| Secret Name | Description |
|-------------|-------------|
| `POSTGRES_PASSWORD` | Password for PostgreSQL database |
| `REDIS_PASSWORD` | Password for Redis |
| `JWT_SECRET_KEY` | Secret key for JWT token generation and validation |
| `SMTP_SERVER` | SMTP server address for sending emails |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USERNAME` | SMTP server username |
| `SMTP_PASSWORD` | SMTP server password |
| `GRAFANA_ADMIN_PASSWORD` | Admin password for Grafana dashboard |
| `PROMETHEUS_AUTH_PASSWORD` | Authentication password for Prometheus |
| `PGADMIN_DEFAULT_PASSWORD` | Default password for PgAdmin interface |

## How to Add Secrets to GitHub

1. Navigate to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Enter the name and value of the secret
6. Click "Add secret"
7. Repeat for each required secret

## Setting Up Vercel Project

To get the Vercel organization ID and project ID:

1. Install the Vercel CLI: `npm install -g vercel`
2. Navigate to your frontend folder: `cd frontend`
3. Link your project: `vercel link`
4. Follow the prompts to link to an existing project or create a new one
5. After linking, check the `.vercel/project.json` file for your `orgId` and `projectId`

## Setting Up Docker Hub

1. Create a Docker Hub account if you don't have one: [hub.docker.com/signup](https://hub.docker.com/signup)
2. Consider creating an access token instead of using your password: [hub.docker.com/settings/security](https://hub.docker.com/settings/security)
3. Use your username and the token in GitHub secrets

## Setting Up Slack Webhook

1. Create a new Slack app in your workspace: [api.slack.com/apps](https://api.slack.com/apps)
2. Enable "Incoming Webhooks" feature
3. Create a new webhook URL for a specific channel
4. Copy the webhook URL to your GitHub secrets

## Setting Up SSH Deployment

1. Generate an SSH key pair (if you don't already have one):

   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy@example.com"
   ```
   
2. Add the public key to the `~/.ssh/authorized_keys` file on both your staging and production servers.

3. Add the entire content of the private key file to the `SSH_PRIVATE_KEY` GitHub secret.

4. Add the server details to the respective GitHub secrets:
   - `STAGING_SERVER_HOST`: Hostname or IP of your staging server
   - `STAGING_SERVER_USER`: Username for SSH access to staging server
   - `PRODUCTION_SERVER_HOST`: Hostname or IP of your production server
   - `PRODUCTION_SERVER_USER`: Username for SSH access to production server

## Setting Up Environment Variables for Deployment

The deployment workflow uses several environment variables that are passed to the deployed application. These values are set as GitHub secrets and injected into the `.env` file during deployment:

1. **Database Configuration**
   - `POSTGRES_PASSWORD`: Set a strong password for your PostgreSQL database

2. **Redis Configuration**
   - `REDIS_PASSWORD`: Set a strong password for Redis

3. **JWT Authentication**
   - `JWT_SECRET_KEY`: Generate a strong random string for signing JWT tokens, e.g.:
     
     ```bash
     openssl rand -hex 32
     ```

4. **Email Settings**
   - `SMTP_SERVER`: Your SMTP server address (e.g., smtp.gmail.com)
   - `SMTP_PORT`: SMTP port (typically 587 for TLS)
   - `SMTP_USERNAME`: Your SMTP account username/email
   - `SMTP_PASSWORD`: Your SMTP account password or app-specific password

5. **Monitoring & Alerting**
   - `GRAFANA_ADMIN_PASSWORD`: Set a strong password for Grafana admin access
   - `PROMETHEUS_AUTH_PASSWORD`: Set a password for Prometheus authentication

6. **PgAdmin Settings**
   - `PGADMIN_DEFAULT_PASSWORD`: Set a password for PgAdmin interface access

## Testing the Workflow

After setting up all secrets:

1. Make a small change to your code
2. Commit and push to either the `main` or `develop` branch
3. Go to the "Actions" tab in your GitHub repository to monitor the workflow

The full CI/CD pipeline will run tests on both frontend and backend, deploy them, and send a notification to Slack with the results.
