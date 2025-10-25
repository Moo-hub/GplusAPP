#!/usr/bin/env python3
"""
إنشاء مستخدم تجريبي مبسط
"""

import sqlite3
import os

# مسار قاعدة البيانات
db_path = os.path.join("backend", "gplus.db")

def create_test_user():
    """إنشاء مستخدم تجريبي"""
    try:
        # الاتصال بقاعدة البيانات
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # فحص إذا كان المستخدم موجود
        cursor.execute("SELECT * FROM users WHERE email = ?", ("test@example.com",))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("✅ المستخدم التجريبي موجود بالفعل")
            print("📧 Email: test@example.com")
            print("🔑 Password: password123")
            return
        
        # إنشاء الجدول إذا لم يكن موجود
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email VARCHAR(100) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # إدراج مستخدم تجريبي (كلمة المرور بسيطة للاختبار)
        cursor.execute("""
            INSERT INTO users (email, hashed_password, name, is_active, role)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "test@example.com",
            "password123",  # في الواقع يجب أن تكون مشفرة
            "Test User",
            True,
            "user"
        ))
        
        # إدراج مستخدم آخر
        cursor.execute("""
            INSERT INTO users (email, hashed_password, name, is_active, role)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "demo@example.com",
            "demo123",
            "Demo User", 
            True,
            "user"
        ))
        
        conn.commit()
        print("✅ تم إنشاء المستخدمين التجريبيين بنجاح!")
        print()
        print("🔐 بيانات تسجيل الدخول:")
        print("📧 Email: test@example.com")
        print("🔑 Password: password123")
        print()
        print("أو:")
        print("📧 Email: demo@example.com") 
        print("🔑 Password: demo123")
        
    except Exception as e:
        print(f"❌ خطأ: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_test_user()