import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_admin():
    db = SessionLocal()
    email = "admin@gplusapp.com"
    password = "Admin123!"
    name = "Administrator"
    # تحقق إذا كان المستخدم موجود مسبقًا
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"❗️ User already exists: {email}")
        db.close()
        return
    hashed_pw = get_password_hash(password)
    admin_user = User(
        email=email,
        name=name,
        hashed_password=hashed_pw,
        role="admin",
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    print(f"✅ Admin user created successfully: {admin_user.email}")
    db.close()

if __name__ == "__main__":
    create_admin()