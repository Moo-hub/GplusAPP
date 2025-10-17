"""
Check database schema
"""
import sys
import os
from pathlib import Path

# Add the backend directory to the path so we can import our app modules
backend_dir = Path(__file__).resolve().parent.parent.parent  # Go up to backend directory
sys.path.append(str(backend_dir))

from app.db.session import SessionLocal
from sqlalchemy import text

def check_table_schema(table_name):
    db = SessionLocal()
    try:
        # Query to get column information
        query = text(f"""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '{table_name}'
        ORDER BY ordinal_position
        """)
        result = db.execute(query)
        columns = []
        print(f"Columns for table {table_name}:")
        print("-" * 60)
        print(f"{'Column Name':<25} {'Data Type':<15} {'Nullable':<10}")
        print("-" * 60)
        for row in result:
            print(f"{row[0]:<25} {row[1]:<15} {row[2]:<10}")
            columns.append(row[0])
        print("-" * 60)
        return columns
    finally:
        db.close()

if __name__ == "__main__":
    print("Checking database schema...")
    check_table_schema("users")