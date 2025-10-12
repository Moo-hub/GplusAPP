import json
from app.utils.json_encoder import EnhancedSQLAlchemyJSONEncoder
from app.models.user import User


def test_primitives_encode_directly():
    assert json.dumps(1, cls=EnhancedSQLAlchemyJSONEncoder) == "1"
    assert json.dumps("s", cls=EnhancedSQLAlchemyJSONEncoder) == '"s"'
    assert json.dumps(True, cls=EnhancedSQLAlchemyJSONEncoder) == "true"


def test_list_and_dict_encoding():
    data = {"a": [1, 2, 3], "b": {"x": 10}}
    s = json.dumps(data, cls=EnhancedSQLAlchemyJSONEncoder)
    assert '"a"' in s and '"b"' in s


def test_model_serialization_minimal(db):
    # ensure a user exists in the DB
    user = db.query(User).first()
    if not user:
        user = User(email="encoder@test", name="Enc", hashed_password="x", is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)

    s = json.dumps(user, cls=EnhancedSQLAlchemyJSONEncoder)
    # Should include id and email keys
    assert '"id"' in s and '"email"' in s


def test_cycle_detection(db):
    # Create two lightweight objects that reference each other via attributes
    class A:
        def __init__(self):
            self.other = None

    a = A()
    b = A()
    a.other = b
    b.other = a

    # Encoder should not raise RecursionError and should produce a JSON string
    out = json.dumps(a, cls=EnhancedSQLAlchemyJSONEncoder)
    assert isinstance(out, str)
