#!/usr/bin/env python3

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models import User
from app.core.security import get_password_hash
from app.core.config import settings

def create_test_users():
    print("🔧 إنشاء مستخدمين للاختبار...")
    
    db = SessionLocal()
    try:
        # تحقق من وجود المستخدمين أولاً
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print("✅ المستخدم test@example.com موجود بالفعل")
        else:
            # إنشاء مستخدم اختبار (كلمة مرور غير مشفرة للاختبار)
            test_user = User(
                name="Test User",
                email="test@example.com",
                hashed_password="password123",  # مؤقت - غير مشفر
                is_active=True,
                role="user"
            )
            db.add(test_user)
            print("✅ تم إنشاء المستخدم: test@example.com")

        # إنشاء مستخدم إداري
        admin_user = db.query(User).filter(User.email == "admin@gplus.com").first()
        if admin_user:
            print("✅ المستخدم admin@gplus.com موجود بالفعل")
        else:
            admin_user = User(
                name="Admin User",
                email="admin@gplus.com",
                hashed_password="admin123",  # مؤقت - غير مشفر
                is_active=True,
                role="admin"
            )
            db.add(admin_user)
            print("✅ تم إنشاء المستخدم الإداري: admin@gplus.com")

        db.commit()
        print("🎉 تم حفظ البيانات بنجاح!")
        
        # عرض جميع المستخدمين
        users = db.query(User).all()
        print("\n📋 قائمة المستخدمين:")
        for user in users:
            print(f"  📧 {user.email} | 👤 {user.name} | {'🔓' if user.is_active else '🔒'}")
            
    except Exception as e:
        print(f"❌ خطأ: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()