# Backend

This is the backend application for GplusAPP.

## Database Migrations

This project uses Alembic for database migrations. **Important**: Always use Alembic migrations instead of `create_all()` to manage database schema changes.

### Development Note

⚠️ **Use Alembic for schema changes, not `create_all()`**

When working with the database schema:
- ✅ **DO**: Use `alembic revision --autogenerate -m "description"` to create migrations
- ✅ **DO**: Use `alembic upgrade head` to apply migrations
- ❌ **DON'T**: Use `Base.metadata.create_all()` in production or when migrations exist

### Initial Setup

1. Install dependencies:
   ```bash
   pip install alembic sqlalchemy
   ```

2. Initialize the database (first time only):
   ```bash
   cd backend
   alembic stamp head
   ```

3. Apply migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Creating New Migrations

1. Make changes to your models in `models/`

2. Generate a migration:
   ```bash
   cd backend
   alembic revision --autogenerate -m "Description of changes"
   ```

3. Review the generated migration file in `alembic/versions/`

4. Apply the migration:
   ```bash
   alembic upgrade head
   ```

### Migration History

- `e3938d925002` - Add `is_superuser` column to `users` table (non-destructive, uses server_default='0')

## Database Schema

### Users Table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | Integer | No | Auto | Primary key |
| email | String | No | - | User email (unique) |
| hashed_password | String | No | - | Hashed password |
| is_active | Boolean | No | True | User active status |
| is_superuser | Boolean | No | False | Superuser privileges |

## Testing

Test scripts are provided to verify the migration:

1. **tmp_test_login_trace.py** - Verifies the database schema includes the is_superuser column
   ```bash
   cd backend
   python tmp_test_login_trace.py
   ```

2. **demo_login_test.py** - Demonstrates that user queries work correctly with is_superuser field
   ```bash
   cd backend
   python demo_login_test.py
   ```

These scripts confirm that the migration prevents OperationalError when querying users.
