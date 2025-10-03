"""
Material impact data for environmental calculations

This module provides reference data on the environmental impact of recycling
different materials. The data is used for calculating the carbon, water, and
energy savings achieved through recycling activities within the G+ App ecosystem.

For each material type, the module provides conversion factors that represent:
- Carbon savings (kg CO2e per kg of material recycled)
- Water savings (liters of water saved per kg of material recycled)
- Energy savings (kWh of energy saved per kg of material recycled)

These factors are derived from peer-reviewed research on lifecycle assessments
comparing virgin material production versus recycling processes. The values
represent the difference in resource consumption and emissions between these
two processes.

The data is stored in the MATERIAL_IMPACT_DATA dictionary, which is used by the
carbon_calculator, water_calculator, and energy_calculator modules to compute
environmental savings metrics.
"""

# Dictionary of materials and their environmental impact data
# carbon_factor represents kg CO2e saved per kg of material recycled
# water_factor represents liters of water saved per kg of material recycled
# energy_factor represents kWh of energy saved per kg of material recycled

MATERIAL_IMPACT_DATA = {
    "paper": {
        "carbon_factor": 1.8,  # kg CO2e per kg recycled
        "water_factor": 31.0,  # liters per kg recycled
        "energy_factor": 4.7,  # kWh per kg recycled
        "name": "Paper",
        "description": "Includes office paper, newspaper, magazines, and cardboard",
        "icon": "paper_icon"
    },
    "cardboard": {
        "carbon_factor": 2.2,
        "water_factor": 29.0,
        "energy_factor": 5.2,
        "name": "Cardboard",
        "description": "Corrugated cardboard and paperboard packaging",
        "icon": "cardboard_icon"
    },
    "plastic": {
        "carbon_factor": 3.1,
        "water_factor": 183.0,
        "energy_factor": 6.3,
        "name": "Plastic",
        "description": "All types of recyclable plastic",
        "icon": "plastic_icon"
    },
    "glass": {
        "carbon_factor": 0.3,
        "water_factor": 8.0,
        "energy_factor": 1.6,
        "name": "Glass",
        "description": "Glass bottles and containers",
        "icon": "glass_icon"
    },
    "metal": {
        "carbon_factor": 4.5,
        "water_factor": 119.0,
        "energy_factor": 14.7,
        "name": "Metal",
        "description": "Aluminum cans, steel cans, and other metal items",
        "icon": "metal_icon"
    },
    "aluminum": {
        "carbon_factor": 9.1,
        "water_factor": 203.0,
        "energy_factor": 45.2,
        "name": "Aluminum",
        "description": "Aluminum cans and foil",
        "icon": "aluminum_icon"
    },
    "electronics": {
        "carbon_factor": 11.8,
        "water_factor": 420.0,
        "energy_factor": 32.6,
        "name": "Electronics",
        "description": "Small electronic devices and components",
        "icon": "electronics_icon"
    },
    "textiles": {
        "carbon_factor": 3.4,
        "water_factor": 2600.0,
        "energy_factor": 9.2,
        "name": "Textiles",
        "description": "Clothing, fabrics, and other textile items",
        "icon": "textiles_icon"
    },
    "organic": {
        "carbon_factor": 0.6,
        "water_factor": 18.0,
        "energy_factor": 1.2,
        "name": "Organic",
        "description": "Food waste and other compostable materials",
        "icon": "organic_icon"
    }
}