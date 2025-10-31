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

@router.get("/me", response_model=UserSchema)
async def get_me(current_user: User = Depends(get_current_user)) -> UserSchema:
    """
    Get current authenticated user's profile.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_me(
    request: Request,
    user_in: UserUpdate,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserSchema:
    """
    Update current authenticated user's profile.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)

    # Regular users should not be able to change their role via this endpoint
    if user_in.role and user_in.role != current_user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to change your role"
        )

    updated = user_crud.update(db, db_obj=current_user, obj_in=user_in)

    # Invalidate users cache
    invalidate_namespace("users")

    return updated

@router.put("/me/password")
async def update_my_password(
    request: Request,
    payload: Dict[str, str],
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Update current authenticated user's password.
    """
    from app.core.security import verify_password, get_password_hash

    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)

    current_password = payload.get("current_password")
    new_password = payload.get("new_password")

    if not current_password or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both current_password and new_password are required"
        )

    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    current_user.hashed_password = get_password_hash(new_password)
    db.add(current_user)
    db.commit()

    # Invalidate users cache
    invalidate_namespace("users")

    return {"message": "Password updated successfully"}

@router.get("/", response_model=List[UserSchema])
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
) -> List[UserSchema]:
    """
    Get all users.
    Only admin users can access this endpoint.
    
    - **skip**: Number of users to skip (pagination)
    - **limit**: Maximum number of users to return (pagination)
    - **search**: Optional search term to filter users by name or email
    - **role**: Optional role filter
    """
    return user_crud.get_multi(
        db, 
        skip=skip, 
        limit=limit,
        search=search,
        role=role
    )

@router.post("/", response_model=UserSchema)
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
    
    return user

@router.get("/{user_id}", response_model=UserSchema)
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
) -> UserSchema:
    """
    Get a specific user by id.
    Regular users can only retrieve their own user information.
    Admin users can retrieve any user.
    """
    # If the user is not an admin and is trying to access another user's info
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only view your own user information."
        )
    
    user = user_crud.get(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    request: Request,
    user_id: int,
    user_in: UserUpdate,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserSchema:
    """
    Update a user.
    Regular users can only update their own information.
    Admin users can update any user.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)
    
    # If the user is not an admin and is trying to update another user's info
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only update your own user information."
        )
    
    user = user_crud.get(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't allow regular users to change their role
    if current_user.role != "admin" and user_in.role and user_in.role != user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to change your role"
        )
    
    user = user_crud.update(db, db_obj=user, obj_in=user_in)
    
    # Invalidate users cache
    invalidate_namespace("users")
    
    return user

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
    
    user = user_crud.get(db, user_id=user_id)
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
    
    user = user_crud.get(db, user_id=user_id)
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
    
    return user

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
    
    user = user_crud.get(db, user_id=user_id)
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
    
    return user

@router.post("/{user_id}/deactivate", response_model=UserSchema)
async def deactivate_user(
    request: Request,
    user_id: int,
    x_csrf_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
) -> UserSchema:
    """
    Deactivate a user account. Admin only. Cannot deactivate self.
    """
    # Validate CSRF token for mutation operations
    validate_csrf_token(request, x_csrf_token)

    user = user_crud.get(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Don't allow deactivating oneself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot deactivate your own account"
        )

    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)

    # Invalidate users cache
    invalidate_namespace("users")

    return user