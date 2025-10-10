# Backend Application

This is the FastAPI backend application with SQLAlchemy and Alembic for database migrations.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure your database settings:
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
alembic upgrade head
```

## Development Notes

### Database Migrations

**Important:** Always use Alembic for database schema changes rather than `Base.metadata.create_all()`.

- `Base.metadata.create_all()` should only be used for initial prototyping or testing
- For any schema changes in development or production, create proper Alembic migrations
- This ensures version control of database schema and enables safe upgrades/downgrades

### Creating New Migrations

1. After modifying models, generate a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

2. Review the generated migration file in `alembic/versions/`

3. Apply the migration:
```bash
alembic upgrade head
```

4. To rollback:
```bash
alembic downgrade -1
```

### Running Tests

```bash
pytest
```

### Current Schema

The `users` table includes:
- `id` (Integer, Primary Key)
- `email` (String, Unique)
- `hashed_password` (String)
- `is_active` (Boolean, default: True)
- `is_superuser` (Boolean, default: False) - Added via migration 002

## Migrations History

- **001_initial**: Create users table with basic fields
- **002_add_is_superuser**: Add is_superuser column to users table
