from fastapi import APIRouter, Depends, HTTPException, Request, Header
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

import app.api.dependencies.auth as auth_deps
from app.core.security import validate_csrf_token
from app.db.session import get_db
from app.models.user import User
from app.models.point_transaction import PointTransaction
from app.core.redis_fastapi import cached_endpoint
from app.core.redis_cache import invalidate_namespace

router = APIRouter()

# Expose module-level attributes for tests that patch these symbols
db = None  # noqa: F401
try:
    # Provide a real default for runtime, tests may patch this symbol
    from app.crud import point_transaction as _point_crud_default
except Exception:  # pragma: no cover - fallback if import chain fails during collection
    _point_crud_default = None

point_crud = _point_crud_default  # noqa: F401

# Proxy dependency so tests can patch auth_deps.get_current_user and have it apply
async def _get_current_user_proxy(
    db: Session = Depends(get_db),
    token: str = Depends(auth_deps.oauth2_scheme),
) -> User:
    return await auth_deps.get_current_user(db=db, token=token)

@router.get("/")
@cached_endpoint(
    namespace="points",
    ttl=300,  # 5 minutes cache
    cache_by_user=True,
    cache_control="private, max-age=60, stale-while-revalidate=240"
)
async def get_points_summary(
    request: Request,
    current_user: User = Depends(_get_current_user_proxy), 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get points summary for the current user
    """
    # Calculate monthly points (transactions from this month)
    from sqlalchemy import func, extract
    from datetime import datetime
    
    current_month = datetime.now().month
    current_year = datetime.now().year
    
    monthly_points_query = db.query(func.sum(PointTransaction.points).label("monthly_points")).filter(
        PointTransaction.user_id == current_user.id,
        PointTransaction.type == "earn",
        extract('month', PointTransaction.created_at) == current_month,
        extract('year', PointTransaction.created_at) == current_year
    ).first()
    
    monthly_points = monthly_points_query.monthly_points or 0
    
    # Calculate streak (placeholder - would need more complex logic in real app)
    streak = 5  # Placeholder
    
    return {
        "balance": current_user.points,
        "impact": f"~{current_user.points * 0.006:.2f}kg CO₂",
        "reward": f"{int(current_user.points / 100)}% off next pickup",
        "monthlyPoints": monthly_points,
        "streak": streak
    }

@router.get("/history")
@cached_endpoint(
    namespace="points",
    ttl=300,  # 5 minutes cache
    cache_by_user=True,
    cache_control="private, max-age=300, stale-while-revalidate=300"
)
async def get_points_history(
    request: Request,
    current_user: User = Depends(_get_current_user_proxy), 
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get points transaction history
    """
    # Use module-level point_crud so tests can patch it
    from app.schemas.point_transaction import PointTransaction as PointTransactionSchema
    
    pc = point_crud
    if pc is None:
        # Fallback import if not set (e.g., in production runtime)
        from app.crud import point_transaction as pc  # type: ignore
    
    transactions = pc.get_by_user(db, user_id=current_user.id)
    
    return [
        {
            "id": transaction.id,
            "points": transaction.points,
            "type": transaction.type,
            "description": transaction.description,
            "source": transaction.source,
            "status": transaction.status,
            "created_at": transaction.created_at
        } for transaction in transactions
    ]

@router.post("/")
async def add_points(
    request: Request,
    data: Dict[str, Any],
    x_csrf_token: Optional[str] = Header(None),
    current_user: User = Depends(_get_current_user_proxy), 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Add points to user (admin function or triggered by pickup completion)
    Requires CSRF protection
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    from app.models.point_transaction import TransactionType, TransactionSource, TransactionStatus
    from app.schemas.point_transaction import PointTransactionCreate
    
    pc = point_crud
    if pc is None:
        from app.crud import point_transaction as pc  # type: ignore
    
    points = data["points"]
    if points <= 0:
        raise HTTPException(status_code=400, detail="Points must be a positive value")
    
    # Create the transaction
    transaction_in = PointTransactionCreate(
        user_id=current_user.id,
        points=points,
        type=TransactionType.EARN,
        description=data.get("description", "Points added"),
        source=data.get("source", TransactionSource.MANUAL),
        status=TransactionStatus.COMPLETED
    )
    
    transaction = pc.create(db, obj_in=transaction_in)
    
    # Invalidate points cache for this user
    invalidate_namespace("points")
    
    return {
        "success": True,
        "points_added": points,
        "new_balance": current_user.points,
        "transaction_id": transaction.id
    }

# End of points router