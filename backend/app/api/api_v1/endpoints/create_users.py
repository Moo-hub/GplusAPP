from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import get_db
from app.models.user import User

router = APIRouter()

@router.post("/create-test-users")
def create_test_users(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    إنشاء مستخدمين للاختبار
    """
    try:
        # تحقق من وجود المستخدمين أولاً
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if not existing_user:
            # إنشاء مستخدم اختبار
            test_user = User(
                name="Test User",
                email="test@example.com",
                hashed_password="password123",  # غير مشفر للاختبار
                is_active=True,
                role="user"
            )
            db.add(test_user)
            
        admin_user = db.query(User).filter(User.email == "admin@gplus.com").first()
        if not admin_user:
            # إنشاء مستخدم إداري
            admin_user = User(
                name="Admin User",
                email="admin@gplus.com",
                hashed_password="admin123",  # غير مشفر للاختبار
                is_active=True,
                role="admin"
            )
            db.add(admin_user)
            
        db.commit()
        
        # عرض جميع المستخدمين
        users = db.query(User).all()
        user_list = []
        for user in users:
            user_list.append({
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "password": user.hashed_password,
                "is_active": user.is_active
            })
        
        return {"message": "Users created successfully", "users": user_list}
        
    except Exception as e:
        db.rollback()
        return {"error": str(e)}