from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate

def get_all(db: Session) -> List[Company]:
    """
    Get all companies
    """
    return db.query(Company).all()

def get(db: Session, company_id: int) -> Optional[Company]:
    """
    Get company by ID
    """
    return db.query(Company).filter(Company.id == company_id).first()

def create(db: Session, obj_in: CompanyCreate) -> Company:
    """
    Create new company
    """
    db_obj = Company(
        name=obj_in.name,
        description=obj_in.description,
        logo_url=obj_in.logo_url,
        materials=obj_in.materials,
        impact_metrics=obj_in.impact_metrics,
        contact_info=obj_in.contact_info
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, db_obj: Company, obj_in: CompanyUpdate) -> Company:
    """
    Update company
    """
    update_data = obj_in.model_dump(exclude_unset=True)
    
    # Update fields
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete(db: Session, company_id: int) -> bool:
    """
    Delete company
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        return False
    
    db.delete(company)
    db.commit()
    return True