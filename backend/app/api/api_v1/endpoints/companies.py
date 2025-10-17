from fastapi import APIRouter, HTTPException, status, Depends, Request, Header
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from app.api.dependencies.auth import get_current_user, get_current_superuser
from app.core.security import validate_csrf_token
from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.schemas.company import Company as CompanySchema, CompanyCreate, CompanyUpdate
from app.crud import company as company_crud
from app.core.redis_cache import invalidate_namespace
from app.core.redis_fastapi import cached_endpoint

router = APIRouter()

@router.get("/", response_model=List[CompanySchema])
@cached_endpoint(
    namespace="companies",
    ttl=3600,  # Cache for 1 hour
    cache_by_user=False,  # Public data, no need to cache by user
    public_cache=True,
    cache_control="public, max-age=3600"
)
def get_companies(request: Request, db: Session = Depends(get_db)):
    """
    Get all partner recycling companies
    """
    companies = company_crud.get_all(db)
    # Normalize SQLAlchemy objects to Pydantic dicts
    return [CompanySchema.model_validate(c).model_dump() for c in companies]

@router.get("/{company_id}", response_model=CompanySchema)
@cached_endpoint(
    namespace="companies",
    ttl=3600,  # Cache for 1 hour
    vary_query_params=["company_id"],
    cache_by_user=False,  # Public data, no need to cache by user
    public_cache=True,
    cache_control="public, max-age=3600"
)
def get_company(company_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Get details for a specific company
    """
    company = company_crud.get(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanySchema.model_validate(company).model_dump()

@router.post("/", response_model=CompanySchema)
def create_company(
    company_in: CompanyCreate,
    request: Request,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_superuser)
):
    """
    Create a new partner recycling company (admin only)
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    company = company_crud.create(db, obj_in=company_in)
    
    # Invalidate companies cache
    invalidate_namespace("companies")
    
    return CompanySchema.model_validate(company).model_dump()

@router.put("/{company_id}", response_model=CompanySchema)
def update_company(
    company_id: int,
    company_in: CompanyUpdate,
    request: Request,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """
    Update a partner recycling company (admin only)
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    company = company_crud.get(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company = company_crud.update(db, db_obj=company, obj_in=company_in)
    
    # Invalidate companies cache
    invalidate_namespace("companies")
    
    return CompanySchema.model_validate(company).model_dump()

@router.delete("/{company_id}")
def delete_company(
    company_id: int,
    request: Request,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """
    Delete a partner recycling company (admin only)
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    company = company_crud.get(db, company_id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company_crud.delete(db, company_id=company_id)
    
    # Invalidate companies cache
    invalidate_namespace("companies")
    
    return {"message": "Company successfully deleted"}