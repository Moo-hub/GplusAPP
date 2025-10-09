from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.partner import Partner
from app.schemas.partner import PartnerCreate, PartnerUpdate


def get(db: Session, partner_id: int) -> Optional[Partner]:
    return db.query(Partner).filter(Partner.id == partner_id).first()


def get_by_name(db: Session, name: str) -> Optional[Partner]:
    return db.query(Partner).filter(Partner.name == name).first()


def get_multi(
    db: Session, *, skip: int = 0, limit: int = 100, is_active: Optional[bool] = None
) -> List[Partner]:
    query = db.query(Partner)
    if is_active is not None:
        query = query.filter(Partner.is_active == is_active)
    return query.offset(skip).limit(limit).all()


def create(db: Session, *, obj_in: PartnerCreate) -> Partner:
    db_obj = Partner(
        name=obj_in.name,
        description=obj_in.description,
        website=obj_in.website,
        logo_url=obj_in.logo_url,
        is_active=obj_in.is_active,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(
    db: Session, *, db_obj: Partner, obj_in: PartnerUpdate
) -> Partner:
    update_data = obj_in.dict(exclude_unset=True)
    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, id: int) -> Partner:
    obj = db.query(Partner).filter(Partner.id == id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return obj