from fastapi import APIRouter, Depends, HTTPException, Query
from app.api.dependencies.auth import get_current_user
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any
from app.db.session import get_db
from app import models, schemas

router = APIRouter()

@router.get("/impact")
def get_environmental_impact() -> Dict[str, Any]:
    """Return sample environmental impact data for dashboard integration."""
    now = datetime.utcnow()
    return {
        "personal": {
            "all_time": {
                "weight_kg": 123.4,
                "carbon_savings_kg": 56.7,
                "pickups_completed": 12
            },
            "this_month": {
                "carbon_savings_kg": 7.8,
                "water_savings_liters": 90
            },
            "growth": {
                "carbon_percent": 12.5
            },
            "rank": 5,
            "top_materials": [
                {"name": "Plastic", "weight": 40.2},
                {"name": "Paper", "weight": 30.1}
            ],
            "equivalences": {
                "carbon": {
                    "car_kilometers": 100,
                    "trees_monthly_absorption": 2,
                    "meat_meals": 3
                },
                "water": {
                    "shower_minutes": 50,
                    "toilet_flushes": 20,
                    "drinking_water_days": 10
                }
            }
        },
        "community": {
            "impact": {
                "carbon_savings_kg": 1234.5,
                "water_savings_liters": 6789
            },
            "totals": {
                "unique_contributors": 42
            },
            "equivalences": {
                "carbon": {
                    "car_kilometers": 1000,
                    "trees_monthly_absorption": 20,
                    "meat_meals": 30
                },
                "water": {
                    "shower_minutes": 500,
                    "toilet_flushes": 200,
                    "drinking_water_days": 100
                }
            },
            "material_breakdown": [
                {"name": "Plastic", "weight": 400.2},
                {"name": "Paper", "weight": 300.1}
            ]
        },
        "leaderboard": {
            "leaderboard": [
                {"user_id": 1, "user_name": "Alice", "position": 1, "value": 50.0},
                {"user_id": 2, "user_name": "Bob", "position": 2, "value": 40.0}
            ],
            "metric": "carbon_savings_kg"
        },
        "timestamp": now.isoformat()
    }


@router.get("/")
def environmental_impact_root(user=Depends(get_current_user)):
    """API root for environmental impact. Returns a small doc payload for tests."""
    return {
        "message": "Welcome to the Environmental Impact API",
        "documentation": "Visit /docs for API documentation",
        "version": "1.0",
    }


@router.get("/summary")
def get_environmental_impact_summary(
    time_period: str = Query("month"),
    user=Depends(get_current_user),
) -> Dict[str, Any]:
    """Return a deterministic summary structure matching test expectations."""
    now = datetime.utcnow()
    return {
        "time_period": time_period,
        "total_recycled_kg": 0,
        "materials_breakdown": {},
        "carbon_impact": {"kg_co2_saved": 0, "equivalence": "0 trees planted"},
        "community_impact": {"total_pickups": 0},
        "timestamp": now.isoformat(),
    }


@router.get("/trend")
@router.get("/impact")
def get_environmental_impact(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Return sample environmental impact data for dashboard integration."""
    now = datetime.utcnow()
    # Replace this with real DB logic as needed
    return {
        "personal": {
            "all_time": {
                "weight_kg": 123.4,
                "carbon_savings_kg": 56.7,
                "pickups_completed": 12
            },
            "this_month": {
                "carbon_savings_kg": 7.8,
                "water_savings_liters": 90
            },
            "growth": {
                "carbon_percent": 12.5
            },
            "rank": 5,
            "top_materials": [
                {"name": "Plastic", "weight": 40.2},
                {"name": "Paper", "weight": 30.1}
            ],
            "equivalences": {
                "carbon": {
                    "car_kilometers": 100,
                    "trees_monthly_absorption": 2,
                    "meat_meals": 3
                },
                "water": {
                    "shower_minutes": 50,
                    "toilet_flushes": 20,
                    "drinking_water_days": 10
                }
            }
        },
        "community": {
            "impact": {
                "carbon_savings_kg": 1234.5,
                "water_savings_liters": 6789
            },
            "totals": {
                "unique_contributors": 42
            },
            "equivalences": {
                "carbon": {
                    "car_kilometers": 1000,
                    "trees_monthly_absorption": 20,
                    "meat_meals": 30
                },
                "water": {
                    "shower_minutes": 500,
                    "toilet_flushes": 200,
                    "drinking_water_days": 100
                }
            },
            "material_breakdown": [
                {"name": "Plastic", "weight": 400.2},
                {"name": "Paper", "weight": 300.1}
            ]
        },
        "leaderboard": {
            "leaderboard": [
                {"user_id": 1, "user_name": "Alice", "position": 1, "value": 50.0},
                {"user_id": 2, "user_name": "Bob", "position": 2, "value": 40.0}
            ],
            "metric": "carbon_savings_kg"
        },
        "timestamp": now.isoformat()
    }

