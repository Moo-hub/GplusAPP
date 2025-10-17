"""Hermetic schema checks using SQLAlchemy inspection for portability.

Replaces manual/check_db_schema.py which used information_schema.
"""
from sqlalchemy import inspect


def _columns_for_table(db, table_name):
    inspector = inspect(db.get_bind())
    try:
        cols = inspector.get_columns(table_name)
        return [c["name"] for c in cols]
    except Exception:
        return []


def test_users_table_has_expected_columns(db):
    cols = _columns_for_table(db, "users")
    # Basic expected columns
    expected = {"id", "email", "hashed_password", "created_at"}
    assert expected.issubset(set(cols))
