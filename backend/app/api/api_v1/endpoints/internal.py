from fastapi import APIRouter, Header, HTTPException, status, Query
from typing import Dict, Any
from app.api.websockets import manager

router = APIRouter()

@router.post("/test-notification")
async def send_test_notification(
    connection_id: str = Query(...),
    payload: Dict[str, Any] = None,
    x_internal_key: str = Header(None, alias="X-Internal-Key")
):
    """
    Internal endpoint to send a test notification over WebSocket during tests.
    Protected by a simple header key.
    """
    if x_internal_key != "test_internal_api_key":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if not payload:
        payload = {"message": "ok"}
    # Send structured JSON to the websocket manager
    await manager.send_personal_message(payload, connection_id)
    return {"status": "sent"}
