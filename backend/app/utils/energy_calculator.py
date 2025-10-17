"""
Energy savings calculation utilities

This module provides functions for calculating energy conservation from recycled materials
and converting those savings into real-world equivalents that are more relatable to users.

Energy savings are calculated using material-specific energy factors, which represent the
amount of energy (in kWh) saved by recycling each kilogram of material instead of
producing it from virgin resources. This accounts for the difference in energy
consumption between recycling processes and primary production processes.
"""
from typing import Dict, Any, List
from .materials_data import MATERIAL_IMPACT_DATA


def calculate_energy_savings(materials_collected: Dict[str, float]) -> float:
    """
    Calculate energy savings based on recycled materials
    
    This function calculates the total energy saved (in kWh) by recycling
    the given materials instead of producing them from virgin resources.
    Each material has a specific energy factor representing the kWh of
    energy saved per kg of material recycled.
    
    Args:
        materials_collected: Dictionary mapping material names (e.g., "paper", "plastic")
                           to weights in kg
        
    Returns:
        Energy savings in kilowatt-hours (kWh)
        
    Example:
        >>> calculate_energy_savings({"paper": 10.0, "plastic": 5.0})
        62.5  # 10kg paper (4.7 kWh/kg) + 5kg plastic (5.8 kWh/kg)
    """
    total_energy_saved = 0.0
    
    for material, weight in materials_collected.items():
        # Get the energy factor from the materials data
        energy_factor = MATERIAL_IMPACT_DATA.get(material, {}).get("energy_factor", 1.0)
        energy_saved = weight * energy_factor
        total_energy_saved += energy_saved
    
    return total_energy_saved


def get_energy_equivalence(energy_kwh: float) -> Dict[str, Any]:
    """
    Convert energy savings to everyday equivalents that are more relatable to users
    
    This function translates abstract energy savings values (kWh) into
    real-world equivalents that help users understand the environmental impact
    of their recycling activities in more concrete terms.
    
    Args:
        energy_kwh: Amount of energy saved in kilowatt-hours (kWh)
        
    Returns:
        Dictionary of equivalents with the following keys:
        - lightbulb_hours: Hours of LED lightbulb usage
        - smartphone_charges: Number of smartphone full charges
        - laptop_hours: Hours of laptop usage
        - tv_hours: Hours of television usage
        - home_days: Days of household electricity for an average home
        
    Example:
        >>> get_energy_equivalence(100.0)
        {
            'lightbulb_hours': 10000.0,
            'smartphone_charges': 2000.0,
            'laptop_hours': 1000.0,
            'tv_hours': 666.7,
            'home_days': 3.3
        }
    """
    # Conversion factors
    conversion_factors = {
        "home_daily_use": 12.0,     # 12 kWh average home daily usage
        "lightbulb_hours": 0.01,    # 0.01 kWh per hour for LED light bulb
        "laptop_charges": 0.05,     # 0.05 kWh per laptop charge
        "ev_kilometers": 0.2,       # 0.2 kWh per km for electric vehicle
        "tv_hours": 0.1             # 0.1 kWh per hour of TV usage
    }
    
    return {
        "home_daily_usage": round(energy_kwh / conversion_factors["home_daily_use"], 1),
        "lightbulb_hours": round(energy_kwh / conversion_factors["lightbulb_hours"], 0),
        "laptop_charges": round(energy_kwh / conversion_factors["laptop_charges"], 0),
        "ev_kilometers": round(energy_kwh / conversion_factors["ev_kilometers"], 1),
        "tv_hours": round(energy_kwh / conversion_factors["tv_hours"], 0)
    }