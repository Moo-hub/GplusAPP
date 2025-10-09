from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Set
import json
import asyncio
from datetime import datetime

from app.db.session import get_db
from app.api.dependencies.auth import get_websocket_user
from app.models.user import User

# Store active connections
class ConnectionManager:
    def __init__(self):
        # All active connections: {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        # User connections: {user_id: set(connection_ids)}
        self.user_connections: Dict[int, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str, user: Optional[User] = None):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        
        if user:
            if user.id not in self.user_connections:
                self.user_connections[user.id] = set()
            self.user_connections[user.id].add(connection_id)
    
    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            # Remove from user connections if exists
            for user_id, connections in self.user_connections.items():
                if connection_id in connections:
                    connections.remove(connection_id)
                    # Clean up empty sets
                    if len(connections) == 0:
                        self.user_connections.pop(user_id)
                    break
            
            # Remove from active connections
            self.active_connections.pop(connection_id)
            
            return websocket
        return None
    
    async def send_personal_message(self, message: dict, connection_id: str):
        if connection_id in self.active_connections:
            await self.active_connections[connection_id].send_json(message)
    
    async def send_to_user(self, message: dict, user_id: int):
        if user_id in self.user_connections:
            for connection_id in self.user_connections[user_id]:
                await self.send_personal_message(message, connection_id)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_json(message)

# Create manager instance
manager = ConnectionManager()

# WebSocket endpoint
async def websocket_endpoint(
    websocket: WebSocket,
    connection_id: str,
    db: Session = Depends(get_db)
):
    user = await get_websocket_user(websocket, db)
    
    try:
        await manager.connect(websocket, connection_id, user)
        
        # Send welcome message
        welcome_msg = {
            "type": "system",
            "message": "Connected to GPlus notification service",
            "authenticated": user is not None
        }
        await manager.send_personal_message(welcome_msg, connection_id)
        
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Process message based on type
                if message.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, connection_id)
                # Add other message type handlers here
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "message": "Invalid JSON format"
                }, connection_id)
                
    except WebSocketDisconnect:
        manager.disconnect(connection_id)