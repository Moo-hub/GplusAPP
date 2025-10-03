from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api.dependencies import auth
from app.db.session import get_db
from app.core.redis_fastapi import cached_endpoint

router = APIRouter()


@router.get("/", response_model=List[schemas.RedemptionOption])
@cached_endpoint(
    namespace="redemption_options",
    ttl=1800,  # Cache for 30 minutes (shorter since these may change more frequently)
    vary_query_params=["skip", "limit", "is_active", "category", "partner_id", "in_stock"],
    cache_by_user=True,  # Cache per user as results depend on user's points
    public_cache=False,
    cache_control="private, max-age=1800"
)
def read_redemption_options(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = True,
    category: Optional[str] = None,
    partner_id: Optional[int] = None,
    in_stock: Optional[bool] = None,
    current_user: models.User = Depends(auth.get_current_user),
) -> Any:
    """
    Retrieve redemption options.
    """
    filters = {}
    if is_active is not None:
        filters["is_active"] = is_active
    if category:
        filters["category"] = category
    if partner_id:
        filters["partner_id"] = partner_id
    if in_stock is not None:
        filters["in_stock"] = in_stock
    if current_user:
        filters["max_points"] = current_user.points
        
    options = crud.redemption_option.get_multi(
        db, skip=skip, limit=limit, filters=filters
    )
    return options


@router.post("/", response_model=schemas.RedemptionOption)
def create_redemption_option(
    *,
    db: Session = Depends(get_db),
    option_in: schemas.RedemptionOptionCreate,
    current_user: models.User = Depends(auth.get_current_superuser),
) -> Any:
    """
    Create new redemption option.
    """
    if option_in.partner_id:
        partner = crud.partner.get(db, partner_id=option_in.partner_id)
        if not partner:
            raise HTTPException(
                status_code=400,
                detail="Partner not found",
            )
    
    option = crud.redemption_option.create(db, obj_in=option_in)
    return option


@router.put("/{id}", response_model=schemas.RedemptionOption)
def update_redemption_option(
    *,
    db: Session = Depends(get_db),
    id: int,
    option_in: schemas.RedemptionOptionUpdate,
    current_user: models.User = Depends(auth.get_current_superuser),
) -> Any:
    """
    Update a redemption option.
    """
    option = crud.redemption_option.get(db, option_id=id)
    if not option:
        raise HTTPException(status_code=404, detail="Redemption option not found")
        
    if option_in.partner_id and option_in.partner_id != option.partner_id:
        partner = crud.partner.get(db, partner_id=option_in.partner_id)
        if not partner:
            raise HTTPException(status_code=400, detail="Partner not found")
            
    option = crud.redemption_option.update(db, db_obj=option, obj_in=option_in)
    return option


@router.get("/{id}", response_model=schemas.RedemptionOptionWithPartner)
def read_redemption_option(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: models.User = Depends(auth.get_current_user),
) -> Any:
    """
    Get redemption option by ID.
    """
    option = crud.redemption_option.get(db, option_id=id)
    if not option:
        raise HTTPException(status_code=404, detail="Redemption option not found")
    return option


@router.delete("/{id}", response_model=schemas.RedemptionOption)
def delete_redemption_option(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: models.User = Depends(auth.get_current_superuser),
) -> Any:
    """
    Delete a redemption option.
    """
    option = crud.redemption_option.get(db, option_id=id)
    if not option:
        raise HTTPException(status_code=404, detail="Redemption option not found")
    option = crud.redemption_option.delete(db, id=id)
    return option