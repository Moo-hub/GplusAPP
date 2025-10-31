import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.dependencies.auth import get_current_user

# Mock auth dependency
def mock_get_current_user():
    return {
        "id": 1,
        "email": "test@example.com",
        "is_active": True,
        "is_superuser": False
    }

@pytest.fixture(autouse=True)
def override_auth_dependency():
    # Apply override for tests in this module only
    app.dependency_overrides[get_current_user] = mock_get_current_user
    try:
        yield
    finally:
        # Reset only our override after each test
        app.dependency_overrides.pop(get_current_user, None)

def test_environmental_impact_docs(client: TestClient):
    """Test the API documentation endpoint for environmental impact"""
    response = client.get("/api/v1/environmental-impact/")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that the response contains the expected keys
    assert "message" in data
    assert "documentation" in data
    assert "version" in data
    
    # Check the values
    assert "Welcome to the Environmental Impact API" in data["message"]
    assert "documentation" in data["documentation"].lower()
    assert data["version"] == "1.0"

def test_get_environmental_impact_summary(client: TestClient):
    """Test the summary endpoint returns the expected structure"""
    response = client.get("/api/v1/environmental-impact/summary?time_period=month")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check required fields
    assert "time_period" in data
    assert "total_recycled_kg" in data
    assert "materials_breakdown" in data
    assert "carbon_impact" in data
    assert "community_impact" in data
    assert "timestamp" in data
    
    # Check nested structure
    assert "kg_co2_saved" in data["carbon_impact"]
    assert "equivalence" in data["carbon_impact"]
    assert "total_pickups" in data["community_impact"]
    
def test_get_environmental_impact_trend(client: TestClient):
    """Test the trend endpoint returns the expected structure"""
    response = client.get(
        "/api/v1/environmental-impact/trend?metric=recycled&time_range=month&granularity=day"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check required fields
    assert "metric" in data
    assert "time_range" in data
    assert "granularity" in data
    assert "data" in data
    assert "timestamp" in data
    
    # Check data points structure
    assert len(data["data"]) > 0
    assert "date" in data["data"][0]
    assert "value" in data["data"][0]

def test_get_materials_breakdown(client: TestClient):
    """Test the materials endpoint returns the expected structure"""
    response = client.get("/api/v1/environmental-impact/materials?time_period=month")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check required fields
    assert "time_period" in data
    assert "total_weight_kg" in data
    assert "materials" in data
    assert "total_impact" in data
    assert "equivalence" in data
    assert "timestamp" in data
    
    # Check materials structure if any materials exist
    if data["materials"]:
        material = next(iter(data["materials"].values()))
        assert "weight_kg" in material
        assert "percentage" in material
        assert "carbon_saved_kg" in material
        assert "water_saved_liters" in material
        assert "energy_saved_kwh" in material

def test_get_community_leaderboard(client: TestClient):
    """Test the leaderboard endpoint returns the expected structure"""
    response = client.get(
        "/api/v1/environmental-impact/leaderboard?time_period=month&metric=recycled_weight"
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check required fields
    assert "time_period" in data
    assert "metric" in data
    assert "leaderboard" in data
    assert "timestamp" in data
    
    # Check leaderboard entries structure if any entries exist
    if data["leaderboard"]:
        entry = data["leaderboard"][0]
        assert "position" in entry
        assert "user_id" in entry
        assert "user_name" in entry
        assert "value" in entry

# No module-level cleanup that resets all overrides; per-test cleanup above is sufficient.