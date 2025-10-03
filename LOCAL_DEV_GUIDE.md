# Local Development Setup Guide

This guide will help you set up the G+ Recycling App for local development.

## Quick Start

For a fully automated setup, run:

```bash
python setup_dev_env.py
```

This script will:
- Set up environment variables for both backend and frontend
- Create a SQLite database for development
- Install dependencies for both frontend and backend
- Set up mock services for frontend development

## Manual Setup

If you prefer to set up the environment manually, follow these steps:

### Prerequisites

- Python 3.7+
- Node.js 14+
- npm or yarn
- Git

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend` directory with the following content:
   ```
   ENVIRONMENT=development
   DEBUG=True
   SECRET_KEY=dev_secret_key_123
   POSTGRES_SERVER=localhost
   POSTGRES_PORT=5433
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=gplus_app
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_ALERTS_ENABLED=False
   FRONTEND_URL=http://localhost:3000
   ```

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend` directory with:
   ```
   VITE_API_URL=http://localhost:8000/api/v1
   VITE_WEBSOCKET_URL=ws://localhost:8000/ws
   VITE_MOCK_API=true
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Development Options

### Using Mock API

The frontend includes a Mock Service Worker (MSW) implementation that can simulate API responses without requiring a backend. This is useful for frontend development.

To enable it:
- Set `VITE_MOCK_API=true` in the frontend `.env` file
- Use test credentials:
  - Email: `test@example.com`
  - Password: `password123`
  - Admin: `admin@gplus.com` / `adminpassword123`

### Using SQLite Instead of PostgreSQL

For local development without PostgreSQL:
- The backend is configured to use SQLite when in development mode
- No additional configuration is needed

### Full Stack Development

For complete functionality:
1. Install PostgreSQL and create a database
2. Install Redis for monitoring features
3. Update the environment variables in both backend and frontend

## Common Issues and Solutions

### Backend Database Connection Issues
- **Error**: Cannot connect to PostgreSQL
- **Solution**: Backend will now use SQLite in development mode

### Redis Monitoring Errors
- **Error**: Redis connection errors
- **Solution**: Redis monitoring is now disabled in development mode

### CORS Issues
- **Error**: Frontend cannot connect to backend due to CORS
- **Solution**: The backend is configured to accept requests from all localhost ports

### Authentication Problems
- **Error**: Login doesn't work
- **Solution**: Use the mock API (`VITE_MOCK_API=true`) or check if the backend is running

## Testing

To run tests:

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```