from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.redemption_option import RedemptionOption
from app.schemas.redemption_option import RedemptionOptionCreate, RedemptionOptionUpdate


def get(db: Session, option_id: int) -> Optional[RedemptionOption]:
    return db.query(RedemptionOption).filter(RedemptionOption.id == option_id).first()


def get_multi(
    db: Session, 
    *, 
    skip: int = 0, 
    limit: int = 100, 
    filters: Optional[Dict[str, Any]] = None
) -> List[RedemptionOption]:
    query = db.query(RedemptionOption)
    
    if filters:
        filter_conditions = []
        if filters.get("is_active") is not None:
            query = query.filter(RedemptionOption.is_active == filters["is_active"])
        
        if filters.get("category"):
            query = query.filter(RedemptionOption.category == filters["category"])
            
        if filters.get("partner_id"):
            query = query.filter(RedemptionOption.partner_id == filters["partner_id"])
            
        if filters.get("max_points"):
            query = query.filter(RedemptionOption.points_required <= filters["max_points"])
            
        if filters.get("in_stock") is True:
            query = query.filter(or_(
                RedemptionOption.stock == -1,  # Unlimited stock
                RedemptionOption.stock > 0     # Available stock
            ))
    
    return query.offset(skip).limit(limit).all()


def create(db: Session, *, obj_in: RedemptionOptionCreate) -> RedemptionOption:
    db_obj = RedemptionOption(
        name=obj_in.name,
        description=obj_in.description,
        points_required=obj_in.points_required,
        is_active=obj_in.is_active,
        image_url=obj_in.image_url,
        partner_id=obj_in.partner_id,
        category=obj_in.category,
        stock=obj_in.stock,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(
    db: Session, *, db_obj: RedemptionOption, obj_in: RedemptionOptionUpdate
) -> RedemptionOption:
    update_data = obj_in.dict(exclude_unset=True)
    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, id: int) -> RedemptionOption:
    obj = db.query(RedemptionOption).filter(RedemptionOption.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return obj


def update_stock(db: Session, *, option_id: int, change: int) -> RedemptionOption:
    """
    Update the stock quantity of a redemption option.
    A positive change value decreases the stock (used for redemptions).
    A negative change value increases the stock (used for returns or restocks).
    Returns None if the stock is insufficient for the requested change.
    """
    option = db.query(RedemptionOption).filter(RedemptionOption.id == option_id).first()
    
    if not option:
        return None
        
    # Skip stock check for unlimited items
    if option.stock == -1:
        return option
        
    # Check if enough stock is available
    if option.stock < change:
        return None
        
    # Update the stock
    option.stock -= change
    db.add(option)
    db.commit()
    db.refresh(option)
    
    return option