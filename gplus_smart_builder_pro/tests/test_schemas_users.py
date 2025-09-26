from gplus_smart_builder_pro.src.schemas.users import User, UserBase, UserCreate

def test_user_base():
    user = UserBase(username="test", email="test@example.com")
    assert user.username == "test"
    assert user.email == "test@example.com"

def test_user_create():
    user = UserCreate(username="test", email="test@example.com", password="pw")
    assert user.password == "pw"

def test_user():
    user = User(id=1, username="test", email="test@example.com")
    assert user.id == 1
