"""
Example implementation for paginated API endpoints
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc

from app.db.session import get_db
from app.models.user import User
from app.models.pickup_request import PickupRequest
from app.api.dependencies.auth import get_current_superuser
from app.utils.db_optimization import paginated_response, apply_sorting

router = APIRouter()

@router.get("/pickup-requests")
async def get_paginated_pickups(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    sort_by: Optional[str] = Query(None, description="Column to sort by"),
    sort_dir: Optional[str] = Query("asc", description="Sort direction: asc or desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Dict[str, Any]:
    """
    Get paginated pickup requests with optional filtering and sorting.
    
    This endpoint demonstrates efficient pagination, filtering, and sorting.
    """
    # Build base query
    query = db.query(PickupRequest)
    
    # Apply filters
    if status:
        query = query.filter(PickupRequest.status == status)
    
    # Apply sorting
    if sort_by:
        query = apply_sorting(query, sort_by, sort_dir)
    else:
        # Default sorting by creation date
        query = query.order_by(desc(PickupRequest.created_at))
    
    # Get paginated response
    return paginated_response(db, query, page, page_size)

@router.get("/users")
async def get_paginated_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    sort_by: Optional[str] = Query("created_at", description="Column to sort by"),
    sort_dir: Optional[str] = Query("desc", description="Sort direction: asc or desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> Dict[str, Any]:
    """
    Get paginated users with filtering, searching, and sorting.
    
    This endpoint demonstrates:
    - Text search across multiple fields
    - Role-based filtering
    - Efficient pagination
    - Sorting
    """
    # Build base query
    query = db.query(User)
    
    # Apply role filter
    if role:
        query = query.filter(User.role == role)
    
    # Apply search filter (across multiple columns)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_term)) | 
            (User.email.ilike(search_term))
        )
    
    # Apply sorting
    if sort_by:
        query = apply_sorting(query, sort_by, sort_dir)
    else:
        # Default sorting
        query = query.order_by(desc(User.created_at))
    
    # Get paginated response
    return paginated_response(db, query, page, page_size)

@router.get("/pickup-metrics")
async def get_pickup_metrics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    group_by: str = Query("day", description="Group by: day, week, month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> List[Dict[str, Any]]:
    """
    Get metrics for pickups with efficient grouping and date filtering.
    
    This endpoint demonstrates:
    - Grouping by date periods
    - Efficient metrics calculation
    - Date range filtering
    """
    from sqlalchemy import func, cast, Date
    from datetime import datetime, timedelta
    
    # Parse dates
    if start_date:
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        # Default to 30 days ago
        start_date = datetime.now() - timedelta(days=30)
    
    if end_date:
        end_date = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        end_date = datetime.now()
    
    # Create the base query
    query = db.query(PickupRequest).filter(
        PickupRequest.created_at.between(start_date, end_date)
    )
    
    # Define the date grouping function based on the group_by parameter
    if group_by == "day":
        date_group = func.date_trunc("day", PickupRequest.created_at)
    elif group_by == "week":
        date_group = func.date_trunc("week", PickupRequest.created_at)
    elif group_by == "month":
        date_group = func.date_trunc("month", PickupRequest.created_at)
    else:
        raise HTTPException(status_code=400, detail="Invalid group_by parameter")
    
    # Build the metrics query
    metrics_query = db.query(
        date_group.label("date"),
        func.count(PickupRequest.id).label("count"),
        func.sum(PickupRequest.weight_estimate).label("total_weight"),
        func.avg(PickupRequest.weight_estimate).label("avg_weight")
    ).filter(
        PickupRequest.created_at.between(start_date, end_date)
    ).group_by("date").order_by("date")
    
    # Execute the query and format the results
    results = []
    for row in metrics_query.all():
        results.append({
            "date": row.date.strftime("%Y-%m-%d"),
            "count": row.count,
            "total_weight": float(row.total_weight) if row.total_weight else 0,
            "avg_weight": float(row.avg_weight) if row.avg_weight else 0,
        })
    
    return results