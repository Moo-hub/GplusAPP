from typing import Any, Dict, Optional, Union, List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password

def get(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create(db: Session, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        name=obj_in.name,
        hashed_password=get_password_hash(obj_in.password),
        is_active=True,
        points=0
    )
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