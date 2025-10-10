import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.main import app, get_db
from src.database import Base

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_db.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to GPlus Backend API"}

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_create_user(client):
    response = client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert data["is_active"] is True

def test_create_duplicate_user(client):
    client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    response = client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_get_users(client):
    client.post(
        "/users/",
        json={"email": "test1@example.com", "password": "testpass123"}
    )
    client.post(
        "/users/",
        json={"email": "test2@example.com", "password": "testpass123"}
    )
    
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_get_user_by_id(client):
    create_response = client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    user_id = create_response.json()["id"]
    
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"

def test_get_nonexistent_user(client):
    response = client.get("/users/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"
