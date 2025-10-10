# Quick Start Guide - GPlus Backend

This guide will help you get the backend up and running.

## Prerequisites

- Python 3.10 or higher
- pip (Python package installer)

## Setup Steps

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create virtual environment
```bash
python -m venv venv

# Activate it:
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (default values work for local development)
```

### 5. Run database migrations
```bash
# Apply all migrations to create database schema
alembic upgrade head
```

This will:
- Create the SQLite database (`gplus.db`)
- Create the `users` table
- Add the `is_superuser` column

### 6. Start the server
```bash
uvicorn src.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive docs**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

## Testing the API

### Using the interactive docs (Swagger UI)
1. Open http://localhost:8000/docs
2. Try the endpoints:
   - `GET /` - Root endpoint
   - `GET /health` - Health check
   - `POST /users/` - Create a user
   - `GET /users/` - List users
   - `GET /users/{user_id}` - Get user by ID

### Using curl

Create a user:
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'
```

List users:
```bash
curl http://localhost:8000/users/
```

Get user by ID:
```bash
curl http://localhost:8000/users/1
```

## Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_users.py

# Run with coverage
pytest --cov=src tests/
```

## Database Migrations

### View current status
```bash
alembic current
```

### View migration history
```bash
alembic history
```

### Create new migration
After modifying models in `src/models/`:
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback migration
```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>
```

## Project Structure

```
backend/
├── src/
│   ├── main.py          # FastAPI app and routes
│   ├── config.py        # Configuration settings
│   ├── database.py      # Database connection
│   ├── schemas.py       # Pydantic models (API)
│   ├── crud.py          # Database operations
│   └── models/
│       └── user.py      # SQLAlchemy models (DB)
├── alembic/
│   └── versions/        # Migration files
├── tests/               # Test suite
└── requirements.txt     # Dependencies
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| POST | `/users/` | Create new user |
| GET | `/users/` | List all users |
| GET | `/users/{user_id}` | Get user by ID |

## User Model Fields

- `id` (int): Auto-generated primary key
- `email` (string): User email (unique)
- `hashed_password` (string): Hashed password
- `is_active` (bool): Whether user is active (default: true)
- `is_superuser` (bool): Whether user is superuser (default: false)

## Troubleshooting

### Database locked error
If you get a "database is locked" error, make sure only one instance of the app is running.

### Module not found
Make sure you're in the virtual environment:
```bash
which python  # Should point to venv/bin/python
```

### Alembic can't find modules
The `alembic.ini` has `prepend_sys_path = .` which should handle this. If issues persist, ensure you're in the backend directory.

## Next Steps

- Add authentication (JWT tokens)
- Add user registration endpoint
- Add password reset functionality
- Add user profile management
- Configure production database (PostgreSQL)

## Support

For issues or questions, refer to:
- `backend/README.md` - Detailed documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- API docs at http://localhost:8000/docs
