# Adding GitHub Actions Secrets

To eliminate the "Context access might be invalid" warnings in your CI/CD workflow, you need to add the required secrets to your GitHub repository. Here's how:

## Steps to Add Secrets to Your Repository

1. **Go to your GitHub repository page**
   - Navigate to [https://github.com/Moo-hub/GplusAPP](https://github.com/Moo-hub/GplusAPP)

2. **Access Repository Settings**
   - Click on the "Settings" tab near the top of the page

3. **Navigate to Secrets Section**
   - In the left sidebar, click on "Secrets and variables"
   - Select "Actions" from the dropdown

4. **Add New Secret**
   - Click the "New repository secret" button
   - Enter the secret name (exactly as shown below)
   - Paste the secret value
   - Click "Add secret"

5. **Required Secrets to Add**

   **For Vercel Deployment:**
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

   **For Docker Hub:**
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password or access token

   **For Slack Notifications:**
   - `SLACK_WEBHOOK_URL`: Your Slack incoming webhook URL

6. **Test the Workflow**
   - After adding all secrets, make a small commit to your repository
   - Go to the "Actions" tab to see the workflow running

## Getting Secret Values

- **Vercel**: Go to [https://vercel.com/account/tokens](https://vercel.com/account/tokens) to create a token, and find your org and project IDs in project settings
- **Docker Hub**: Use your username and either your password or an access token (recommended) from [https://hub.docker.com/settings/security](https://hub.docker.com/settings/security)
- **Slack**: Create a webhook at [https://api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)

> **Note**: The `GITHUB_TOKEN` secret is automatically provided by GitHub Actions and doesn't need to be manually added.
