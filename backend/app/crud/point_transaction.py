from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.point_transaction import PointTransaction, TransactionType, TransactionSource, TransactionStatus
from app.models.user import User
from app.schemas.point_transaction import PointTransactionCreate

def get_by_user(db: Session, user_id: int) -> List[PointTransaction]:
    """
    Get all point transactions for a user
    """
    return db.query(PointTransaction).filter(PointTransaction.user_id == user_id).order_by(PointTransaction.created_at.desc()).all()

def get(db: Session, transaction_id: int) -> Optional[PointTransaction]:
    """
    Get a specific point transaction by ID
    """
    return db.query(PointTransaction).filter(PointTransaction.id == transaction_id).first()

def create(db: Session, obj_in: PointTransactionCreate) -> PointTransaction:
    """
    Create a new point transaction
    """
    db_obj = PointTransaction(
        user_id=obj_in.user_id,
        points=obj_in.points,
        type=obj_in.type,
        description=obj_in.description,
        source=obj_in.source,
        status=obj_in.status
    )
    
    # Update user's total points
    user = db.query(User).filter(User.id == obj_in.user_id).first()
    if user:
        if obj_in.type == TransactionType.EARN:
            user.points += obj_in.points
        elif obj_in.type == TransactionType.SPEND:
            user.points -= obj_in.points
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_status(db: Session, db_obj: PointTransaction, status: TransactionStatus) -> PointTransaction:
    """
    Update a transaction's status
    """
    # If cancelling a transaction, reverse the point change
    if status == TransactionStatus.CANCELLED and db_obj.status != TransactionStatus.CANCELLED:
        user = db.query(User).filter(User.id == db_obj.user_id).first()
        if user:
            if db_obj.type == TransactionType.EARN:
                user.points -= db_obj.points
            elif db_obj.type == TransactionType.SPEND:
                user.points += db_obj.points
    
    db_obj.status = status
    db.commit()
    db.refresh(db_obj)
    return db_obj