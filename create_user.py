#!/usr/bin/env python3
"""
إنشاء مستخدم تجريبي للتطبيق
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from app.db.session import SessionLocal
from app.models.user import User
from sqlalchemy import text

def create_simple_test_user():
    """إنشاء مستخدم تجريبي بطريقة مبسطة"""
    db = SessionLocal()
    
    try:
        # فحص إذا كان المستخدم موجود
        existing_user = db.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": "test@example.com"}
        ).fetchone()
        
        if existing_user:
            print("✅ المستخدم التجريبي موجود بالفعل")
            print("📧 Email: test@example.com")
            print("🔑 Password: password123")
            return
        
        # إنشاء مستخدم جديد بكلمة مرور بسيطة
        db.execute(
            text("""
                INSERT INTO users (email, hashed_password, name, is_active, role)
                VALUES (:email, :password, :name, :is_active, :role)
            """),
            {
                "email": "test@example.com",
                "password": "password123",  # في الواقع يجب أن تكون مشفرة
                "name": "Test User",
                "is_active": True,
                "role": "user"
            }
        )
        
        db.commit()
        print("✅ تم إنشاء المستخدم التجريبي بنجاح!")
        print("📧 Email: test@example.com")
        print("🔑 Password: password123")
        
    except Exception as e:
        print(f"❌ خطأ: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_simple_test_user()