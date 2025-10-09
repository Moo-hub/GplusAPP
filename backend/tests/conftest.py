"""
Hermetic test configuration for pytest.

These tests are isolated and don't depend on external services or state.
Tests marked with 'manual' are excluded from CI runs.
"""
import pytest


@pytest.fixture(scope="session")
def hermetic_env(monkeypatch):
    """Ensure tests run in a hermetic environment."""
    # Clear any environment variables that might affect tests
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)
    return True


@pytest.fixture
def isolated_temp_dir(tmp_path):
    """Provide an isolated temporary directory for each test."""
    return tmp_path
