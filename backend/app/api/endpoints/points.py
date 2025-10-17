# backend/app/api/endpoints/points.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies.auth import get_current_active_user
from app.models.user import User
from app.models.point_transaction import PointTransaction

router = APIRouter()

@router.get("/")
def get_points_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    الحصول على ملخص النقاط للمستخدم الحالي
    """
    # هنا استخدم نفس بنية البيانات من المحاكاة للتوافق
    return {
        "balance": current_user.points,
        "impact": f"~{current_user.points * 0.006:.2f}kg CO₂",
        "reward": f"{int(current_user.points / 100)}% off next pickup",
        "monthlyPoints": 120,  # سيتم استبدالها بالحساب الفعلي
        "streak": 5  # سيتم استبدالها بالحساب الفعلي
    }