from typing import Any, Dict, Optional, Union, List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

def get(db: Session, user_id: int = None, id: int = None) -> Optional[User]:
    """Fetch a user by id. Accepts either `user_id` or `id` keyword for
    compatibility with different callers/tests.
    """
    lookup_id = user_id if user_id is not None else id
    if lookup_id is None:
        return None
    # Prefer Session.get when available
    try:
        return db.get(User, lookup_id)
    except Exception:
        return db.query(User).filter(User.id == lookup_id).first()

def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create(db: Session, obj_in: Union[UserCreate, Dict[str, Any]]) -> User:
    """
    Create a new user. Accepts either a Pydantic `UserCreate` or a plain dict
    (some tests call create with a dict).
    """
    # Support dict input
    if isinstance(obj_in, dict):
        email = obj_in.get("email")
        name = obj_in.get("name")
        password = obj_in.get("password") or obj_in.get("hashed_password")
        address = obj_in.get("address")
        phone_number = obj_in.get("phone_number") or obj_in.get("phone")
        is_super = bool(obj_in.get("is_superuser", False))
    else:
        email = obj_in.email
        name = obj_in.name
        password = getattr(obj_in, "password", None)
        address = getattr(obj_in, "address", None)
        phone_number = getattr(obj_in, "phone_number", None)
        is_super = bool(getattr(obj_in, "is_superuser", False))

    hashed = password if password and password.startswith("$2b$") else get_password_hash(password) if password else None

    db_obj = User(
        email=email,
        name=name,
        hashed_password=hashed or "",
        is_active=True,
        points=0
    )

    # Map optional profile fields if provided
    if address:
        db_obj.address = address
    if phone_number:
        # Model uses `phone` column; set via property for compatibility
        db_obj.phone_number = phone_number

    # Preserve is_superuser if provided (tests may set this)
    if is_super:
        db_obj.is_superuser = True

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(db: Session, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]) -> User:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        update_data["hashed_password"] = hashed_password
    
    for field in update_data:
        if hasattr(db_obj, field):
            setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def authenticate(db: Session, email: str, password: str) -> Optional[User]:
    user = get_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_multi(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    role: Optional[str] = None
) -> List[User]:
    """
    Get multiple users with optional filtering
    
    Args:
        db: Database session
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return (pagination)
        search: Optional search term for email or name
        role: Optional role to filter by
        
    Returns:
        List of User objects
    """
    query = db.query(User)
    
    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
    
    # Apply role filter if provided
    if role:
        query = query.filter(User.role == role)
    
    # Apply pagination and return results
    return query.offset(skip).limit(limit).all()

def remove(db: Session, id: int) -> None:
    """
    Delete a user by ID
    
    Args:
        db: Database session
        id: User ID to delete
        
    Returns:
        None
    """
    # Use Session.get when available
    try:
        obj = db.get(User, id)
    except Exception:
        obj = db.query(User).get(id)
    db.delete(obj)
    db.commit()
    return None

def count_by_role(db: Session, role: str) -> int:
    """
    Count the number of users with a specific role
    
    Args:
        db: Database session
        role: Role to count
        
    Returns:
        Number of users with the specified role
    """
    return db.query(func.count(User.id)).filter(User.role == role).scalar()