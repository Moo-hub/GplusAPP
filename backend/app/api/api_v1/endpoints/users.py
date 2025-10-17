from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, Path, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.api.dependencies.auth import get_current_user, get_current_superuser
from app.core.security import validate_csrf_token, get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.crud import user as user_crud
from app.core.redis_fastapi import cached_endpoint
from app.core.redis_cache import invalidate_namespace

router = APIRouter()

@router.get("/")
@cached_endpoint(
    namespace="users",
    ttl=300,  # 5 minutes cache
    cache_by_user=True,
    cache_control="private, max-age=300"
)
async def get_users(
    request: Request,
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> List[Any]:
    """
    Get all users.
    Only admin users can access this endpoint.
    
    - **skip**: Number of users to skip (pagination)
    - **limit**: Maximum number of users to return (pagination)
    - **search**: Optional search term to filter users by name or email
    - **role**: Optional role filter
    """
    users = user_crud.get_multi(
        db, 
        skip=skip, 
        limit=limit,
        search=search,
        role=role
    )
    # Convert ORM objects to Pydantic schema instances for serialization
    return [UserSchema.model_validate(u).model_dump() for u in users]

@router.post("/")
async def create_user(
    request: Request,
    user_in: UserCreate,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> UserSchema:
    """
    Create new user.
    Only admin users can access this endpoint.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    # Check if user with this email already exists
    user = user_crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    user = user_crud.create(db, obj_in=user_in)
    
    # Invalidate users cache
    invalidate_namespace("users")

    return UserSchema.model_validate(user).model_dump()

@router.get("/me")
async def get_me(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current authenticated user's profile
    """
    return UserSchema.model_validate(current_user).model_dump()


@router.put("/me")
async def update_me(
    request: Request,
    user_in: UserUpdate,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update current authenticated user's profile
    """
    validate_csrf_token(request, x_csrf_token)
    user = user_crud.get(db, id=current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = user_crud.update(db, db_obj=user, obj_in=user_in)
    invalidate_namespace("users")
    return UserSchema.model_validate(user).model_dump()


@router.put("/me/password")
async def update_my_password(
    request: Request,
    payload: Dict[str, str],
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update current user's password
    Payload: {"current_password": "...", "new_password": "..."}
    """
    validate_csrf_token(request, x_csrf_token)
    current_password = payload.get("current_password")
    new_password = payload.get("new_password")
    if not current_password or not new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing password fields")
    user = user_crud.get(db, id=current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # Verify current password
    from app.core.security import verify_password, get_password_hash
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password invalid")
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    invalidate_namespace("users")
    return {"message": "Password updated successfully"}


@router.get("/{user_id}")
@cached_endpoint(
    namespace="users",
    ttl=300,  # 5 minutes cache
    cache_by_user=True,
    cache_control="private, max-age=300"
)
async def get_user_by_id(
    request: Request,
    user_id: int = Path(..., title="The ID of the user to get"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get a specific user by id.
    Regular users can only retrieve their own user information.
    Admin users can retrieve any user.
    """
    # Accept admin if role=='admin' OR is_superuser True
    is_admin = getattr(current_user, "role", "") == "admin" or getattr(current_user, "is_superuser", False)
    if not is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own user information."
        )
    
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserSchema.model_validate(user).model_dump()

@router.put("/{user_id}")
async def update_user(
    request: Request,
    user_id: int,
    user_in: UserUpdate,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update a user.
    Regular users can only update their own information.
    Admin users can update any user.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    # If the user is not an admin (role=='admin' or is_superuser) and is trying to update another user's info
    is_admin = getattr(current_user, "role", "") == "admin" or getattr(current_user, "is_superuser", False)
    if not is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only update your own user information."
        )
    
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow regular users to change their role
    if not is_admin and user_in.role and user_in.role != user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to change your role"
        )
    
    user = user_crud.update(db, db_obj=user, obj_in=user_in)
    
    # Invalidate users cache
    invalidate_namespace("users")

    return UserSchema.model_validate(user).model_dump()

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    request: Request,
    user_id: int,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> None:
    """
    Delete a user.
    Only admin users can access this endpoint.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow deleting oneself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own user account"
        )
    
    user_crud.remove(db, id=user_id)
    
    # Invalidate users cache
    invalidate_namespace("users")
    
    return None

@router.post("/{user_id}/verify-email", response_model=UserSchema)
async def verify_user_email(
    request: Request,
    user_id: int,
    verification_code: str,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> UserSchema:
    """
    Verify a user's email address.
    Only admin users can access this endpoint.
    
    In a real implementation, this would check against a stored verification code.
    For this API, we'll just mark the email as verified.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # In a real implementation, verify the code
    # For now, we'll just mark the email as verified
    user.email_verified = True
    db.commit()
    db.refresh(user)
    
    # Invalidate users cache
    invalidate_namespace("users")

    return UserSchema.model_validate(user).model_dump()

@router.post("/{user_id}/change-role", response_model=UserSchema)
async def change_user_role(
    request: Request,
    user_id: int,
    role: str,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> UserSchema:
    """
    Change a user's role.
    Only admin users can access this endpoint.
    
    Valid roles are:
    - user: Regular user
    - company: Company representative
    - admin: Administrator
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    # Validate role
    valid_roles = ["user", "company", "admin"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow changing the last admin
    if user.role == "admin" and role != "admin":
        admin_count = user_crud.count_by_role(db, role="admin")
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change the role of the last admin user"
            )
    
    user.role = role
    db.commit()
    db.refresh(user)
    
    # Invalidate users cache
    invalidate_namespace("users")

    return UserSchema.model_validate(user).model_dump()


@router.get("/me")
async def get_me(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current authenticated user's profile
    """
    return UserSchema.model_validate(current_user).model_dump()


@router.put("/me")
async def update_me(
    request: Request,
    user_in: UserUpdate,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update current authenticated user's profile
    """
    validate_csrf_token(request, x_csrf_token)
    user = user_crud.get(db, id=current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = user_crud.update(db, db_obj=user, obj_in=user_in)
    invalidate_namespace("users")
    return UserSchema.model_validate(user).model_dump()


@router.put("/me/password")
async def update_my_password(
    request: Request,
    payload: Dict[str, str],
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update current user's password
    Payload: {"current_password": "...", "new_password": "..."}
    """
    validate_csrf_token(request, x_csrf_token)
    current_password = payload.get("current_password")
    new_password = payload.get("new_password")
    if not current_password or not new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing password fields")
    user = user_crud.get(db, id=current_user.id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # Verify current password
    from app.core.security import verify_password, get_password_hash
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password invalid")
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    invalidate_namespace("users")
    return {"message": "Password updated successfully"}



@router.post("/{user_id}/deactivate")
async def deactivate_user(
    request: Request,
    user_id: int,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Deactivate a user. Admins can deactivate others; users cannot deactivate themselves or others.
    """
    validate_csrf_token(request, x_csrf_token)
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # Admin check
    is_admin = getattr(current_user, "role", "") == "admin" or getattr(current_user, "is_superuser", False)
    if not is_admin:
        # Regular users cannot deactivate others
        if current_user.id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        # Users cannot deactivate themselves
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot deactivate your own account")
    # Admin performing deactivation
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    invalidate_namespace("users")
    return UserSchema.model_validate(user).model_dump()