from sqlalchemy import inspect
from alembic import op

def column_exists(table_name, column_name):
    """Check if a column exists in a table."""
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def add_column_if_not_exists(table_name, column):
    """Add a column if it doesn't exist."""
    if not column_exists(table_name, column.name):
        op.add_column(table_name, column)