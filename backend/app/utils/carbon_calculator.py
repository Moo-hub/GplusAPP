"""
Carbon savings calculation utilities

This module provides functions for calculating carbon footprint savings from recycled materials
and converting those savings into real-world equivalents that are more relatable to users.

Carbon savings are calculated using material-specific carbon factors, which represent the
amount of CO2 equivalent emissions avoided by recycling each kilogram of material instead
of producing it from virgin resources.
"""
from typing import Dict, Any, List
from .materials_data import MATERIAL_IMPACT_DATA


def calculate_carbon_savings(materials_collected: Dict[str, float]) -> float:
    """
    Calculate carbon savings based on recycled materials
    
    This function calculates the total carbon dioxide equivalent (CO2e) emissions
    avoided by recycling the given materials instead of producing them from
    virgin resources. Each material has a specific carbon factor representing
    the kg of CO2e saved per kg of material recycled.
    
    Args:
        materials_collected: Dictionary mapping material names (e.g., "paper", "plastic")
                           to weights in kg
        
    Returns:
        Carbon savings in kg CO2e
        
    Example:
        >>> calculate_carbon_savings({"paper": 10.0, "plastic": 5.0})
        33.5  # 10kg paper (1.8 kg CO2e/kg) + 5kg plastic (3.1 kg CO2e/kg)
    """
    total_carbon_saved = 0.0
    
    for material, weight in materials_collected.items():
        # Get the carbon factor from the materials data
        carbon_factor = MATERIAL_IMPACT_DATA.get(material, {}).get("carbon_factor", 1.0)
        carbon_saved = weight * carbon_factor
        total_carbon_saved += carbon_saved
    
    return total_carbon_saved


def get_carbon_equivalence(carbon_kg: float) -> Dict[str, Any]:
    """
    Convert carbon savings to everyday equivalents that are more relatable to users
    
    This function translates abstract carbon savings values (kg CO2e) into
    real-world equivalents that help users understand the environmental impact
    of their recycling activities in more concrete terms.
    
    Args:
        carbon_kg: Amount of carbon saved in kg CO2e
        
    Returns:
        Dictionary of equivalents with the following keys:
        - car_kilometers: Distance not driven in a car
        - flight_kilometers: Distance not flown in an airplane
        - trees_monthly_absorption: Number of trees absorbing CO2 for a month
        - smartphone_charges: Number of smartphone charges
        - meat_meals: Number of meat-based meals
        
    Example:
        >>> get_carbon_equivalence(100.0)
        {
            'car_kilometers': 833.3,
            'flight_kilometers': 1111.1,
            'trees_monthly_absorption': 133.3,
            'smartphone_charges': 2000,
            'meat_meals': 40.0
        }
    """
    # Conversion factors
    # These are simplified examples - actual values would be more precise
    conversion_factors = {
        "car_km": 0.12,           # 0.12 kg CO2 per km driven by average car
        "flight_km": 0.09,        # 0.09 kg CO2 per km in economy flight
        "trees_month": 0.75,      # 0.75 kg CO2 absorbed by one tree per month
        "smartphone_charges": 0.05,  # 0.05 kg CO2 per full smartphone charge
        "meals": 2.5             # 2.5 kg CO2 per average meat meal
    }
    
    return {
        "car_kilometers": round(carbon_kg / conversion_factors["car_km"], 1),
        "flight_kilometers": round(carbon_kg / conversion_factors["flight_km"], 1),
        "trees_monthly_absorption": round(carbon_kg / conversion_factors["trees_month"], 1),
        "smartphone_charges": round(carbon_kg / conversion_factors["smartphone_charges"], 0),
        "meat_meals": round(carbon_kg / conversion_factors["meals"], 1),
    }