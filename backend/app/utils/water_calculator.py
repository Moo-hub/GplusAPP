"""
Water savings calculation utilities

This module provides functions for calculating water conservation from recycled materials
and converting those savings into real-world equivalents that are more relatable to users.

Water savings are calculated using material-specific water factors, which represent the
amount of water (in liters) saved by recycling each kilogram of material instead
of producing it from virgin resources. This accounts for the difference in water
consumption between recycling processes and primary production processes.
"""
from typing import Dict, Any, List
from .materials_data import MATERIAL_IMPACT_DATA


def calculate_water_savings(materials_collected: Dict[str, float]) -> float:
    """
    Calculate water savings based on recycled materials
    
    This function calculates the total water saved (in liters) by recycling
    the given materials instead of producing them from virgin resources.
    Each material has a specific water factor representing the liters of
    water saved per kg of material recycled.
    
    Args:
        materials_collected: Dictionary mapping material names (e.g., "paper", "plastic")
                           to weights in kg
        
    Returns:
        Water savings in liters
        
    Example:
        >>> calculate_water_savings({"paper": 10.0, "plastic": 5.0})
        1130.0  # 10kg paper (31 liters/kg) + 5kg plastic (183 liters/kg)
    """
    total_water_saved = 0.0
    
    for material, weight in materials_collected.items():
        # Get the water factor from the materials data
        water_factor = MATERIAL_IMPACT_DATA.get(material, {}).get("water_factor", 1.0)
        water_saved = weight * water_factor
        total_water_saved += water_saved
    
    return total_water_saved


def get_water_equivalence(water_liters: float) -> Dict[str, Any]:
    """
    Convert water savings to everyday equivalents that are more relatable to users
    
    This function translates abstract water savings values (liters) into
    real-world equivalents that help users understand the environmental impact
    of their recycling activities in more concrete terms.
    
    Args:
        water_liters: Amount of water saved in liters
        
    Returns:
        Dictionary of equivalents with the following keys:
        - shower_minutes: Minutes of shower water usage
        - toilet_flushes: Number of toilet flushes
        - drinking_water_days: Days of drinking water for one person
        - dishwasher_loads: Number of dishwasher loads
        - laundry_loads: Number of laundry machine loads
        
    Example:
        >>> get_water_equivalence(1000.0)
        {
            'shower_minutes': 100.0,
            'toilet_flushes': 166.7,
            'drinking_water_days': 500.0,
            'dishwasher_loads': 25.0,
            'laundry_loads': 20.0
        }
    """
    # Conversion factors
    conversion_factors = {
        "shower_minutes": 10.0,    # 10 liters per minute of showering
        "toilet_flushes": 6.0,     # 6 liters per toilet flush
        "dishwasher_loads": 15.0,  # 15 liters per dishwasher load
        "drinking_water_days": 2.0, # 2 liters per day of drinking water
        "washing_machine": 45.0     # 45 liters per washing machine cycle
    }
    
    return {
        "shower_minutes": round(water_liters / conversion_factors["shower_minutes"], 1),
        "toilet_flushes": round(water_liters / conversion_factors["toilet_flushes"], 0),
        "dishwasher_loads": round(water_liters / conversion_factors["dishwasher_loads"], 1),
        "drinking_water_days": round(water_liters / conversion_factors["drinking_water_days"], 0),
        "washing_machine_loads": round(water_liters / conversion_factors["washing_machine"], 1)
    }