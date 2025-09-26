from fastapi import APIRouter

router = APIRouter()


@router.get("/users")
def get_users():
    # Example: Replace with real DB logic
    return [{"id": 1, "email": "user@example.com"}]
