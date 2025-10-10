def test_create_user(client):
    """Test creating a new user"""
    response = client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert data["is_active"] == True

def test_create_duplicate_user(client):
    """Test that creating a duplicate user fails"""
    # Create first user
    client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    
    # Try to create duplicate
    response = client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass456"}
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_get_users(client):
    """Test getting list of users"""
    # Create a user first
    client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    
    # Get users
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["email"] == "test@example.com"

def test_get_user_by_id(client):
    """Test getting a user by ID"""
    # Create a user
    create_response = client.post(
        "/users/",
        json={"email": "test@example.com", "password": "testpass123"}
    )
    user_id = create_response.json()["id"]
    
    # Get user by ID
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["id"] == user_id

def test_get_nonexistent_user(client):
    """Test getting a user that doesn't exist"""
    response = client.get("/users/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
