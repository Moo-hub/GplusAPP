"""
Environmental impact analytics API endpoints

This module provides endpoints for calculating and retrieving environmental impact metrics
related to recycling activities. These metrics include carbon savings, water savings,
energy conservation, and material breakdown data at both individual and community levels.

The API supports:
- Summary metrics for overall environmental impact
- Trend analysis over time
- Material breakdown analytics
- Historical data comparisons
- Personalized impact dashboards for users
- Community-wide impact statistics
- Environmental impact leaderboards
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.api.dependencies.auth import get_current_user, get_current_superuser
from app.models.user import User
from app.models.pickup_request import PickupRequest
from app.core.config import settings
from app.core.redis_fastapi import cached_endpoint
from app.utils.carbon_calculator import calculate_carbon_savings, get_carbon_equivalence
from app.utils.water_calculator import calculate_water_savings, get_water_equivalence
from app.utils.energy_calculator import calculate_energy_savings, get_energy_equivalence
from app.utils.materials_data import MATERIAL_IMPACT_DATA
from app.schemas.environmental_impact import (
    EnvironmentalImpactSummary,
    EnvironmentalImpactTrend,
    MaterialsDetailedBreakdown,
    CommunityLeaderboard,
    UserImpactSummary,
    MaterialBreakdown,
    CarbonEquivalence,
    WaterEquivalence,
    EnergyEquivalence,
    TrendDataPoint,
    LeaderboardEntry
)

router = APIRouter()


@router.get("/summary", 
    summary="Get environmental impact summary",
    description="Retrieves aggregated environmental impact metrics including recycled weight, carbon savings, and community participation",
    response_description="Environmental impact summary with carbon equivalence metrics",
    responses={
        200: {
            "description": "Successful response with environmental impact summary",
            "content": {
                "application/json": {
                    "example": {
                        "time_period": "month",
                        "total_recycled_kg": 528.75,
                        "materials_breakdown": {
                            "paper": 215.4,
                            "plastic": 146.8,
                            "glass": 98.2,
                            "metal": 68.35
                        },
                        "carbon_impact": {
                            "kg_co2_saved": 1052.15,
                            "equivalence": {
                                "car_kilometers": 8768.0,
                                "flight_kilometers": 11691.0,
                                "trees_month": 1402.87,
                                "smartphone_charges": 21043
                            }
                        },
                        "community_impact": {
                            "total_pickups": 143,
                            "unique_participants": 57
                        },
                        "timestamp": "2025-09-29T14:30:45.123456"
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - Authentication required"
        },
        500: {
            "description": "Internal server error"
        }
    }
)
@cached_endpoint(
    namespace="analytics_env_summary",
    ttl=3600,  # Cache for 1 hour
    cache_control="public, max-age=3600"
)
async def get_environmental_impact_summary(
    time_period: str = Query("month", description="Time period for the summary: day, week, month, year, all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get summary of environmental impact metrics
    
    - **time_period**: Time period for metrics (day, week, month, year, all)
    """
    try:
        # Calculate the start date based on the time period
        end_date = datetime.utcnow()
        if time_period == "day":
            start_date = end_date - timedelta(days=1)
        elif time_period == "week":
            start_date = end_date - timedelta(weeks=1)
        elif time_period == "month":
            start_date = end_date - timedelta(days=30)
        elif time_period == "year":
            start_date = end_date - timedelta(days=365)
        else:  # "all"
            start_date = datetime(2000, 1, 1)  # Effectively all time
            
        # Query completed pickups in the given time period
        completed_pickups = db.query(PickupRequest).filter(
            PickupRequest.status == "completed",
            PickupRequest.completed_at.between(start_date, end_date)
        ).all()
        
        # Calculate total materials collected
        total_weight = 0
        materials_collected = {}
        for pickup in completed_pickups:
            if pickup.weight_actual:
                total_weight += pickup.weight_actual
                
                # If we have actual weight, distribute proportionally among materials
                if pickup.materials and isinstance(pickup.materials, list):
                    materials_count = len(pickup.materials)
                    if materials_count > 0:
                        weight_per_material = pickup.weight_actual / materials_count
                        for material in pickup.materials:
                            materials_collected[material] = materials_collected.get(material, 0) + weight_per_material
        
        # Calculate carbon savings
        total_carbon_saved = calculate_carbon_savings(materials_collected)
        
        # Get equivalence metrics
        carbon_equivalence = get_carbon_equivalence(total_carbon_saved)
        
        # Calculate community impact
        total_pickups = len(completed_pickups)
        unique_users = len({pickup.user_id for pickup in completed_pickups})
        
        # Return compiled metrics
        return {
            "time_period": time_period,
            "total_recycled_kg": round(total_weight, 2),
            "materials_breakdown": {
                material: round(weight, 2) for material, weight in materials_collected.items()
            },
            "carbon_impact": {
                "kg_co2_saved": round(total_carbon_saved, 2),
                "equivalence": carbon_equivalence
            },
            "community_impact": {
                "total_pickups": total_pickups,
                "unique_participants": unique_users
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating environmental impact: {str(e)}"
        )


@router.get("/trend", 
    summary="Get environmental impact trends",
    description="Retrieves time series data showing environmental impact trends over a specified time period with configurable granularity",
    response_description="Time series data for the requested environmental metric",
    responses={
        200: {
            "description": "Successful response with trend data",
            "content": {
                "application/json": {
                    "example": {
                        "metric": "carbon_savings_kg",
                        "time_range": "month",
                        "granularity": "day",
                        "data": [
                            {"date": "2025-09-01", "value": 35.8},
                            {"date": "2025-09-02", "value": 42.3},
                            {"date": "2025-09-03", "value": 28.5},
                            {"date": "2025-09-04", "value": 51.2}
                        ],
                        "timestamp": "2025-09-29T14:30:45.123456"
                    }
                }
            }
        },
        400: {
            "description": "Bad request - Invalid parameters"
        },
        401: {
            "description": "Unauthorized - Authentication required"
        },
        500: {
            "description": "Internal server error"
        }
    }
)
@cached_endpoint(
    namespace="analytics_env_trend",
    ttl=3600,  # Cache for 1 hour
    cache_control="public, max-age=3600"
)
async def get_environmental_impact_trend(
    metric: str = Query("recycled", description="Metric to analyze: recycled, carbon, users"),
    time_range: str = Query("month", description="Time range: week, month, year"),
    granularity: str = Query("day", description="Data granularity: day, week, month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get environmental impact trend data over time
    
    - **metric**: Which metric to analyze (recycled, carbon, users)
    - **time_range**: Overall time range (week, month, year)
    - **granularity**: Data point granularity (day, week, month)
    """
    try:
        # Calculate the start date based on the time range
        end_date = datetime.utcnow()
        if time_range == "week":
            start_date = end_date - timedelta(weeks=1)
            format_str = "%Y-%m-%d"  # Daily format
        elif time_range == "month":
            start_date = end_date - timedelta(days=30)
            if granularity == "day":
                format_str = "%Y-%m-%d"  # Daily format
            else:
                format_str = "%Y-%U"  # Weekly format
        elif time_range == "year":
            start_date = end_date - timedelta(days=365)
            if granularity == "day":
                format_str = "%Y-%m-%d"  # Daily format
            elif granularity == "week":
                format_str = "%Y-%U"  # Weekly format
            else:
                format_str = "%Y-%m"  # Monthly format
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid time_range: {time_range}"
            )
            
        # Build the appropriate query based on the metric and granularity
        if metric == "recycled":
            # Group by the appropriate time period
            if granularity == "day":
                result = db.query(
                    func.date_trunc('day', PickupRequest.completed_at).label('date'),
                    func.sum(PickupRequest.weight_actual).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date),
                    PickupRequest.weight_actual.isnot(None)
                ).group_by(
                    func.date_trunc('day', PickupRequest.completed_at)
                ).order_by('date').all()
            elif granularity == "week":
                result = db.query(
                    func.date_trunc('week', PickupRequest.completed_at).label('date'),
                    func.sum(PickupRequest.weight_actual).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date),
                    PickupRequest.weight_actual.isnot(None)
                ).group_by(
                    func.date_trunc('week', PickupRequest.completed_at)
                ).order_by('date').all()
            else:  # month
                result = db.query(
                    func.date_trunc('month', PickupRequest.completed_at).label('date'),
                    func.sum(PickupRequest.weight_actual).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date),
                    PickupRequest.weight_actual.isnot(None)
                ).group_by(
                    func.date_trunc('month', PickupRequest.completed_at)
                ).order_by('date').all()
                
            # Process the results
            data_points = [
                {
                    "date": row.date.strftime(format_str),
                    "value": float(row.value) if row.value is not None else 0.0
                } for row in result
            ]
            
            return {
                "metric": "recycled_kg",
                "time_range": time_range,
                "granularity": granularity,
                "data": data_points,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        elif metric == "carbon":
            # For carbon, we need to fetch pickups and calculate carbon savings
            # This is more complex and would require significant database work
            # For now, we'll use a simplified approach using the recycled weight as a proxy
            if granularity == "day":
                result = db.query(
                    func.date_trunc('day', PickupRequest.completed_at).label('date'),
                    func.sum(PickupRequest.weight_actual).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date),
                    PickupRequest.weight_actual.isnot(None)
                ).group_by(
                    func.date_trunc('day', PickupRequest.completed_at)
                ).order_by('date').all()
            elif granularity == "week":
                result = db.query(
                    func.date_trunc('week', PickupRequest.completed_at).label('date'),
                    func.sum(PickupRequest.weight_actual).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date),
                    PickupRequest.weight_actual.isnot(None)
                ).group_by(
                    func.date_trunc('week', PickupRequest.completed_at)
                ).order_by('date').all()
            else:  # month
                result = db.query(
                    func.date_trunc('month', PickupRequest.completed_at).label('date'),
                    func.sum(PickupRequest.weight_actual).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date),
                    PickupRequest.weight_actual.isnot(None)
                ).group_by(
                    func.date_trunc('month', PickupRequest.completed_at)
                ).order_by('date').all()
            
            # Process the results with carbon calculations
            # We use a simplistic conversion factor here
            # In a real system, you'd want to use the actual materials breakdown
            data_points = [
                {
                    "date": row.date.strftime(format_str),
                    "value": float(row.value * 2.5) if row.value is not None else 0.0  # Simple conversion factor
                } for row in result
            ]
            
            return {
                "metric": "carbon_savings_kg",
                "time_range": time_range,
                "granularity": granularity,
                "data": data_points,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        elif metric == "users":
            # Count unique users with completed pickups
            if granularity == "day":
                result = db.query(
                    func.date_trunc('day', PickupRequest.completed_at).label('date'),
                    func.count(func.distinct(PickupRequest.user_id)).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date)
                ).group_by(
                    func.date_trunc('day', PickupRequest.completed_at)
                ).order_by('date').all()
            elif granularity == "week":
                result = db.query(
                    func.date_trunc('week', PickupRequest.completed_at).label('date'),
                    func.count(func.distinct(PickupRequest.user_id)).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date)
                ).group_by(
                    func.date_trunc('week', PickupRequest.completed_at)
                ).order_by('date').all()
            else:  # month
                result = db.query(
                    func.date_trunc('month', PickupRequest.completed_at).label('date'),
                    func.count(func.distinct(PickupRequest.user_id)).label('value')
                ).filter(
                    PickupRequest.status == "completed",
                    PickupRequest.completed_at.between(start_date, end_date)
                ).group_by(
                    func.date_trunc('month', PickupRequest.completed_at)
                ).order_by('date').all()
            
            # Process the results
            data_points = [
                {
                    "date": row.date.strftime(format_str),
                    "value": int(row.value) if row.value is not None else 0
                } for row in result
            ]
            
            return {
                "metric": "active_users",
                "time_range": time_range,
                "granularity": granularity,
                "data": data_points,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid metric: {metric}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating trend data: {str(e)}"
        )


@router.get("/materials", 
    summary="Get materials breakdown",
    description="Retrieves detailed breakdown of recycled materials and their environmental impact metrics",
    response_description="Materials breakdown with weight, percentage, and environmental impact data",
    responses={
        200: {
            "description": "Successful response with materials breakdown",
            "content": {
                "application/json": {
                    "example": {
                        "time_period": "month",
                        "total_weight_kg": 528.75,
                        "materials": [
                            {
                                "name": "paper",
                                "display_name": "Paper",
                                "weight_kg": 215.4,
                                "percentage": 40.7,
                                "carbon_saved_kg": 387.72,
                                "water_saved_liters": 6677.4,
                                "energy_saved_kwh": 1012.38,
                                "icon": "paper_icon"
                            },
                            {
                                "name": "plastic",
                                "display_name": "Plastic",
                                "weight_kg": 146.8,
                                "percentage": 27.8,
                                "carbon_saved_kg": 455.08,
                                "water_saved_liters": 26864.4,
                                "energy_saved_kwh": 924.84,
                                "icon": "plastic_icon"
                            }
                        ],
                        "timestamp": "2025-09-29T14:30:45.123456"
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - Authentication required"
        },
        500: {
            "description": "Internal server error"
        }
    }
)
@cached_endpoint(
    namespace="analytics_env_materials",
    ttl=3600,  # Cache for 1 hour
    cache_control="public, max-age=3600"
)
async def get_materials_breakdown(
    time_period: str = Query("month", description="Time period: day, week, month, year, all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get breakdown of recycled materials and their environmental impact
    
    - **time_period**: Time period for metrics (day, week, month, year, all)
    """
    try:
        # Calculate the start date based on the time period
        end_date = datetime.utcnow()
        if time_period == "day":
            start_date = end_date - timedelta(days=1)
        elif time_period == "week":
            start_date = end_date - timedelta(weeks=1)
        elif time_period == "month":
            start_date = end_date - timedelta(days=30)
        elif time_period == "year":
            start_date = end_date - timedelta(days=365)
        else:  # "all"
            start_date = datetime(2000, 1, 1)  # Effectively all time
        
        # Query completed pickups in the given time period
        completed_pickups = db.query(PickupRequest).filter(
            PickupRequest.status == "completed",
            PickupRequest.completed_at.between(start_date, end_date),
            PickupRequest.weight_actual.isnot(None)
        ).all()
        
        # Calculate material breakdown
        materials_data = {}
        
        for pickup in completed_pickups:
            if pickup.materials and isinstance(pickup.materials, list) and pickup.weight_actual:
                # Distribute weight proportionally
                materials_count = len(pickup.materials)
                if materials_count > 0:
                    weight_per_material = pickup.weight_actual / materials_count
                    
                    for material in pickup.materials:
                        if material not in materials_data:
                            materials_data[material] = {
                                "weight_kg": 0,
                                "percentage": 0,
                                "carbon_saved_kg": 0,
                                "water_saved_liters": 0,
                                "energy_saved_kwh": 0
                            }
                        
                        materials_data[material]["weight_kg"] += weight_per_material
        
        # Calculate total weight
        total_weight = sum(data["weight_kg"] for data in materials_data.values())
        
        # Calculate percentages and environmental impact
        if total_weight > 0:
            for material, data in materials_data.items():
                # Calculate percentage
                data["percentage"] = (data["weight_kg"] / total_weight) * 100
                
                # Calculate environmental impact using factors from materials_data.py
                impact_factors = MATERIAL_IMPACT_DATA.get(material, {
                    "carbon_factor": 1.0,  # Default CO2 savings factor (kg CO2 per kg material)
                    "water_factor": 20.0,  # Default water savings (liters per kg material)
                    "energy_factor": 5.0    # Default energy savings (kWh per kg material)
                })
                
                data["carbon_saved_kg"] = data["weight_kg"] * impact_factors.get("carbon_factor", 1.0)
                data["water_saved_liters"] = data["weight_kg"] * impact_factors.get("water_factor", 20.0)
                data["energy_saved_kwh"] = data["weight_kg"] * impact_factors.get("energy_factor", 5.0)
        
        # Format the results for output
        formatted_materials = []
        for material, data in materials_data.items():
            formatted_materials.append({
                "name": material,
                "weight_kg": round(data["weight_kg"], 2),
                "percentage": round(data["percentage"], 2),
                "carbon_saved_kg": round(data["carbon_saved_kg"], 2),
                "water_saved_liters": round(data["water_saved_liters"], 2),
                "energy_saved_kwh": round(data["energy_saved_kwh"], 2)
            })
            
        # Sort by weight, descending
        formatted_materials.sort(key=lambda x: x["weight_kg"], reverse=True)
        
        return {
            "time_period": time_period,
            "total_weight_kg": round(total_weight, 2),
            "materials": formatted_materials,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating materials breakdown: {str(e)}"
        )


@router.get("/leaderboard", 
    summary="Get community leaderboard",
    description="Retrieves a ranked leaderboard of users based on their environmental impact metrics",
    response_description="Ranked list of users with their environmental contribution metrics",
    responses={
        200: {
            "description": "Successful response with leaderboard data",
            "content": {
                "application/json": {
                    "example": {
                        "time_period": "month",
                        "metric": "carbon_savings_kg",
                        "leaderboard": [
                            {
                                "position": 1,
                                "user_id": 42,
                                "user_name": "GreenChampion",
                                "value": 124.5
                            },
                            {
                                "position": 2,
                                "user_id": 17,
                                "user_name": "EcoWarrior",
                                "value": 98.3
                            },
                            {
                                "position": 3,
                                "user_id": 85,
                                "user_name": "RecycleHero",
                                "value": 87.2
                            }
                        ],
                        "timestamp": "2025-09-29T14:30:45.123456"
                    }
                }
            }
        },
        400: {
            "description": "Bad request - Invalid parameters"
        },
        401: {
            "description": "Unauthorized - Authentication required"
        },
        500: {
            "description": "Internal server error"
        }
    }
)
@cached_endpoint(
    namespace="analytics_env_leaderboard",
    ttl=1800,  # Cache for 30 minutes
    cache_control="public, max-age=1800"
)
async def get_community_leaderboard(
    time_period: str = Query("month", description="Time period: week, month, year, all"),
    metric: str = Query("weight", description="Metric for ranking: weight, pickups, carbon"),
    limit: int = Query(10, description="Number of entries to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get community leaderboard based on recycling impact
    
    - **time_period**: Time period for metrics (week, month, year, all)
    - **metric**: Metric to rank by (weight, pickups, carbon)
    - **limit**: Number of entries to return
    """
    try:
        # Calculate the start date based on the time period
        end_date = datetime.utcnow()
        if time_period == "week":
            start_date = end_date - timedelta(weeks=1)
        elif time_period == "month":
            start_date = end_date - timedelta(days=30)
        elif time_period == "year":
            start_date = end_date - timedelta(days=365)
        else:  # "all"
            start_date = datetime(2000, 1, 1)  # Effectively all time
        
        # Build the appropriate query based on the metric
        if metric == "weight":
            leaderboard_data = db.query(
                User.id.label('user_id'),
                User.name.label('user_name'),
                func.sum(PickupRequest.weight_actual).label('value')
            ).join(
                PickupRequest, User.id == PickupRequest.user_id
            ).filter(
                PickupRequest.status == "completed",
                PickupRequest.completed_at.between(start_date, end_date),
                PickupRequest.weight_actual.isnot(None)
            ).group_by(
                User.id, User.name
            ).order_by(
                desc('value')
            ).limit(limit).all()
            
            return {
                "time_period": time_period,
                "metric": "recycled_kg",
                "leaderboard": [
                    {
                        "position": i + 1,
                        "user_id": entry.user_id,
                        "user_name": entry.user_name,
                        "value": round(float(entry.value), 2) if entry.value else 0.0
                    } for i, entry in enumerate(leaderboard_data)
                ],
                "timestamp": datetime.utcnow().isoformat()
            }
        
        elif metric == "pickups":
            leaderboard_data = db.query(
                User.id.label('user_id'),
                User.name.label('user_name'),
                func.count(PickupRequest.id).label('value')
            ).join(
                PickupRequest, User.id == PickupRequest.user_id
            ).filter(
                PickupRequest.status == "completed",
                PickupRequest.completed_at.between(start_date, end_date)
            ).group_by(
                User.id, User.name
            ).order_by(
                desc('value')
            ).limit(limit).all()
            
            return {
                "time_period": time_period,
                "metric": "completed_pickups",
                "leaderboard": [
                    {
                        "position": i + 1,
                        "user_id": entry.user_id,
                        "user_name": entry.user_name,
                        "value": int(entry.value) if entry.value else 0
                    } for i, entry in enumerate(leaderboard_data)
                ],
                "timestamp": datetime.utcnow().isoformat()
            }
        
        elif metric == "carbon":
            # For carbon, we'll use weight as a proxy with a simple conversion factor
            # In a real system, you'd want more sophisticated calculations
            leaderboard_data = db.query(
                User.id.label('user_id'),
                User.name.label('user_name'),
                func.sum(PickupRequest.weight_actual).label('value')
            ).join(
                PickupRequest, User.id == PickupRequest.user_id
            ).filter(
                PickupRequest.status == "completed",
                PickupRequest.completed_at.between(start_date, end_date),
                PickupRequest.weight_actual.isnot(None)
            ).group_by(
                User.id, User.name
            ).order_by(
                desc('value')
            ).limit(limit).all()
            
            return {
                "time_period": time_period,
                "metric": "carbon_savings_kg",
                "leaderboard": [
                    {
                        "position": i + 1,
                        "user_id": entry.user_id,
                        "user_name": entry.user_name,
                        "value": round(float(entry.value) * 2.5, 2) if entry.value else 0.0  # Simple conversion factor
                    } for i, entry in enumerate(leaderboard_data)
                ],
                "timestamp": datetime.utcnow().isoformat()
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid metric: {metric}"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating leaderboard: {str(e)}"
        )