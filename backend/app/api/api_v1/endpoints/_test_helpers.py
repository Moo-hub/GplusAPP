from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict

from app.core.config import settings
from app.crud.user import get as get_user, get_by_email
from app.core.security import create_access_token
from app.db.session import get_db

router = APIRouter()


@router.post("/test-token")
def test_token(payload: Dict[str, str], db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Test-only helper: return an access token for the given email.
    Only enabled in the test environment. This is used by test helpers
    when the normal token endpoint isn't convenient in the test harness.
    """
    # Only allow in tests
    if getattr(settings, "ENVIRONMENT", None) != "test":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email required")

    user = get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/test-token/{email}")
def test_token_get(email: str, db: Session = Depends(get_db)) -> Dict[str, str]:
    if getattr(settings, "ENVIRONMENT", None) != "test":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    user = get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}
