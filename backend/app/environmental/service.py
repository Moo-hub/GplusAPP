from typing import List, Dict
from datetime import datetime


async def list_impacts() -> List[Dict]:
    # Async signature in some implementations; tests call sync route so fastapi will handle
    return [
        {"id": 1, "category": "recycling", "score": 98},
        {"id": 2, "category": "compost", "score": 85},
    ]
