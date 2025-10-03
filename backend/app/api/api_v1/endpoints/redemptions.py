from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.dependencies import auth
from app.db.session import get_db
from app.models.user import User
from app.models.point_transaction import TransactionType, TransactionSource, TransactionStatus
from app.models.point_redemption import PointRedemption, RedemptionStatus
from app.schemas.point_redemption import (
    PointRedemption as PointRedemptionSchema,
    PointRedemptionCreate,
    PointRedemptionWithOption,
    PointRedemptionUpdate,
)
from app import crud

router = APIRouter()


@router.get("/", response_model=List[PointRedemptionWithOption])
def get_user_redemptions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[RedemptionStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> Any:
    """
    Get all redemptions for the current user.
    """
    redemptions = crud.point_redemption.get_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit, status=status
    )
    return redemptions


@router.post("/", response_model=PointRedemptionWithOption)
def redeem_points(
    *,
    db: Session = Depends(get_db),
    redemption_in: PointRedemptionCreate,
    current_user: User = Depends(auth.get_current_user),
) -> Any:
    """
    Redeem points for an option.
    """
    # Get the redemption option
    option = crud.redemption_option.get(db, option_id=redemption_in.option_id)
    if not option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Redemption option not found"
        )
        
    # Check if option is active
    if not option.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This redemption option is not currently available"
        )
        
    # Check if enough stock
    if option.stock == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This item is out of stock"
        )
        
    # Check if user has enough points
    if current_user.points < option.points_required:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient points. You need {option.points_required} points but have {current_user.points}."
        )
    
    # Begin transaction - redemption process should be atomic
    try:
        # 1. Create redemption record
        redemption = crud.point_redemption.create(
            db=db,
            user_id=current_user.id,
            option_id=option.id,
            points_spent=option.points_required
        )
        
        # 2. Create point transaction (negative points)
        transaction_in = {
            "user_id": current_user.id,
            "points": -option.points_required,  # Negative points for spending
            "type": TransactionType.SPEND,
            "description": f"Redemption: {option.name}",
            "source": TransactionSource.REDEMPTION,
            "status": TransactionStatus.COMPLETED,
            "redemption_id": redemption.id
        }
        transaction = crud.point_transaction.create(db, obj_in=transaction_in)
        
        # 3. Update user's points balance
        current_user.points -= option.points_required
        db.add(current_user)
        
        # 4. Decrease stock if not unlimited
        if option.stock > 0:
            crud.redemption_option.update_stock(
                db=db, 
                option_id=option.id, 
                change=1  # Decrease by 1
            )
            
        db.commit()
        db.refresh(redemption)
        
        return redemption
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing redemption: {str(e)}"
        )


@router.get("/{redemption_id}", response_model=PointRedemptionWithOption)
def get_redemption(
    redemption_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> Any:
    """
    Get details of a specific redemption.
    """
    redemption = crud.point_redemption.get(db, redemption_id=redemption_id)
    
    if not redemption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Redemption not found"
        )
        
    # Check if the redemption belongs to the current user
    if redemption.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this redemption"
        )
        
    return redemption


@router.put("/{redemption_id}/cancel", response_model=PointRedemptionWithOption)
def cancel_redemption(
    redemption_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
) -> Any:
    """
    Cancel a pending redemption and refund points.
    """
    redemption = crud.point_redemption.get(db, redemption_id=redemption_id)
    
    if not redemption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Redemption not found"
        )
        
    # Check if the redemption belongs to the current user
    if redemption.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this redemption"
        )
        
    # Check if the redemption is in a cancellable state
    if redemption.status != RedemptionStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel a redemption with status: {redemption.status.value}"
        )
    
    try:
        # 1. Update redemption status
        updated_redemption = crud.point_redemption.update_status(
            db=db,
            db_obj=redemption,
            status=RedemptionStatus.CANCELLED,
            notes="Cancelled by user"
        )
        
        # 2. Create refund transaction
        refund_transaction = {
            "user_id": current_user.id,
            "points": redemption.points_spent,  # Positive points for refund
            "type": TransactionType.EARN,
            "description": f"Refund for cancelled redemption: {redemption.option.name}",
            "source": TransactionSource.SYSTEM,
            "status": TransactionStatus.COMPLETED,
            "redemption_id": redemption.id
        }
        transaction = crud.point_transaction.create(db, obj_in=refund_transaction)
        
        # 3. Update user's points balance
        current_user.points += redemption.points_spent
        db.add(current_user)
        
        # 4. Increase stock if not unlimited
        option = redemption.option
        if option.stock != -1:
            crud.redemption_option.update_stock(
                db=db, 
                option_id=option.id, 
                change=-1  # Increase by 1 (negative change)
            )
        
        db.commit()
        
        return updated_redemption
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling redemption: {str(e)}"
        )


# Admin-only endpoints for managing redemptions
@router.get("/admin/all", response_model=List[PointRedemptionWithOption])
def get_all_redemptions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[RedemptionStatus] = None,
    user_id: Optional[int] = None,
    option_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_superuser),
) -> Any:
    """
    Get all redemptions (admin only).
    """
    filters = {}
    if status:
        filters["status"] = status
    if user_id:
        filters["user_id"] = user_id
    if option_id:
        filters["option_id"] = option_id
        
    redemptions = crud.point_redemption.get_multi(
        db, skip=skip, limit=limit, filters=filters
    )
    return redemptions


@router.put("/admin/{redemption_id}/status", response_model=PointRedemptionWithOption)
def update_redemption_status(
    redemption_id: int,
    status_update: PointRedemptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_superuser),
) -> Any:
    """
    Update the status of a redemption (admin only).
    """
    redemption = crud.point_redemption.get(db, redemption_id=redemption_id)
    
    if not redemption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Redemption not found"
        )
    
    # Handle status changes
    try:
        updated_redemption = crud.point_redemption.update_status(
            db=db,
            db_obj=redemption,
            status=status_update.status,
            redemption_code=status_update.redemption_code,
            notes=status_update.notes
        )
        
        # If changing from PENDING to CANCELLED, refund points
        if (redemption.status == RedemptionStatus.PENDING and 
            status_update.status == RedemptionStatus.CANCELLED):
            
            # 1. Create refund transaction
            refund_transaction = {
                "user_id": redemption.user_id,
                "points": redemption.points_spent,
                "type": TransactionType.EARN,
                "description": f"Refund for cancelled redemption: {redemption.option.name}",
                "source": TransactionSource.SYSTEM,
                "status": TransactionStatus.COMPLETED,
                "redemption_id": redemption.id
            }
            transaction = crud.point_transaction.create(db, obj_in=refund_transaction)
            
            # 2. Update user's points balance
            user = crud.user.get(db, id=redemption.user_id)
            user.points += redemption.points_spent
            db.add(user)
            
            # 3. Increase stock if not unlimited
            option = redemption.option
            if option.stock != -1:
                crud.redemption_option.update_stock(
                    db=db, 
                    option_id=option.id, 
                    change=-1  # Increase by 1 (negative change)
                )
        
        db.commit()
        db.refresh(updated_redemption)
        
        return updated_redemption
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating redemption: {str(e)}"
        )
