# GPlus Backend API

Backend API for GPlus application, built with FastAPI and SQLAlchemy.

## Technologies Used

* Python 3.12
* FastAPI - Web framework
* SQLAlchemy - ORM
* Alembic - Database migrations
* Pydantic - Data validation
* Passlib - Password hashing

## Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment:**
   ```bash
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On macOS/Linux: source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

5. **Run database migrations:**
   
   **IMPORTANT:** Use Alembic for database migrations instead of `Base.metadata.create_all()`.
   
   Alembic provides version control for your database schema and allows for:
   - Incremental schema changes
   - Rollback capabilities
   - Team collaboration on schema changes
   - Production-safe migrations
   
   To apply migrations:
   ```bash
   # Apply all pending migrations
   alembic upgrade head
   
   # To create a new migration after model changes:
   alembic revision --autogenerate -m "Description of changes"
   
   # To rollback the last migration:
   alembic downgrade -1
   ```

6. **Run the application:**
   ```bash
   uvicorn src.main:app --reload
   ```

   The API will be available at http://localhost:8000
   
   API documentation: http://localhost:8000/docs

## Development

### Database Migrations

This project uses Alembic for database migrations. **Do not use `Base.metadata.create_all()`** for creating tables in production or development.

#### Creating a new migration

When you make changes to models:

```bash
# Generate migration automatically (preferred)
alembic revision --autogenerate -m "description of changes"

# Or create an empty migration to write manually
alembic revision -m "description of changes"
```

#### Applying migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Apply migrations up to a specific revision
alembic upgrade <revision_id>
```

#### Rolling back migrations

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to a specific revision
alembic downgrade <revision_id>
```

#### Viewing migration history

```bash
# Show current revision
alembic current

# Show migration history
alembic history
```

### Running Tests

```bash
pytest
```

For test coverage:
```bash
pytest --cov=src tests/
```

## Project Structure

```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py          # FastAPI application
│   ├── config.py        # Configuration settings
│   ├── database.py      # Database setup
│   ├── schemas.py       # Pydantic models
│   ├── crud.py          # Database operations
│   └── models/
│       ├── __init__.py
│       └── user.py      # SQLAlchemy models
├── alembic/
│   ├── versions/        # Migration files
│   ├── env.py          # Alembic environment
│   └── script.py.mako  # Migration template
├── tests/              # Test suite
├── alembic.ini        # Alembic configuration
├── requirements.txt   # Python dependencies
└── README.md         # This file
```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /docs` - OpenAPI documentation
- `POST /users/` - Create a new user
- `GET /users/` - List users
- `GET /users/{user_id}` - Get user by ID

## Environment Variables

- `APP_ENV` - Application environment (development/production)
- `SECRET_KEY` - Secret key for security
- `DATABASE_URL` - Database connection string (default: sqlite:///./gplus.db)
