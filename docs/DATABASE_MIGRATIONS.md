# Database Migrations Guide for G+ Recycling App

## Overview

This guide documents the database migration system used in the G+ Recycling App. The application uses Alembic, an SQLAlchemy-based migration tool, to manage database schema changes in a version-controlled and systematic manner.

## Table of Contents

1. [Migration Architecture](#migration-architecture)
2. [Directory Structure](#directory-structure)
3. [Migration Workflow](#migration-workflow)
4. [Creating New Migrations](#creating-new-migrations)
5. [Applying Migrations](#applying-migrations)
6. [Rollback Procedures](#rollback-procedures)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Migration History](#migration-history)

## Migration Architecture

The G+ Recycling App uses a layered database access architecture:

1. **SQLAlchemy ORM**: For object-relational mapping
2. **SQLAlchemy Core**: For lower-level database operations
3. **Alembic**: For database schema migrations
4. **PostgreSQL**: As the underlying database system

The migrations are designed to be:
- **Reversible**: Each migration includes both upgrade and downgrade operations
- **Independent**: Migrations should be self-contained and not depend on application code
- **Consistent**: All environments (development, testing, production) use the same migration process

## Directory Structure

```
backend/
├── alembic/
│   ├── versions/
│   │   ├── 5fdbbbf32a86_initial_migration.py
│   │   ├── 79bd7ba369eb_merge_heads.py
│   │   ├── 82d0f66ad5d9_add_user_auth_fields.py
│   │   └── ...
│   ├── env.py           # Environment configuration for migrations
│   ├── script.py.mako   # Template for migration scripts
│   └── README
├── alembic.ini          # Alembic configuration file
└── app/
    ├── db/
    │   ├── base.py      # Imports all models for Alembic
    │   ├── base_class.py
    │   └── session.py   # Database connection setup
    └── models/          # SQLAlchemy models
        ├── user.py
        ├── point_transaction.py
        └── ...
```

## Migration Workflow

### General Process

1. Make changes to SQLAlchemy models in the `app/models/` directory
2. Generate a new migration script using Alembic
3. Review and edit the generated migration script if necessary
4. Apply the migration to update the database schema
5. Commit the migration script to version control

### Development Workflow

During development, follow these steps:

1. Pull the latest code from version control
2. Apply any pending migrations: `alembic upgrade head`
3. Make changes to models as needed
4. Generate and apply new migrations for your changes
5. Test thoroughly before committing

## Creating New Migrations

### Automatic Generation

To automatically generate a migration based on model changes:

```bash
cd backend
alembic revision --autogenerate -m "description_of_changes"
```

Example:
```bash
alembic revision --autogenerate -m "add_user_preferences_table"
```

This command:
1. Compares the current database schema to the models defined in code
2. Generates a new migration script in the `alembic/versions/` directory
3. Includes SQL commands for both upgrading and downgrading

### Manual Creation

For more complex changes or when autogeneration isn't suitable:

```bash
alembic revision -m "description_of_changes"
```

Then edit the generated file to implement the required changes.

### Migration Script Structure

Each migration script follows this structure:

```python
"""description_of_changes

Revision ID: abcdef123456
Revises: previous_revision_id
Create Date: YYYY-MM-DD HH:MM:SS.SSSSSS

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'abcdef123456'
down_revision = 'previous_revision_id'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Operations to perform for upgrading the database
    op.create_table(...)
    op.add_column(...)

def downgrade() -> None:
    # Operations to perform for downgrading the database
    op.drop_column(...)
    op.drop_table(...)
```

## Applying Migrations

### Check Current Status

To see the current migration status:

```bash
alembic current
```

To see migration history:

```bash
alembic history
```

### Upgrade Database

To apply all pending migrations:

```bash
alembic upgrade head
```

To apply migrations incrementally:

```bash
alembic upgrade +1
```

To upgrade to a specific revision:

```bash
alembic upgrade revision_id
```

### Database Initialization

For new environments or first-time setup:

```bash
alembic upgrade head
```

This applies all migrations in sequence, creating the full database schema.

## Rollback Procedures

### Downgrade Database

To rollback the most recent migration:

```bash
alembic downgrade -1
```

To rollback to a specific revision:

```bash
alembic downgrade revision_id
```

To rollback all migrations:

```bash
alembic downgrade base
```

### Emergency Rollback

In case of critical issues in production:

1. Stop the application
2. Backup the database
3. Execute the rollback command:
   ```bash
   alembic downgrade -1
   ```
4. Verify the database integrity
5. Restart the application

## Best Practices

1. **Always Review Generated Migrations**: Autogenerated migrations may not capture all nuances of your changes
2. **Keep Migrations Small and Focused**: Each migration should handle a specific change
3. **Test Migrations Thoroughly**: Test both upgrade and downgrade operations
4. **Include Descriptive Comments**: Add detailed comments explaining complex changes
5. **Never Modify Existing Migration Files**: Once committed to version control, treat migration files as immutable
6. **Handle Data Migrations Carefully**: When changing column types or removing columns, consider data preservation
7. **Use Transactions**: Ensure migrations are atomic operations
8. **Version Control**: Always commit migration files along with model changes

### Data Migration Example

For migrations that require data transformation:

```python
def upgrade() -> None:
    # Schema changes
    op.add_column('users', sa.Column('full_name', sa.String()))
    
    # Data migration
    connection = op.get_bind()
    users = connection.execute(sa.text("SELECT id, first_name, last_name FROM users")).fetchall()
    for user in users:
        full_name = f"{user.first_name} {user.last_name}".strip()
        connection.execute(
            sa.text("UPDATE users SET full_name = :full_name WHERE id = :id"),
            parameters=dict(full_name=full_name, id=user.id)
        )
    
    # Optional: drop old columns
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'last_name')
```

## Troubleshooting

### Common Issues

1. **Migration Conflicts**: When multiple developers create migrations simultaneously
   - Solution: Use `alembic merge` to create a merge migration

2. **Failed Migrations**:
   - Check the error message for specific issues
   - Fix the issue in the migration script
   - Use `alembic upgrade head` to retry

3. **Inconsistent Database State**:
   - Use `alembic current` to check the current state
   - Compare with expected state
   - Manually fix the alembic_version table if necessary

4. **Missing Tables or Columns**:
   - Ensure all models are imported in `app/db/base.py`
   - Re-generate the migration with `--autogenerate`

### Debugging Tips

1. Set more verbose output:
   ```bash
   alembic upgrade head --verbose
   ```

2. Print SQL commands without executing:
   ```bash
   alembic upgrade head --sql
   ```

3. Check the alembic version table:
   ```sql
   SELECT * FROM alembic_version;
   ```

## Migration History

The G+ Recycling App's database has evolved through several migrations:

### 5fdbbbf32a86_initial_migration.py (2025-09-27)
- Initial database schema creation
- Created users table with basic fields
- Created point_transactions table for tracking user points

### 79bd7ba369eb_merge_heads.py (2025-09-28)
- Merge migration to resolve parallel development branches
- Combined schema changes from multiple feature branches

### 82d0f66ad5d9_add_user_auth_fields.py (2025-09-28)
- Added email_verified boolean field to users table
- Added role field to users table
- Updated nullable constraints on several fields

### 3921ccaf9e39_add_pickup_scheduling_enhancements.py
- Added recurring pickup capabilities
- Enhanced scheduling options for pickup requests

---

*Note: This documentation is maintained by the G+ Recycling App development team and should be updated whenever significant database changes occur.*