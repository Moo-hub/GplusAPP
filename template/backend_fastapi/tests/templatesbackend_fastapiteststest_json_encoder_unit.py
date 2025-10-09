# templates/backend_fastapi/tests/test_json_encoder_unit.py

import pytest
from app.utils.json_encoder import safe_json_encoder, dumps, loads


def test_primitives_unchanged():
    """Test that primitives are returned unchanged."""
    assert safe_json_encoder(None) is None
    assert safe_json_encoder(True) is True
    assert safe_json_encoder(False) is False
    assert safe_json_encoder(42) == 42
    assert safe_json_encoder(3.14) == 3.14
    assert safe_json_encoder("hello") == "hello"


def test_dict_encoding():
    """Test dictionary encoding."""
    data = {"name": "test", "value": 123, "active": True}
    result = safe_json_encoder(data)
    assert result == data
    assert isinstance(result, dict)


def test_list_encoding():
    """Test list encoding."""
    data = [1, 2, "three", {"four": 4}]
    result = safe_json_encoder(data)
    assert result == data
    assert isinstance(result, list)


def test_circular_reference_prevention():
    """Test that circular references are handled."""
    # Create a circular reference
    data = {"name": "root"}
    data["self"] = data
    
    result = safe_json_encoder(data)
    assert "name" in result
    assert "_ref" in result["self"]


def test_nested_objects():
    """Test nested object encoding."""
    class SimpleObj:
        def __init__(self, name, value):
            self.name = name
            self.value = value
    
    obj = SimpleObj("test", 42)
    result = safe_json_encoder(obj)
    assert result == {"name": "test", "value": 42}


def test_sqlalchemy_like_object():
    """Test object with SQLAlchemy-like attributes."""
    class FakeModel:
        __tablename__ = "users"
        
        def __init__(self):
            self.id = 1
            self.name = "test"
            self._sa_instance_state = "should_be_filtered"
    
    obj = FakeModel()
    result = safe_json_encoder(obj)
    assert "id" in result
    assert "name" in result
    assert "_sa_instance_state" not in result


def test_dumps_and_loads():
    """Test JSON dumps and loads functions."""
    data = {"name": "test", "values": [1, 2, 3], "active": True}
    
    # Test dumps
    json_str = dumps(data)
    assert isinstance(json_str, str)
    
    # Test loads
    loaded = loads(json_str)
    assert loaded == data


def test_circular_reference_with_sqlalchemy_like():
    """Test circular reference with SQLAlchemy-like models."""
    class User:
        __tablename__ = "users"
        
        def __init__(self, id, name):
            self.id = id
            self.name = name
            self.posts = []
    
    class Post:
        __tablename__ = "posts"
        
        def __init__(self, id, title, user):
            self.id = id
            self.title = title
            self.user = user
    
    user = User(1, "Alice")
    post = Post(1, "First Post", user)
    user.posts.append(post)
    
    # This should not raise RecursionError
    result = safe_json_encoder(user)
    assert result["id"] == 1
    assert result["name"] == "Alice"
    assert len(result["posts"]) == 1
    assert result["posts"][0]["title"] == "First Post"
    # The user reference in post should be a placeholder to avoid infinite recursion
    assert "_ref" in result["posts"][0]["user"]
