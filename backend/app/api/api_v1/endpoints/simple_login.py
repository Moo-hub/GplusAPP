from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import get_db
from app.models.user import User
from app.core.security import create_access_token

router = APIRouter()

@router.post("/debug-users")
def debug_users(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    عرض جميع المستخدمين للتشخيص
    """
    users = db.query(User).all()
    user_list = []
    for user in users:
        user_list.append({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "password": user.hashed_password[:20] + "...",
            "is_active": user.is_active
        })
    
    return {"users": user_list, "total": len(user_list)}

@router.post("/simple-login")
def simple_login(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Dict[str, Any]:
    """
    تسجيل دخول بسيط للاختبار
    """
    try:
        # البحث عن المستخدم
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user:
            return {"error": "User not found", "username": form_data.username}
        
        # التحقق من كلمة المرور (بدون تشفير)
        if user.hashed_password != form_data.password:
            return {"error": "Wrong password", "expected": user.hashed_password, "got": form_data.password}
        
        if not user.is_active:
            return {"error": "User not active"}
        
        # إنشاء token
        access_token = create_access_token(subject=str(user.id))
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": getattr(user, 'role', 'user')
            }
        }
    except Exception as e:
        return {"error": str(e)}