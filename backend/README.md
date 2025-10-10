# Backend API

This is the FastAPI backend for GplusAPP.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   Create a `.env` file with:
   ```
   DATABASE_URL=sqlite:///./test.db
   SECRET_KEY=your-secret-key-here
   ```

3. **Run database migrations:**
   
   **Important Development Note:** Always use Alembic for database schema changes rather than `Base.metadata.create_all()`. 
   This ensures proper migration tracking and version control of database schema changes.
   
   ```bash
   # Apply migrations
   alembic upgrade head
   ```

4. **Run the application:**
   ```bash
   uvicorn src.main:app --reload
   ```

## Running Tests

```bash
pytest
```

## Database Migrations

The project uses Alembic for database migrations. All schema changes should be managed through Alembic migrations.

### Creating a New Migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Applying Migrations

```bash
alembic upgrade head
```

### Rolling Back Migrations

```bash
alembic downgrade -1
```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
