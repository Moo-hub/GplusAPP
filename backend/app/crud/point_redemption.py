from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.point_redemption import PointRedemption, RedemptionStatus
from app.schemas.point_redemption import PointRedemptionCreate, PointRedemptionUpdate


def get(db: Session, redemption_id: int) -> Optional[PointRedemption]:
    return db.query(PointRedemption).filter(PointRedemption.id == redemption_id).first()


def get_by_user(
    db: Session, 
    *, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100, 
    status: Optional[RedemptionStatus] = None
) -> List[PointRedemption]:
    query = db.query(PointRedemption).filter(PointRedemption.user_id == user_id)
    
    if status:
        query = query.filter(PointRedemption.status == status)
        
    return query.order_by(PointRedemption.created_at.desc()).offset(skip).limit(limit).all()


def get_multi(
    db: Session, 
    *, 
    skip: int = 0, 
    limit: int = 100, 
    filters: Optional[Dict[str, Any]] = None
) -> List[PointRedemption]:
    query = db.query(PointRedemption)
    
    if filters:
        if filters.get("status"):
            query = query.filter(PointRedemption.status == filters["status"])
            
        if filters.get("option_id"):
            query = query.filter(PointRedemption.option_id == filters["option_id"])
            
        if filters.get("user_id"):
            query = query.filter(PointRedemption.user_id == filters["user_id"])
    
    return query.order_by(PointRedemption.created_at.desc()).offset(skip).limit(limit).all()


def create(
    db: Session, 
    *, 
    user_id: int, 
    option_id: int, 
    points_spent: int
) -> PointRedemption:
    db_obj = PointRedemption(
        user_id=user_id,
        option_id=option_id,
        points_spent=points_spent,
        status=RedemptionStatus.PENDING
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_status(
    db: Session, 
    *, 
    db_obj: PointRedemption, 
    status: RedemptionStatus, 
    redemption_code: Optional[str] = None,
    notes: Optional[str] = None
) -> PointRedemption:
    db_obj.status = status
    
    if redemption_code is not None:
        db_obj.redemption_code = redemption_code
        
    if notes is not None:
        db_obj.notes = notes
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj