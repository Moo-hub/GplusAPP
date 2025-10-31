"""
Environmental impact response schemas for API documentation
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
try:
    from pydantic import ConfigDict  # Pydantic v2
except Exception:  # pragma: no cover - fallback for v1
    ConfigDict = None  # type: ignore


class MaterialBreakdown(BaseModel):
    """
    Detailed breakdown of a recycled material and its environmental impact
    """
    weight_kg: float = Field(..., description="Weight of the material in kilograms")
    percentage: float = Field(..., description="Percentage of total recycled materials")
    carbon_saved_kg: float = Field(..., description="CO2 equivalent saved in kilograms")
    water_saved_liters: float = Field(..., description="Water saved in liters")
    energy_saved_kwh: float = Field(..., description="Energy saved in kilowatt-hours")


class CarbonEquivalence(BaseModel):
    """
    Real-world equivalents to make carbon savings more relatable
    """
    car_miles: float = Field(..., description="Equivalent car miles not driven")
    smartphone_charges: int = Field(..., description="Equivalent number of smartphone charges")
    tree_days: float = Field(..., description="Equivalent days of carbon absorption by a tree")
    flights: float = Field(..., description="Equivalent short-haul flights avoided")


class WaterEquivalence(BaseModel):
    """
    Real-world equivalents to make water savings more relatable
    """
    showers: int = Field(..., description="Equivalent number of 8-minute showers")
    drinking_water_days: int = Field(..., description="Days of drinking water for one person")
    olympic_pools_percentage: float = Field(..., description="Percentage of an Olympic swimming pool")


class EnergyEquivalence(BaseModel):
    """
    Real-world equivalents to make energy savings more relatable
    """
    home_days: float = Field(..., description="Days of household electricity")
    lightbulb_hours: int = Field(..., description="Hours powering a 10W LED lightbulb")
    electric_car_miles: float = Field(..., description="Miles an electric car can travel")


class EnvironmentalImpactSummary(BaseModel):
    """
    Summary of environmental impact metrics from recycling activities
    """
    time_period: str = Field(..., description="Time period for the data (day, week, month, year, all)")
    total_recycled_kg: float = Field(..., description="Total weight of recycled materials in kilograms")
    materials_breakdown: Dict[str, float] = Field(..., description="Breakdown of recycled materials by weight")
    carbon_impact: Dict[str, Any] = Field(..., description="Carbon savings and real-world equivalents")
    community_impact: Dict[str, int] = Field(..., description="Community participation metrics")
    timestamp: str = Field(..., description="ISO format timestamp of when the data was generated")
    
    if ConfigDict is not None:
        model_config = ConfigDict(json_schema_extra={
            "example": {
                "time_period": "month",
                "total_recycled_kg": 124.5,
                "materials_breakdown": {
                    "paper": 45.2,
                    "plastic": 32.8,
                    "glass": 28.3,
                    "metal": 18.2
                },
                "carbon_impact": {
                    "kg_co2_saved": 253.7,
                    "equivalence": {
                        "car_miles": 642.8,
                        "smartphone_charges": 31625,
                        "tree_days": 2537,
                        "flights": 0.42
                    }
                },
                "community_impact": {
                    "total_pickups": 58,
                    "unique_participants": 32
                },
                "timestamp": "2023-06-15T14:22:31.456Z"
            }
        })
    else:  # pragma: no cover - v1 fallback
        class Config:
            schema_extra = {
                "example": {
                    "time_period": "month",
                    "total_recycled_kg": 124.5,
                    "materials_breakdown": {
                        "paper": 45.2,
                        "plastic": 32.8,
                        "glass": 28.3,
                        "metal": 18.2
                    },
                    "carbon_impact": {
                        "kg_co2_saved": 253.7,
                        "equivalence": {
                            "car_miles": 642.8,
                            "smartphone_charges": 31625,
                            "tree_days": 2537,
                            "flights": 0.42
                        }
                    },
                    "community_impact": {
                        "total_pickups": 58,
                        "unique_participants": 32
                    },
                    "timestamp": "2023-06-15T14:22:31.456Z"
                }
            }


class TrendDataPoint(BaseModel):
    """
    Single data point for trend analysis
    """
    date: str = Field(..., description="Date or time period in the specified format")
    value: float = Field(..., description="Value for the specified metric")


class EnvironmentalImpactTrend(BaseModel):
    """
    Time-series trend data for environmental impact metrics
    """
    metric: str = Field(..., description="The metric being tracked (recycled_kg, carbon_savings_kg, active_users)")
    time_range: str = Field(..., description="Overall time range (week, month, year)")
    granularity: str = Field(..., description="Data granularity (day, week, month)")
    data: List[TrendDataPoint] = Field(..., description="Array of data points")
    timestamp: str = Field(..., description="ISO format timestamp of when the data was generated")
    
    if ConfigDict is not None:
        model_config = ConfigDict(json_schema_extra={
            "example": {
                "metric": "recycled_kg",
                "time_range": "month",
                "granularity": "day",
                "data": [
                    {"date": "2023-05-15", "value": 4.2},
                    {"date": "2023-05-16", "value": 3.8},
                    {"date": "2023-05-17", "value": 5.6},
                    # More data points would follow
                ],
                "timestamp": "2023-06-15T14:22:31.456Z"
            }
        })
    else:  # pragma: no cover - v1 fallback
        class Config:
            schema_extra = {
                "example": {
                    "metric": "recycled_kg",
                    "time_range": "month",
                    "granularity": "day",
                    "data": [
                        {"date": "2023-05-15", "value": 4.2},
                        {"date": "2023-05-16", "value": 3.8},
                        {"date": "2023-05-17", "value": 5.6},
                        # More data points would follow
                    ],
                    "timestamp": "2023-06-15T14:22:31.456Z"
                }
            }


class MaterialsDetailedBreakdown(BaseModel):
    """
    Detailed environmental impact breakdown by material
    """
    time_period: str = Field(..., description="Time period for the data (day, week, month, year, all)")
    total_weight_kg: float = Field(..., description="Total weight of all materials in kilograms")
    materials: Dict[str, MaterialBreakdown] = Field(..., description="Detailed impact data for each material")
    total_impact: Dict[str, float] = Field(..., description="Aggregate environmental impact totals")
    equivalence: Dict[str, Any] = Field(..., description="Real-world equivalents for the environmental impact")
    timestamp: str = Field(..., description="ISO format timestamp of when the data was generated")
    
    if ConfigDict is not None:
        model_config = ConfigDict(json_schema_extra={
            "example": {
                "time_period": "month",
                "total_weight_kg": 124.5,
                "materials": {
                    "paper": {
                        "weight_kg": 45.2,
                        "percentage": 36.3,
                        "carbon_saved_kg": 81.36,
                        "water_saved_liters": 1582.0,
                        "energy_saved_kwh": 189.84
                    },
                    "plastic": {
                        "weight_kg": 32.8,
                        "percentage": 26.3,
                        "carbon_saved_kg": 82.0,
                        "water_saved_liters": 5576.0,
                        "energy_saved_kwh": 255.84
                    }
                    # Other materials would follow
                },
                "total_impact": {
                    "carbon_saved_kg": 253.7,
                    "water_saved_liters": 9870.5,
                    "energy_saved_kwh": 621.3
                },
                "equivalence": {
                    "carbon": {
                        "car_miles": 642.8,
                        "smartphone_charges": 31625,
                        "tree_days": 2537,
                        "flights": 0.42
                    },
                    "water": {
                        "showers": 165,
                        "drinking_water_days": 4935,
                        "olympic_pools_percentage": 0.39
                    },
                    "energy": {
                        "home_days": 20.7,
                        "lightbulb_hours": 62130,
                        "electric_car_miles": 2485
                    }
                },
                "timestamp": "2023-06-15T14:22:31.456Z"
            }
        })
    else:  # pragma: no cover - v1 fallback
        class Config:
            schema_extra = {
                "example": {
                    "time_period": "month",
                    "total_weight_kg": 124.5,
                    "materials": {
                        "paper": {
                            "weight_kg": 45.2,
                            "percentage": 36.3,
                            "carbon_saved_kg": 81.36,
                            "water_saved_liters": 1582.0,
                            "energy_saved_kwh": 189.84
                        },
                        "plastic": {
                            "weight_kg": 32.8,
                            "percentage": 26.3,
                            "carbon_saved_kg": 82.0,
                            "water_saved_liters": 5576.0,
                            "energy_saved_kwh": 255.84
                        }
                        # Other materials would follow
                    },
                    "total_impact": {
                        "carbon_saved_kg": 253.7,
                        "water_saved_liters": 9870.5,
                        "energy_saved_kwh": 621.3
                    },
                    "equivalence": {
                        "carbon": {
                            "car_miles": 642.8,
                            "smartphone_charges": 31625,
                            "tree_days": 2537,
                            "flights": 0.42
                        },
                        "water": {
                            "showers": 165,
                            "drinking_water_days": 4935,
                            "olympic_pools_percentage": 0.39
                        },
                        "energy": {
                            "home_days": 20.7,
                            "lightbulb_hours": 62130,
                            "electric_car_miles": 2485
                        }
                    },
                    "timestamp": "2023-06-15T14:22:31.456Z"
                }
            }


class LeaderboardEntry(BaseModel):
    """
    Single entry in the community leaderboard
    """
    position: int = Field(..., description="Ranking position")
    user_id: int = Field(..., description="User ID")
    user_name: str = Field(..., description="Display name of the user")
    value: float = Field(..., description="Value for the specified metric (weight, pickups, carbon)")


class CommunityLeaderboard(BaseModel):
    """
    Leaderboard of top contributors to recycling efforts
    """
    time_period: str = Field(..., description="Time period for the data (week, month, year, all)")
    metric: str = Field(..., description="Metric used for ranking (recycled_weight, completed_pickups, carbon_savings_kg)")
    leaderboard: List[LeaderboardEntry] = Field(..., description="Array of leaderboard entries")
    timestamp: str = Field(..., description="ISO format timestamp of when the data was generated")
    
    if ConfigDict is not None:
        model_config = ConfigDict(json_schema_extra={
            "example": {
                "time_period": "month",
                "metric": "recycled_weight",
                "leaderboard": [
                    {
                        "position": 1,
                        "user_id": 42,
                        "user_name": "EcoChampion",
                        "value": 124.5
                    },
                    {
                        "position": 2,
                        "user_id": 18,
                        "user_name": "RecyclingHero",
                        "value": 112.3
                    },
                    {
                        "position": 3,
                        "user_id": 37,
                        "user_name": "GreenWarrior",
                        "value": 98.7
                    }
                    # More entries would follow
                ],
                "timestamp": "2023-06-15T14:22:31.456Z"
            }
        })
    else:  # pragma: no cover - v1 fallback
        class Config:
            schema_extra = {
                "example": {
                    "time_period": "month",
                    "metric": "recycled_weight",
                    "leaderboard": [
                        {
                            "position": 1,
                            "user_id": 42,
                            "user_name": "EcoChampion",
                            "value": 124.5
                        },
                        {
                            "position": 2,
                            "user_id": 18,
                            "user_name": "RecyclingHero",
                            "value": 112.3
                        },
                        {
                            "position": 3,
                            "user_id": 37,
                            "user_name": "GreenWarrior",
                            "value": 98.7
                        }
                        # More entries would follow
                    ],
                    "timestamp": "2023-06-15T14:22:31.456Z"
                }
            }


class UserImpactSummary(BaseModel):
    """
    Summary of a single user's environmental impact
    """
    user_id: int = Field(..., description="User ID")
    time_period: str = Field(..., description="Time period for the data (week, month, year, all)")
    total_recycled_kg: float = Field(..., description="Total weight of recycled materials in kilograms")
    total_pickups: int = Field(..., description="Number of completed pickups")
    environmental_impact: Dict[str, float] = Field(..., description="Environmental impact metrics")
    lifetime_totals: Dict[str, float] = Field(..., description="Lifetime environmental impact totals")
    percentile: float = Field(..., description="User's percentile within the community")
    timestamp: str = Field(..., description="ISO format timestamp of when the data was generated")
    
    if ConfigDict is not None:
        model_config = ConfigDict(json_schema_extra={
            "example": {
                "user_id": 42,
                "time_period": "month",
                "total_recycled_kg": 32.8,
                "total_pickups": 4,
                "environmental_impact": {
                    "carbon_saved_kg": 75.4,
                    "water_saved_liters": 2850.6,
                    "energy_saved_kwh": 183.7
                },
                "lifetime_totals": {
                    "recycled_kg": 378.2,
                    "carbon_saved_kg": 871.3,
                    "water_saved_liters": 32940.5,
                    "energy_saved_kwh": 2124.8
                },
                "percentile": 92.5,
                "timestamp": "2023-06-15T14:22:31.456Z"
            }
        })
    else:  # pragma: no cover - v1 fallback
        class Config:
            schema_extra = {
                "example": {
                    "user_id": 42,
                    "time_period": "month",
                    "total_recycled_kg": 32.8,
                    "total_pickups": 4,
                    "environmental_impact": {
                        "carbon_saved_kg": 75.4,
                        "water_saved_liters": 2850.6,
                        "energy_saved_kwh": 183.7
                    },
                    "lifetime_totals": {
                        "recycled_kg": 378.2,
                        "carbon_saved_kg": 871.3,
                        "water_saved_liters": 32940.5,
                        "energy_saved_kwh": 2124.8
                    },
                    "percentile": 92.5,
                    "timestamp": "2023-06-15T14:22:31.456Z"
                }
            }