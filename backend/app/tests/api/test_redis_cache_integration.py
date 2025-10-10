"""Tests for the Redis caching integration with FastAPI endpoints."""

import json
import pytest
from unittest import mock
from datetime import date, datetime, timedelta
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
    # Use FastAPI dependency override so the request dependency resolves
    # to our mock user without requiring a valid JWT token.
    from app.api.dependencies import auth as auth_deps

    mock_user = mock.MagicMock()
    mock_user.id = 123
    mock_user.is_superuser = False

    app.dependency_overrides[auth_deps.get_current_user] = lambda: mock_user
    try:
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
    finally:
        # Clean up override
        app.dependency_overrides.pop(auth_deps.get_current_user, None)


def test_pickup_available_slots_caching(mock_redis, test_client, auth_headers):
    """Test that available slots endpoint is properly cached"""
    # Use FastAPI dependency override so the request dependency resolves
    # to our mock user without requiring a valid JWT token.
    from app.api.dependencies import auth as auth_deps

    mock_user = mock.MagicMock()
    mock_user.id = 123
    mock_user.is_superuser = False

    app.dependency_overrides[auth_deps.get_current_user] = lambda: mock_user
    try:
        # Use a date guaranteed to be in the future relative to the test run
        future_date = (datetime.utcnow().date() + timedelta(days=7))
        date_str = future_date.isoformat()

        # Mock available slots response data
        test_slots = {
            "date": date_str,
            "slots": [
                {"slot": "morning", "available": True},
                {"slot": "afternoon", "available": False},
                {"slot": "evening", "available": True}
            ]
        }
        # Mock database calls by overriding the get_db dependency so the
        # endpoint receives a session-like object whose query().filter().all()
        # returns an empty list.
        from app.db.session import get_db as app_get_db

        mock_db_session = mock.MagicMock()
        mock_db_session.query.return_value.filter.return_value.all.return_value = []

        app.dependency_overrides[app_get_db] = lambda: mock_db_session
        try:
            # First request - should be a cache miss
            response1 = test_client.get(f"/api/v1/pickup/available-slots/{date_str}", headers=auth_headers)
            assert response1.status_code == 200
            
            # Redis should have been called to set the value
            mock_redis.setex.assert_called_once()
            
            # Reset the mock for the next request
            mock_redis.setex.reset_mock()
            
            # For the second request, mock a cache hit
            mock_redis.get.return_value = json.dumps(test_slots).encode()
            
            # Second request - should be a cache hit
            response2 = test_client.get(f"/api/v1/pickup/available-slots/{date_str}", headers=auth_headers)
            assert response2.status_code == 200
            
            # Redis should NOT have been called to set the value again
            mock_redis.setex.assert_not_called()
        finally:
            app.dependency_overrides.pop(app_get_db, None)
    finally:
        app.dependency_overrides.pop(auth_deps.get_current_user, None)


def test_cache_invalidation(mock_redis, test_client, auth_headers):
    """Test that cache is properly invalidated after mutations"""
    # Use FastAPI dependency override so the request dependency resolves
    # to our mock user without requiring a valid JWT token.
    from app.api.dependencies import auth as auth_deps

    mock_user = mock.MagicMock()
    mock_user.id = 123
    mock_user.is_superuser = False

    app.dependency_overrides[auth_deps.get_current_user] = lambda: mock_user
    try:
        # Mock CSRF validation
        with mock.patch("app.core.security.validate_csrf_token") as mock_csrf:
            mock_csrf.return_value = None
            
            # Mock the pickup CRUD operations
            with mock.patch("app.api.api_v1.endpoints.pickup.pickup_crud") as mock_pickup_crud:
                # Provide a mock pickup that includes the required fields
                # expected by the response model so FastAPI can validate it.

                mock_pickup = mock.MagicMock()
                mock_pickup.id = 1
                mock_pickup.user_id = 123
                mock_pickup.status = "scheduled"
                mock_pickup.materials = ["paper"]
                mock_pickup.address = "123 Test St"
                mock_pickup.created_at = datetime.utcnow()
                mock_pickup.weight_estimate = 5.0
                mock_pickup.time_slot = "morning"
                # Use a valid recurrence type value expected by the response schema
                mock_pickup.recurrence_type = "none"
                mock_pickup.recurrence_end_date = None
                mock_pickup.is_recurring = False
                mock_pickup.calendar_event_id = None
                mock_pickup.points_estimate = None
                mock_pickup.points_earned = None
                mock_pickup.completed_at = None
                mock_pickup.weight_actual = None

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
    finally:
        app.dependency_overrides.pop(auth_deps.get_current_user, None)
        # Also remove get_db override if present
        try:
            from app.db.session import get_db as app_get_db
            app.dependency_overrides.pop(app_get_db, None)
        except Exception:
            pass