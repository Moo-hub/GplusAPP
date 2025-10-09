from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api.dependencies import auth
from app.db.session import get_db
from app.core.redis_fastapi import cached_endpoint

router = APIRouter()


@router.get("/", response_model=List[schemas.Partner])
@cached_endpoint(
    namespace="partners",
    ttl=3600,  # Cache for 1 hour
    vary_query_params=["skip", "limit", "is_active"],
    cache_by_user=False,  # Public data, no need to cache by user
    public_cache=True,
    cache_control="public, max-age=3600"
)
def read_partners(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    is_active: bool = None,
    current_user: models.User = Depends(auth.get_current_user),
) -> Any:
    """
    Retrieve partners.
    """
    partners = crud.partner.get_multi(
        db, skip=skip, limit=limit, is_active=is_active
    )
    return partners


@router.post("/", response_model=schemas.Partner)
def create_partner(
    *,
    db: Session = Depends(get_db),
    partner_in: schemas.PartnerCreate,
    current_user: models.User = Depends(auth.get_current_superuser),
) -> Any:
    """
    Create new partner.
    """
    partner = crud.partner.get_by_name(db, name=partner_in.name)
    if partner:
        raise HTTPException(
            status_code=400,
            detail="A partner with this name already exists.",
        )
    partner = crud.partner.create(db, obj_in=partner_in)
    return partner


@router.put("/{id}", response_model=schemas.Partner)
def update_partner(
    *,
    db: Session = Depends(get_db),
    id: int,
    partner_in: schemas.PartnerUpdate,
    current_user: models.User = Depends(auth.get_current_superuser),
) -> Any:
    """
    Update a partner.
    """
    partner = crud.partner.get(db, partner_id=id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    partner = crud.partner.update(db, db_obj=partner, obj_in=partner_in)
    return partner


@router.get("/{id}", response_model=schemas.PartnerWithRelations)
def read_partner(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: models.User = Depends(auth.get_current_user),
) -> Any:
    """
    Get partner by ID.
    """
    partner = crud.partner.get(db, partner_id=id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


@router.delete("/{id}", response_model=schemas.Partner)
def delete_partner(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: models.User = Depends(auth.get_current_superuser),
) -> Any:
    """
    Delete a partner.
    """
    partner = crud.partner.get(db, partner_id=id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    partner = crud.partner.delete(db, id=id)
    return partner