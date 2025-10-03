"""
Environmental impact service for calculating and managing environmental impact data

This service provides a centralized way to calculate various environmental impact metrics
related to recycling activities. It processes pickup request data to generate comprehensive
environmental impact statistics including:

- Carbon footprint savings
- Water conservation
- Energy savings
- Material breakdown analytics
- Historical trends
- Community impact
- User rankings

The service supports both individual user metrics and community-wide aggregations,
with options for different time periods and historical comparisons.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.pickup_request import PickupRequest
from app.models.user import User
from app.utils.carbon_calculator import calculate_carbon_savings, get_carbon_equivalence
from app.utils.water_calculator import calculate_water_savings, get_water_equivalence
from app.utils.energy_calculator import calculate_energy_savings, get_energy_equivalence
from app.utils.materials_data import MATERIAL_IMPACT_DATA


class EnvironmentalImpactService:
    """
    Service for calculating and managing environmental impact metrics
    
    This service provides methods to calculate various environmental impact metrics from
    recycling activities recorded in pickup requests. It supports both individual user
    metrics and community-wide aggregations, with options for filtering by time period.
    
    The service calculates carbon savings, water conservation, energy savings, and
    provides practical equivalences to make these metrics more relatable to users.
    It also supports historical data tracking and comparisons over time.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the environmental impact service
        
        Args:
            db: SQLAlchemy database session for querying pickup data
        """
        self.db = db
    
    def get_user_impact(self, user_id: int, start_date: Optional[datetime] = None, 
                        end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Calculate comprehensive environmental impact metrics for a specific user over a time period
        
        This method calculates a user's environmental impact based on their completed pickup
        requests within the specified time period. It aggregates material weights and 
        calculates carbon savings, water conservation, and energy savings metrics.
        
        Args:
            user_id: The user's ID
            start_date: Optional start date for the time period (inclusive)
            end_date: Optional end date for the time period (inclusive)
            
        Returns:
            Dictionary with detailed impact metrics including:
            - Period details (start/end dates)
            - Weight totals and pickup counts
            - Environmental impact (carbon, water, energy savings)
            - Real-world equivalences for each impact metric
            - Detailed breakdown of materials recycled
            
        Example response:
            {
                "user_id": 123,
                "period": {
                    "start_date": "2025-08-01T00:00:00Z",
                    "end_date": "2025-08-31T23:59:59Z"
                },
                "totals": {
                    "weight_kg": 45.7,
                    "pickups_completed": 3,
                    "materials_count": 4
                },
                "impact": {
                    "carbon_savings_kg": 86.83,
                    "water_savings_liters": 2742.0,
                    "energy_savings_kwh": 251.35
                },
                "equivalences": {
                    "carbon": {
                        "car_kilometers": 723.6,
                        "trees_monthly_absorption": 115.8,
                        "meat_meals": 34.7
                    },
                    "water": {...},
                    "energy": {...}
                },
                "material_breakdown": [
                    {
                        "name": "paper",
                        "weight": 18.2,
                        "percentage": 39.8,
                        "carbon_saved": 32.76,
                        "water_saved": 564.2,
                        "energy_saved": 85.54,
                        "icon": "paper_icon"
                    },
                    ...
                ]
            }
        """
        # Get the user's completed pickups within the time period
        query = self.db.query(PickupRequest).filter(
            PickupRequest.user_id == user_id,
            PickupRequest.status == "completed"
        )
        
        if start_date:
            query = query.filter(PickupRequest.completed_at >= start_date)
        
        if end_date:
            query = query.filter(PickupRequest.completed_at <= end_date)
            
        completed_pickups = query.all()
        
        # Aggregate materials from all pickups
        materials_collected = {}
        
        for pickup in completed_pickups:
            if pickup.materials:
                for material, weight in pickup.materials.items():
                    if material in materials_collected:
                        materials_collected[material] += float(weight)
                    else:
                        materials_collected[material] = float(weight)
        
        # Calculate impact
        carbon_savings = calculate_carbon_savings(materials_collected)
        water_savings = calculate_water_savings(materials_collected)
        energy_savings = calculate_energy_savings(materials_collected)
        
        # Get equivalences
        carbon_eq = get_carbon_equivalence(carbon_savings)
        water_eq = get_water_equivalence(water_savings)
        energy_eq = get_energy_equivalence(energy_savings)
        
        # Calculate totals
        total_weight = sum(materials_collected.values())
        total_pickups = len(completed_pickups)
        
        # Format material breakdown
        material_breakdown = []
        for material, weight in materials_collected.items():
            material_info = MATERIAL_IMPACT_DATA.get(material, {})
            material_breakdown.append({
                "name": material_info.get("name", material),
                "weight": weight,
                "percentage": (weight / total_weight * 100) if total_weight > 0 else 0,
                "carbon_saved": weight * material_info.get("carbon_factor", 1.0),
                "water_saved": weight * material_info.get("water_factor", 1.0),
                "energy_saved": weight * material_info.get("energy_factor", 1.0),
                "icon": material_info.get("icon", "default_icon")
            })
        
        # Sort material breakdown by weight descending
        material_breakdown.sort(key=lambda x: x["weight"], reverse=True)
        
        return {
            "user_id": user_id,
            "period": {
                "start_date": start_date,
                "end_date": end_date
            },
            "totals": {
                "weight_kg": total_weight,
                "pickups_completed": total_pickups,
                "materials_count": len(materials_collected)
            },
            "impact": {
                "carbon_savings_kg": carbon_savings,
                "water_savings_liters": water_savings,
                "energy_savings_kwh": energy_savings
            },
            "equivalences": {
                "carbon": carbon_eq,
                "water": water_eq,
                "energy": energy_eq
            },
            "material_breakdown": material_breakdown
        }
    
    def get_community_impact(self, start_date: Optional[datetime] = None,
                            end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Calculate environmental impact for the entire community over a time period
        
        Args:
            start_date: Optional start date for the time period
            end_date: Optional end date for the time period
            
        Returns:
            Dictionary with community impact metrics and equivalences
        """
        # Get all completed pickups within the time period
        query = self.db.query(PickupRequest).filter(
            PickupRequest.status == "completed"
        )
        
        if start_date:
            query = query.filter(PickupRequest.completed_at >= start_date)
        
        if end_date:
            query = query.filter(PickupRequest.completed_at <= end_date)
            
        completed_pickups = query.all()
        
        # Aggregate materials from all pickups
        materials_collected = {}
        
        for pickup in completed_pickups:
            if pickup.materials:
                for material, weight in pickup.materials.items():
                    if material in materials_collected:
                        materials_collected[material] += float(weight)
                    else:
                        materials_collected[material] = float(weight)
        
        # Calculate impact
        carbon_savings = calculate_carbon_savings(materials_collected)
        water_savings = calculate_water_savings(materials_collected)
        energy_savings = calculate_energy_savings(materials_collected)
        
        # Get equivalences
        carbon_eq = get_carbon_equivalence(carbon_savings)
        water_eq = get_water_equivalence(water_savings)
        energy_eq = get_energy_equivalence(energy_savings)
        
        # Calculate totals
        total_weight = sum(materials_collected.values())
        total_pickups = len(completed_pickups)
        unique_users = len(set([pickup.user_id for pickup in completed_pickups]))
        
        # Format material breakdown
        material_breakdown = []
        for material, weight in materials_collected.items():
            material_info = MATERIAL_IMPACT_DATA.get(material, {})
            material_breakdown.append({
                "name": material_info.get("name", material),
                "weight": weight,
                "percentage": (weight / total_weight * 100) if total_weight > 0 else 0,
                "carbon_saved": weight * material_info.get("carbon_factor", 1.0),
                "water_saved": weight * material_info.get("water_factor", 1.0),
                "energy_saved": weight * material_info.get("energy_factor", 1.0),
                "icon": material_info.get("icon", "default_icon")
            })
        
        # Sort material breakdown by weight descending
        material_breakdown.sort(key=lambda x: x["weight"], reverse=True)
        
        return {
            "period": {
                "start_date": start_date,
                "end_date": end_date
            },
            "totals": {
                "weight_kg": total_weight,
                "pickups_completed": total_pickups,
                "unique_contributors": unique_users,
                "materials_count": len(materials_collected)
            },
            "impact": {
                "carbon_savings_kg": carbon_savings,
                "water_savings_liters": water_savings,
                "energy_savings_kwh": energy_savings
            },
            "equivalences": {
                "carbon": carbon_eq,
                "water": water_eq,
                "energy": energy_eq
            },
            "material_breakdown": material_breakdown
        }
    
    def get_user_impact_history(self, user_id: int, periods: int = 12, 
                               period_type: str = "month") -> Dict[str, Any]:
        """
        Get historical impact data for a user over multiple time periods
        
        Args:
            user_id: The user's ID
            periods: Number of periods to retrieve (default 12)
            period_type: Type of period - "day", "week", "month" (default "month")
            
        Returns:
            Dictionary with historical impact data
        """
        now = datetime.now()
        history = []
        
        for i in range(periods):
            if period_type == "day":
                start_date = now - timedelta(days=i+1)
                end_date = now - timedelta(days=i)
                period_name = start_date.strftime("%Y-%m-%d")
            elif period_type == "week":
                start_date = now - timedelta(weeks=i+1)
                end_date = now - timedelta(weeks=i)
                period_name = f"Week {(now - start_date).days // 7 + 1}"
            else:  # month
                if now.month - i > 0:
                    start_month = now.month - i
                    start_year = now.year
                else:
                    start_month = 12 + (now.month - i)
                    start_year = now.year - ((i - now.month) // 12 + 1)
                    
                if now.month - i + 1 > 0:
                    end_month = now.month - i + 1
                    end_year = now.year
                else:
                    end_month = 12 + (now.month - i + 1)
                    end_year = now.year - ((i - 1 - now.month) // 12 + 1)
                
                start_date = datetime(start_year, start_month, 1)
                # End date is the first day of the next month
                if end_month == 12:
                    end_date = datetime(end_year + 1, 1, 1)
                else:
                    end_date = datetime(end_year, end_month + 1, 1)
                
                period_name = start_date.strftime("%b %Y")
            
            # Get impact data for this period
            impact = self.get_user_impact(user_id, start_date, end_date)
            
            # Simplified data for history
            history.append({
                "period_name": period_name,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "weight_kg": impact["totals"]["weight_kg"],
                "carbon_savings_kg": impact["impact"]["carbon_savings_kg"],
                "water_savings_liters": impact["impact"]["water_savings_liters"],
                "energy_savings_kwh": impact["impact"]["energy_savings_kwh"],
                "pickups_completed": impact["totals"]["pickups_completed"]
            })
        
        # Calculate growth percentages
        if len(history) >= 2:
            current = history[0]
            previous = history[1]
            
            if previous["weight_kg"] > 0:
                weight_growth = (current["weight_kg"] - previous["weight_kg"]) / previous["weight_kg"] * 100
            else:
                weight_growth = 100 if current["weight_kg"] > 0 else 0
                
            if previous["carbon_savings_kg"] > 0:
                carbon_growth = (current["carbon_savings_kg"] - previous["carbon_savings_kg"]) / previous["carbon_savings_kg"] * 100
            else:
                carbon_growth = 100 if current["carbon_savings_kg"] > 0 else 0
        else:
            weight_growth = 0
            carbon_growth = 0
            
        return {
            "user_id": user_id,
            "period_type": period_type,
            "current_stats": history[0] if history else {},
            "growth": {
                "weight_percent": weight_growth,
                "carbon_percent": carbon_growth
            },
            "history": history
        }
    
    def get_leaderboard(self, timeframe: str = "month", limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get leaderboard of users with the highest environmental impact
        
        Args:
            timeframe: "week", "month", "year", or "all" (default "month")
            limit: Number of users to include (default 10)
            
        Returns:
            List of users with their impact metrics
        """
        now = datetime.now()
        
        # Determine start date based on timeframe
        if timeframe == "week":
            start_date = now - timedelta(days=7)
        elif timeframe == "month":
            # Start from the 1st of the current month
            start_date = datetime(now.year, now.month, 1)
        elif timeframe == "year":
            # Start from January 1st of the current year
            start_date = datetime(now.year, 1, 1)
        else:  # "all"
            start_date = None
        
        # Get all completed pickups within the time period
        query = self.db.query(PickupRequest).filter(
            PickupRequest.status == "completed"
        )
        
        if start_date:
            query = query.filter(PickupRequest.completed_at >= start_date)
            
        completed_pickups = query.all()
        
        # Group pickups by user
        user_pickups = {}
        for pickup in completed_pickups:
            if pickup.user_id not in user_pickups:
                user_pickups[pickup.user_id] = []
            user_pickups[pickup.user_id].append(pickup)
        
        # Calculate impact for each user
        users_impact = []
        for user_id, pickups in user_pickups.items():
            # Get user info
            user = self.db.query(User).filter(User.id == user_id).first()
            
            if not user:
                continue
                
            # Aggregate materials for this user
            materials_collected = {}
            for pickup in pickups:
                if pickup.materials:
                    for material, weight in pickup.materials.items():
                        if material in materials_collected:
                            materials_collected[material] += float(weight)
                        else:
                            materials_collected[material] = float(weight)
            
            # Calculate impact
            carbon_savings = calculate_carbon_savings(materials_collected)
            total_weight = sum(materials_collected.values())
            
            users_impact.append({
                "user_id": user_id,
                "username": user.username,
                "full_name": f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.username,
                "avatar": user.avatar_url,
                "total_weight_kg": total_weight,
                "carbon_savings_kg": carbon_savings,
                "pickups_completed": len(pickups)
            })
        
        # Sort by carbon savings descending
        users_impact.sort(key=lambda x: x["carbon_savings_kg"], reverse=True)
        
        # Add rank and take top N
        leaderboard = []
        for i, user in enumerate(users_impact[:limit]):
            user["rank"] = i + 1
            leaderboard.append(user)
            
        return leaderboard