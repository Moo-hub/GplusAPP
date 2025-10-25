from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import get_db
from app.models.user import User
from app.core.security import create_access_token

router = APIRouter()

@router.post("/test-login")
def test_login(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Dict[str, Any]:
    """
    مؤقت للاختبار - تسجيل دخول بدون تشفير كلمة المرور
    """
    print(f"🔍 محاولة تسجيل دخول: {form_data.username}")
    
    # البحث عن المستخدم
    user = db.query(User).filter(User.email == form_data.username).first()
    
    print(f"🔍 المستخدم الموجود: {user.email if user else 'لا يوجد'}")
    
    if not user:
        # طباعة جميع المستخدمين للتشخيص
        all_users = db.query(User).all()
        print(f"🔍 جميع المستخدمين في قاعدة البيانات:")
        for u in all_users:
            print(f"  - {u.email}")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # التحقق من كلمة المرور (بدون تشفير للاختبار)
    if user.hashed_password != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    
    # إنشاء token
    access_token = create_access_token(subject=str(user.id))
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }