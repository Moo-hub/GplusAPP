"""
Tests for the Cache-Control headers integration.
"""

import pytest
from fastapi.testclient import TestClient
from unittest import mock

from app.main import app


@pytest.fixture
def test_client():
    """Test client for FastAPI app"""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Authentication headers for protected endpoints"""
    # In a real test, this would use a proper authentication flow
    # For now, mock the JWT token
    return {"Authorization": "Bearer test_token"}


def test_cache_control_headers_for_pickup_endpoints(test_client, auth_headers):
    """Test that pickup endpoints have appropriate cache-control headers"""
    # Mock the auth dependency
    with mock.patch("app.api.dependencies.auth.get_current_user") as mock_auth:
        # Configure mock user
        mock_user = mock.MagicMock()
        mock_user.id = 123
        mock_auth.return_value = mock_user
        
        # Test pickup list endpoint
        with mock.patch("app.api.api_v1.endpoints.pickup.pickup_crud") as mock_pickup_crud:
            mock_pickup_crud.get_by_user.return_value = []
            
            response = test_client.get("/api/v1/pickup/", headers=auth_headers)
            assert response.status_code == 200
            assert "Cache-Control" in response.headers
            assert "private" in response.headers["Cache-Control"]
            assert "max-age=300" in response.headers["Cache-Control"]
        
        # Test available slots endpoint
        with mock.patch("app.api.api_v1.endpoints.pickup.db") as mock_db:
            mock_db.query.return_value.filter.return_value.all.return_value = []
            
            response = test_client.get("/api/v1/pickup/available-slots/2023-12-01", headers=auth_headers)
            assert response.status_code == 200
            assert "Cache-Control" in response.headers
            assert "public" in response.headers["Cache-Control"]
            assert "max-age=60" in response.headers["Cache-Control"]


def test_cache_control_headers_for_points_endpoints(test_client, auth_headers):
    """Test that points endpoints have appropriate cache-control headers"""
    # Mock the auth dependency
    with mock.patch("app.api.dependencies.auth.get_current_user") as mock_auth:
        # Configure mock user
        mock_user = mock.MagicMock()
        mock_user.id = 123
        mock_user.points = 100
        mock_auth.return_value = mock_user
        
        # Mock database queries
        with mock.patch("app.api.api_v1.endpoints.points.db") as mock_db:
            # Configure mock for monthly points query
            monthly_points = mock.MagicMock()
            monthly_points.monthly_points = 50
            mock_db.query.return_value.filter.return_value.first.return_value = monthly_points
            
            response = test_client.get("/api/v1/points/", headers=auth_headers)
            assert response.status_code == 200
            assert "Cache-Control" in response.headers
            assert "private" in response.headers["Cache-Control"]
            assert "max-age=60" in response.headers["Cache-Control"]
            
        # Mock points history
        with mock.patch("app.api.api_v1.endpoints.points.point_crud") as mock_point_crud:
            mock_point_crud.get_by_user.return_value = []
            
            response = test_client.get("/api/v1/points/history", headers=auth_headers)
            assert response.status_code == 200
            assert "Cache-Control" in response.headers
            assert "private" in response.headers["Cache-Control"]
            assert "max-age=300" in response.headers["Cache-Control"]


def test_no_cache_for_mutation_endpoints(test_client, auth_headers):
    """Test that mutation endpoints have no-store cache-control headers"""
    # Mock the auth dependency
    with mock.patch("app.api.dependencies.auth.get_current_user") as mock_auth:
        # Configure mock user
        mock_user = mock.MagicMock()
        mock_user.id = 123
        mock_auth.return_value = mock_user
        
        # Mock CSRF validation
        with mock.patch("app.core.security.validate_csrf_token") as mock_csrf:
            mock_csrf.return_value = None
            
            # Mock the pickup CRUD operations for a POST request
            with mock.patch("app.api.api_v1.endpoints.pickup.pickup_crud") as mock_pickup_crud:
                mock_pickup_crud.create.return_value = mock.MagicMock()
                
                # Test create pickup endpoint
                response = test_client.post(
                    "/api/v1/pickup/", 
                    json={
                        "address": "123 Test St",
                        "scheduled_date": "2023-12-01T10:00:00",
                        "time_slot": "morning"
                    },
                    headers={**auth_headers, "X-CSRF-Token": "test_csrf_token"}
                )
                assert response.status_code == 200
                
                # Should have no-store cache directive
                assert "Cache-Control" in response.headers
                assert "no-store" in response.headers["Cache-Control"]