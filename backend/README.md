Development notes

- Important: This project uses Alembic for schema migrations.

🚫 Note: Do NOT run `Base.metadata.create_all()` against a database managed by Alembic.
Use `alembic upgrade head` to apply schema changes to the database to avoid schema drift and conflicts.
