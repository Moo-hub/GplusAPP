# G+ Recycling App - Installation Guide

This guide provides detailed instructions for installing and configuring the G+ Recycling App on various platforms and environments.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [User Installation](#user-installation)
   - [Mobile App Installation](#mobile-app-installation)
   - [Progressive Web App (PWA) Installation](#progressive-web-app-pwa-installation)
3. [Development Environment Setup](#development-environment-setup)
   - [Prerequisites](#prerequisites)
   - [Frontend Setup](#frontend-setup)
   - [Backend Setup](#backend-setup)
4. [Production Deployment](#production-deployment)
   - [Docker Deployment](#docker-deployment)
   - [Manual Deployment](#manual-deployment)
5. [Configuration](#configuration)
   - [Environment Variables](#environment-variables)
   - [Feature Flags](#feature-flags)
6. [Verification](#verification)
   - [Smoke Tests](#smoke-tests)
   - [Health Checks](#health-checks)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### End Users

**Mobile Application:**

- Android 8.0 (Oreo) or later
- iOS 13 or later
- 100 MB of free storage space
- Active internet connection (for initial setup and synchronization)

**Web Application:**

- Modern web browser (Chrome 80+, Firefox 78+, Safari 14+, Edge 84+)
- JavaScript enabled
- Cookies enabled for full functionality
- 4 GB RAM recommended

### Development Environment

- Node.js v16 or later
- npm v7 or later
- Python 3.9 or later (for backend development)
- Git
- Docker and Docker Compose (recommended)

### Production Server

- Linux-based server (Ubuntu 20.04 LTS recommended)
- 4 GB RAM minimum (8 GB recommended)
- 20 GB storage minimum
- Docker and Docker Compose
- Nginx or similar web server for reverse proxy
- SSL certificate for HTTPS

## User Installation

### Mobile App Installation

#### Android Installation

1. Open the Google Play Store on your Android device
2. Search for "G+ Recycling App"
3. Tap "Install"
4. Once installation is complete, tap "Open" to launch the app
5. Follow the on-screen instructions to create an account or log in

#### iOS Installation

1. Open the App Store on your iOS device
2. Search for "G+ Recycling App"
3. Tap "Get" or the download icon
4. Authenticate with Face ID, Touch ID, or your Apple ID password
5. Once installation is complete, tap "Open" to launch the app
6. Follow the on-screen instructions to create an account or log in

### Progressive Web App (PWA) Installation

You can install the G+ Recycling App as a Progressive Web App on supported browsers:

1. Visit [https://app.gplus-recycling.com](https://app.gplus-recycling.com) in a compatible browser
2. For most browsers, you'll see an installation prompt or icon in the address bar
3. Click "Install" or "Add to Home Screen"
4. Follow any additional prompts
5. The app will be installed and available from your home screen or app launcher

## Development Environment Setup

### Prerequisites

Before setting up the development environment, ensure you have installed:

1. Node.js v16 or later
2. npm v7 or later
3. Python 3.9 or later with pip
4. Git
5. Docker and Docker Compose (recommended)

### Frontend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/gplus-app.git
   cd gplus-app
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Create environment configuration:

   ```bash
   cp .env.example .env.development
   ```

4. Edit `.env.development` to configure your environment variables:
   - Set `VITE_API_BASE_URL` to your local backend URL (default: `http://localhost:8000`)

5. Start the development server:

   ```bash
   npm run dev
   ```

6. The frontend will be available at `http://localhost:5173`

### Backend Setup

1. From the project root, navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:

   ```bash
   # On Windows
   python -m venv .venv
   .\.venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create environment configuration:

   ```bash
   cp .env.example .env
   ```

5. Edit `.env` to configure your environment variables:
   - Set database connection details
   - Configure Redis connection (if used)
   - Set JWT secret key

6. Apply database migrations:

   ```bash
   alembic upgrade head
   ```

7. Start the backend server:

   ```bash
   uvicorn gplus_smart_builder_pro.src.main:app --reload
   ```

8. The backend API will be available at `http://localhost:8000`

## Production Deployment

### Docker Deployment

For production deployment, we recommend using Docker and Docker Compose:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gplus-app.git
   cd gplus-app
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` to configure production settings:
   - Set `NODE_ENV=production`
   - Configure database connection details
   - Set Redis credentials
   - Add production API URLs

4. Build and start the containers:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. Verify that the containers are running:

   ```bash
   docker-compose ps
   ```

### Manual Deployment

#### Frontend Deployment

1. Build the frontend:

   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. The build artifacts will be in the `dist` directory

3. Deploy these files to your web server (Nginx, Apache, etc.)

4. Configure your web server to serve the static files and handle routing

#### Backend Deployment

1. Set up a Python environment on your server
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables for production
4. Run the application with a production ASGI server:

   ```bash
   gunicorn -k uvicorn.workers.UvicornWorker -w 4 gplus_smart_builder_pro.src.main:app
   ```

5. Set up a reverse proxy (Nginx recommended) to forward requests to the application

## Configuration

### Environment Variables

#### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL of the backend API | `http://localhost:8000` |
| `VITE_ENABLE_MOCK_API` | Enable mock API for development | true |
| `VITE_ENABLE_PWA` | Enable Progressive Web App features | true |
| `VITE_SENTRY_DSN` | Sentry DSN for error reporting | `https://example@sentry.io/123` |

#### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | postgresql://user:pass@localhost/db |
| `REDIS_URL` | Redis connection string | redis://localhost:6379/0 |
| `SECRET_KEY` | JWT secret key | random-secret-key |
| `FRONTEND_ORIGIN` | CORS origin for frontend | `http://localhost:5173` |
| `ENVIRONMENT` | Current environment | production |
| `LOG_LEVEL` | Logging level | info |

### Feature Flags

Feature flags can be configured in the `config.yaml` file:

```yaml
features:
  offline_mode: true
  push_notifications: true
  real_time_tracking: true
  multilingual: true
  dark_mode: true
```

## Verification

### Smoke Tests

After installation, run the following smoke tests to verify functionality:

1. User Authentication:
   - Register a new test account
   - Log in with the test account
   - Log out

2. Core Features:
   - Navigate to the Companies section
   - Create a pickup request
   - Check points balance

### Health Checks

The application provides health check endpoints for monitoring:

- Backend health: `GET /api/health`
- Database health: `GET /api/health/db`
- Redis health: `GET /api/health/redis`

## Troubleshooting

### Common Installation Issues

**Issue**: "npm install fails with dependency conflicts"
**Solution**: Try clearing npm cache: `npm cache clean --force` and then reinstall

**Issue**: "Backend server won't start"
**Solution**: Check database connection settings and ensure the database server is running

**Issue**: "Cannot connect to API from frontend"
**Solution**: Verify CORS settings and ensure the backend URL is correctly configured

**Issue**: "Docker containers exit immediately"
**Solution**: Check container logs with `docker-compose logs` to identify specific errors

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [FAQ](./FAQ.md) for common questions and answers
2. Review the [Developer Guide](./DEVELOPER_GUIDE.md) for more detailed information
3. File an issue on our GitHub repository
4. Contact our support team at `support@gplus-recycling.com`

---

For more information on using the application after installation, please refer to the [User Guide](./USER_GUIDE.md).
