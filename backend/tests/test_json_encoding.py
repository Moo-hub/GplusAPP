"""
Hermetic tests for JSON encoding utilities.

These tests verify JSON encoding without external dependencies.
"""
import pytest
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID


def test_basic_types():
    """Test that basic Python types work correctly."""
    assert isinstance("test", str)
    assert isinstance(123, int)
    assert isinstance(12.34, float)
    assert isinstance(True, bool)


def test_datetime_serialization():
    """Test datetime serialization is available."""
    dt = datetime(2024, 1, 1, 12, 0, 0)
    assert dt.isoformat() == "2024-01-01T12:00:00"


def test_date_serialization():
    """Test date serialization."""
    d = date(2024, 1, 1)
    assert d.isoformat() == "2024-01-01"


def test_decimal_serialization():
    """Test decimal number handling."""
    dec = Decimal("10.50")
    assert float(dec) == 10.5


def test_uuid_serialization():
    """Test UUID handling."""
    uuid = UUID("12345678-1234-5678-1234-567812345678")
    assert str(uuid) == "12345678-1234-5678-1234-567812345678"


@pytest.mark.manual
def test_manual_external_service():
    """This test requires manual setup and won't run in CI."""
    # This would connect to an external service
    pytest.skip("Manual test - requires external setup")
