from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Dict, Any, List

router = APIRouter()

@router.get("/")
async def docs_root() -> Dict[str, Any]:
    return {
        "message": "Welcome to the Environmental Impact API",
        "documentation": "See documentation for endpoints including summaries, trends, materials, and leaderboards.",
        "version": "1.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/summary")
async def get_summary(time_period: str = Query("month", enum=["day", "week", "month"])) -> Dict[str, Any]:
    now = datetime.utcnow()
    return {
        "time_period": time_period,
        "total_recycled_kg": 42.0,
        "materials_breakdown": {
            "plastic": 20.0,
            "paper": 12.0,
            "glass": 10.0
        },
        "carbon_impact": {
            "kg_co2_saved": 84.0,
            "equivalence": "≈ planting 4 trees"
        },
        "community_impact": {
            "total_pickups": 5,
            "participants": 3
        },
        "timestamp": now.isoformat()
    }

@router.get("/trend")
async def get_trend(
    metric: str = Query("recycled", enum=["recycled", "pickups", "carbon"]),
    time_range: str = Query("month", enum=["week", "month", "year"]),
    granularity: str = Query("day", enum=["day", "week"]),
) -> Dict[str, Any]:
    now = datetime.utcnow()
    points: List[Dict[str, Any]] = []
    for i in range(7):
        points.append({
            "date": (now - timedelta(days=(6 - i))).date().isoformat(),
            "value": 5 + i
        })
    return {
        "metric": metric,
        "time_range": time_range,
        "granularity": granularity,
        "data": points,
        "timestamp": now.isoformat()
    }

@router.get("/materials")
async def get_materials(time_period: str = Query("month", enum=["day", "week", "month"])) -> Dict[str, Any]:
    now = datetime.utcnow()
    materials = {
        "plastic": {
            "weight_kg": 20.0,
            "percentage": 0.5,
            "carbon_saved_kg": 30.0,
            "water_saved_liters": 200.0,
            "energy_saved_kwh": 15.0
        },
        "paper": {
            "weight_kg": 12.0,
            "percentage": 0.3,
            "carbon_saved_kg": 18.0,
            "water_saved_liters": 150.0,
            "energy_saved_kwh": 10.0
        }
    }
    return {
        "time_period": time_period,
        "total_weight_kg": sum(m["weight_kg"] for m in materials.values()),
        "materials": materials,
        "total_impact": {
            "carbon_saved_kg": sum(m["carbon_saved_kg"] for m in materials.values()),
            "water_saved_liters": sum(m["water_saved_liters"] for m in materials.values()),
            "energy_saved_kwh": sum(m["energy_saved_kwh"] for m in materials.values())
        },
        "equivalence": "≈ taking a car off the road for a day",
        "timestamp": now.isoformat()
    }

@router.get("/leaderboard")
async def get_leaderboard(
    time_period: str = Query("month", enum=["day", "week", "month"]),
    metric: str = Query("recycled_weight", enum=["recycled_weight", "pickups", "carbon_saved"]),
) -> Dict[str, Any]:
    now = datetime.utcnow()
    leaderboard = [
        {"position": 1, "user_id": 1, "user_name": "Test User", "value": 42.0},
        {"position": 2, "user_id": 2, "user_name": "Admin User", "value": 35.5},
    ]
    return {
        "time_period": time_period,
        "metric": metric,
        "leaderboard": leaderboard,
        "timestamp": now.isoformat()
    }
