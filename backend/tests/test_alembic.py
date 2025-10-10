import pytest
import subprocess
import os

def test_alembic_current():
    """Test that alembic can show current revision"""
    result = subprocess.run(
        ["alembic", "current"],
        cwd="/home/runner/work/GplusAPP/GplusAPP/backend",
        capture_output=True,
        text=True
    )
    assert result.returncode == 0

def test_alembic_history():
    """Test that alembic can show migration history"""
    result = subprocess.run(
        ["alembic", "history"],
        cwd="/home/runner/work/GplusAPP/GplusAPP/backend",
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert "Add is_superuser" in result.stdout

def test_alembic_migrations_exist():
    """Test that migration files exist"""
    migrations_dir = "/home/runner/work/GplusAPP/GplusAPP/backend/alembic/versions"
    assert os.path.exists(migrations_dir)
    files = os.listdir(migrations_dir)
    py_files = [f for f in files if f.endswith('.py')]
    assert len(py_files) >= 2  # At least initial and is_superuser migrations

def test_is_superuser_migration_exists():
    """Test that is_superuser migration file exists"""
    migrations_dir = "/home/runner/work/GplusAPP/GplusAPP/backend/alembic/versions"
    files = os.listdir(migrations_dir)
    is_superuser_files = [f for f in files if 'is_superuser' in f.lower()]
    assert len(is_superuser_files) >= 1

@pytest.mark.skip(reason="Requires database state management")
def test_alembic_downgrade():
    """Test alembic downgrade (skipped to preserve test db state)"""
    pass

@pytest.mark.skip(reason="Requires database state management")
def test_alembic_upgrade():
    """Test alembic upgrade (skipped to preserve test db state)"""
    pass
