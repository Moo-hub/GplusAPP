class DummyManager:
    def __init__(self):
        self.connections = []
    async def connect(self, websocket):
        self.connections.append(websocket)
    def disconnect(self, websocket):
        try:
            self.connections.remove(websocket)
        except ValueError:
            pass
    async def broadcast(self, message: str):
        # In tests we don't actually send messages
        return True

manager = DummyManager()
