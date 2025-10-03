# GPlus Recycling App Development Guide

This document provides instructions for setting up and running the GPlus Recycling application in development mode.

## Prerequisites

- Docker and Docker Compose
- Python 3.10+
- Node.js 16+
- npm or yarn

## Project Structure

The project consists of two main components:

- `frontend`: React application with React Router, React Query, ErrorBoundary, Toast notifications, and other modern tools
- `backend`: FastAPI application with PostgreSQL database, Redis, token authentication, CSRF protection, and other components

## Setup Instructions

### Option 1: Using Docker (Recommended)

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd GplusApp
   ```

2. Start the development environment using Docker Compose:

   ```bash
   python gplus.py start-dev
   ```

3. Initialize the database (first time only):

   ```bash
   python gplus.py setup-db
   ```

4. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - PgAdmin: `http://localhost:5050` (login with `admin@gplus.com`/`adminpassword`)

5. To stop the development environment:

   ```bash
   python gplus.py stop-dev
   ```

### Option 2: Manual Setup

#### Backend Setup

1. Create a virtual environment and activate it:

   ```bash
   cd backend
   python -m venv .venv
   # On Windows
   .venv\Scripts\activate
   # On Linux/Mac
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Start PostgreSQL and Redis separately (or update the .env file with your connection details)

4. Run the API:

   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Test Users

The system is pre-configured with two test users:

1. Regular User:
   - Email: `test@example.com`
   - Password: `password123`

2. Admin User:
   - Email: `admin@gplus.com`
   - Password: `adminpassword123`

## API Documentation

The API documentation is available at `http://localhost:8000/docs` when the server is running.

## Development Workflow

1. Make code changes in the frontend or backend
2. The development setup includes hot reloading, so most changes will be reflected immediately
3. Run tests to ensure everything works properly
4. Commit your changes and create a pull request

## Key Features

### Authentication and Security

The application implements a secure authentication system with the following features:

- JWT token-based authentication
- Automatic token refresh mechanism
- CSRF protection for sensitive operations
- Protected routes in the frontend
- Role-based access control

### Error Handling

The application includes comprehensive error handling:

- React ErrorBoundary for graceful UI error recovery
- Toast notification system for user feedback
- Centralized API error handling with the `useApiErrorHandler` hook
- Consistent error responses from the backend API

### Performance Optimization

- React Query for efficient data fetching and caching
- Optimistic updates for improved user experience
- Pagination and filtering implemented on API endpoints

## Running Tests

### Backend Tests

```bash
cd backend
pytest
```

To run specific test files:

```bash
pytest tests/test_auth.py
pytest tests/test_companies.py
```

### Frontend Tests

```bash
cd frontend
npm test
# or
yarn test
```

To run specific test files:

```bash
npm test -- Login.test.jsx
npm test -- CompanyList.test.jsx
npm test -- useCompanies.test.js
```

We use Vitest and React Testing Library for frontend testing.

## Troubleshooting

1. If you encounter database connection issues:
   - Check that PostgreSQL is running and accessible
   - Verify that the database credentials in `.env` file are correct
   - Try manually running the database setup script: `python setup_db.py`

2. If the frontend can't connect to the API:
   - Check that the backend is running
   - Verify that CORS settings in the backend allow connections from the frontend URL
   - Check the `VITE_API_URL` environment variable in the frontend

3. For Docker-related issues:
   - Check Docker logs: `docker-compose -f docker-compose.dev.yml logs`
   - Try rebuilding the containers: `docker-compose -f docker-compose.dev.yml up --build`
