"""
Test to verify JSON encoder works with Pydantic v2 models.

This test demonstrates compatibility without actually requiring Pydantic v2 to be installed.
"""
from backend.app.utils.json_encoder import safe_json_encoder, to_json, to_json_dict
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from enum import Enum
from pathlib import Path


class Status(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


def test_all_supported_types():
    """Test that all supported types are correctly encoded."""
    test_data = {
        "datetime": datetime(2024, 1, 1, 12, 0, 0),
        "date": date(2024, 1, 1),
        "decimal": Decimal("99.99"),
        "uuid": UUID("12345678-1234-5678-1234-567812345678"),
        "path": Path("/tmp/test"),
        "enum": Status.ACTIVE,
        "set": {1, 2, 3},
        "bytes": b"hello",
        "string": "world",
        "int": 42,
        "float": 3.14,
        "bool": True,
        "null": None,
    }
    
    # Test to_json
    json_str = to_json(test_data)
    assert isinstance(json_str, str)
    assert "2024-01-01T12:00:00" in json_str
    assert "99.99" in json_str
    assert "active" in json_str
    
    print("✓ All types encoded successfully to JSON")


def test_decimal_encoding():
    """Test decimal encoding with and without decimal places."""
    # Integer-like decimal
    dec_int = Decimal("10")
    assert safe_json_encoder(dec_int) == 10
    assert isinstance(safe_json_encoder(dec_int), int)
    
    # Float-like decimal
    dec_float = Decimal("10.5")
    assert safe_json_encoder(dec_float) == 10.5
    assert isinstance(safe_json_encoder(dec_float), float)
    
    print("✓ Decimal encoding works correctly")


def test_pydantic_v2_compatibility():
    """Test compatibility with Pydantic v2 model dump pattern."""
    # Simulate Pydantic v2 model behavior
    class MockPydanticV2Model:
        def model_dump(self, mode='json'):
            return {
                "id": UUID("12345678-1234-5678-1234-567812345678"),
                "created": datetime(2024, 1, 1),
                "amount": Decimal("100.00")
            }
    
    model = MockPydanticV2Model()
    result = to_json_dict(model)
    
    assert isinstance(result, dict)
    assert result["id"] == "12345678-1234-5678-1234-567812345678"
    assert result["created"] == "2024-01-01T00:00:00"
    assert result["amount"] == 100.0
    
    print("✓ Pydantic v2 compatibility verified")


def test_pydantic_v1_compatibility():
    """Test backward compatibility with Pydantic v1 dict() pattern."""
    class MockPydanticV1Model:
        def dict(self):
            return {
                "name": "test",
                "value": 123
            }
    
    model = MockPydanticV1Model()
    result = to_json_dict(model)
    
    assert isinstance(result, dict)
    assert result["name"] == "test"
    assert result["value"] == 123
    
    print("✓ Pydantic v1 backward compatibility verified")


if __name__ == "__main__":
    test_all_supported_types()
    test_decimal_encoding()
    test_pydantic_v2_compatibility()
    test_pydantic_v1_compatibility()
    print("\n✅ All JSON encoder tests passed!")
