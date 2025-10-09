"""
Tests for the Redis caching integration with FastAPI endpoints.
"""

import json
import pytest
from unittest import mock
from datetime import date
from fastapi.testclient import TestClient

from app.core.redis_cache import redis_client, generate_cache_key
from app.main import app


@pytest.fixture
def mock_redis():
    """Mock Redis client for testing"""
    with mock.patch("app.core.redis_cache.redis_client") as mock_redis:
        # Configure the mock
        mock_redis.get.return_value = None  # Default: cache miss
        mock_redis.setex.return_value = True
        mock_redis.delete.return_value = 1
        yield mock_redis


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


def test_pickup_endpoint_caching(mock_redis, test_client, auth_headers):
    """Test that pickup endpoints are properly cached"""
    # Mock the get_current_user dependency
    with mock.patch("app.api.dependencies.auth.get_current_user") as mock_auth:
        # Configure mock user
        mock_user = mock.MagicMock()
        mock_user.id = 123
        mock_user.is_superuser = False
        mock_auth.return_value = mock_user
        
        # Mock the DB dependency to return test data
        with mock.patch("app.api.api_v1.endpoints.pickup.pickup_crud") as mock_pickup_crud:
            # Configure the mock to return test pickup requests
            test_pickup = {
                "id": 1,
                "user_id": 123,
                "status": "scheduled",
                "scheduled_date": "2023-12-01T10:00:00",
                "address": "123 Test St",
                "weight_estimate": 10.5,
                "time_slot": "morning"
            }
            mock_pickup_crud.get.return_value = mock.MagicMock(**test_pickup)
            mock_pickup_crud.get_by_user.return_value = [mock.MagicMock(**test_pickup)]
            
            # First request - should be a cache miss
            response1 = test_client.get("/api/v1/pickup/1", headers=auth_headers)
            assert response1.status_code == 200
            
            # Redis should have been called to set the value
            mock_redis.setex.assert_called_once()
            
            # Reset the mock for the next request
            mock_redis.setex.reset_mock()
            
            # For the second request, mock a cache hit
            mock_redis.get.return_value = json.dumps(test_pickup).encode()
            
            # Second request - should be a cache hit
            response2 = test_client.get("/api/v1/pickup/1", headers=auth_headers)
            assert response2.status_code == 200
            
            # Redis should NOT have been called to set the value again
            mock_redis.setex.assert_not_called()
            
            # Both responses should have the same content
            assert response1.json() == response2.json()


def test_pickup_available_slots_caching(mock_redis, test_client, auth_headers):
    """Test that available slots endpoint is properly cached"""
    # Mock the get_current_user dependency
    with mock.patch("app.api.dependencies.auth.get_current_user") as mock_auth:
        # Configure mock user
        mock_user = mock.MagicMock()
        mock_user.id = 123
        mock_user.is_superuser = False
        mock_auth.return_value = mock_user
        
        # Mock available slots response data
        test_slots = {
            "date": "2023-12-01",
            "slots": [
                {"slot": "morning", "available": True},
                {"slot": "afternoon", "available": False},
                {"slot": "evening", "available": True}
            ]
        }
        
        # Mock database calls
        with mock.patch("app.api.api_v1.endpoints.pickup.db") as mock_db:
            mock_db.query.return_value.filter.return_value.all.return_value = []
            
            # First request - should be a cache miss
            response1 = test_client.get("/api/v1/pickup/available-slots/2023-12-01", headers=auth_headers)
            assert response1.status_code == 200
            
            # Redis should have been called to set the value
            mock_redis.setex.assert_called_once()
            
            # Reset the mock for the next request
            mock_redis.setex.reset_mock()
            
            # For the second request, mock a cache hit
            mock_redis.get.return_value = json.dumps(test_slots).encode()
            
            # Second request - should be a cache hit
            response2 = test_client.get("/api/v1/pickup/available-slots/2023-12-01", headers=auth_headers)
            assert response2.status_code == 200
            
            # Redis should NOT have been called to set the value again
            mock_redis.setex.assert_not_called()


def test_cache_invalidation(mock_redis, test_client, auth_headers):
    """Test that cache is properly invalidated after mutations"""
    # Mock the get_current_user dependency
    with mock.patch("app.api.dependencies.auth.get_current_user") as mock_auth:
        # Configure mock user
        mock_user = mock.MagicMock()
        mock_user.id = 123
        mock_user.is_superuser = False
        mock_auth.return_value = mock_user
        
        # Mock CSRF validation
        with mock.patch("app.core.security.validate_csrf_token") as mock_csrf:
            mock_csrf.return_value = None
            
            # Mock the pickup CRUD operations
            with mock.patch("app.api.api_v1.endpoints.pickup.pickup_crud") as mock_pickup_crud:
                mock_pickup = mock.MagicMock()
                mock_pickup.user_id = 123
                mock_pickup.status = "scheduled"
                
                mock_pickup_crud.get.return_value = mock_pickup
                mock_pickup_crud.update.return_value = mock_pickup
                
                # Test update operation - should invalidate cache
                response = test_client.put(
                    "/api/v1/pickup/1", 
                    json={"status": "in_progress"},
                    headers={**auth_headers, "X-CSRF-Token": "test_csrf_token"}
                )
                assert response.status_code == 200
                
                # Cache invalidation should have been called
                mock_redis.delete.assert_called()
                
                # Reset the mock for the next operation
                mock_redis.delete.reset_mock()
                
                # Test delete operation - should also invalidate cache
                response = test_client.delete(
                    "/api/v1/pickup/1",
                    headers={**auth_headers, "X-CSRF-Token": "test_csrf_token"}
                )
                assert response.status_code == 204
                
                # Cache invalidation should have been called again
                mock_redis.delete.assert_called()