"""
Tests for WebSocket notification functionality
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User
from app.tests.utils.user import create_random_user
from app.core.security import create_access_token


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.mark.asyncio
async def test_websocket_notification(client: TestClient, db: Session):
    """Test sending notification via WebSocket"""
    # Create a user
    user = create_random_user(db)
    
    # Create access token for WebSocket authentication
    access_token = create_access_token({"sub": str(user.id)})
    
    # Generate a connection ID
    connection_id = "test-connection-123"
    
    # Connect to WebSocket with token
    with client.websocket_connect(f"/ws/{connection_id}?token={access_token}") as websocket:
        # Send a test message from the server side (manually)
        # This would normally be triggered by the notification system
        # but for testing, we can use an endpoint to send a test notification
        
        # Create a test notification payload
        notification_data = {
            "user_id": user.id,
            "type": "notification",
            "message": "Test notification via WebSocket",
            "timestamp": "2023-09-28T12:00:00Z",
            "link": "/test"
        }
        
        # Use the internal API to send a test notification to this connection
        response = client.post(
            f"/api/v1/internal/test-notification?connection_id={connection_id}",
            json=notification_data,
            headers={"X-Internal-Key": "test_internal_api_key"}
        )
        assert response.status_code == 200
        
        # Wait for the message to be received
        data = websocket.receive_json()
        
        # Verify the message
        assert data["type"] == "notification"
        assert data["message"] == "Test notification via WebSocket"
        
        # Send a ping and expect a pong
        websocket.send_json({"type": "ping"})
        pong = websocket.receive_json()
        assert pong["type"] == "pong"