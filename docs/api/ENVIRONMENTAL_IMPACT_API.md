# Environmental Impact API Documentation

## Overview

The Environmental Impact API provides comprehensive analytics on the environmental benefits achieved through recycling activities within the G+ App ecosystem. These endpoints enable users to track, visualize, and understand the positive environmental impact of their recycling efforts.

## Base URL

```
https://api.gplusapp.com/api/v1/environmental-impact
```

## Authentication

All endpoints require authentication via JWT bearer token.

```
Authorization: Bearer <your_access_token>
```

## Common Response Codes

- `200 OK` - Request successful
- `401 Unauthorized` - Authentication required or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server-side error

## Endpoints

### API Documentation

```
GET /
```

Returns an overview of the Environmental Impact API endpoints.

#### Response Example

```json
{
  "message": "Welcome to the Environmental Impact API",
  "documentation": "See the API description for details about available endpoints",
  "version": "1.0"
}
```

### Environmental Impact Summary

```
GET /summary
```

Retrieves aggregated environmental impact metrics including total recycled weight, carbon savings, and community participation.

#### Query Parameters

| Parameter    | Type   | Description                                      | Required | Default |
|--------------|--------|--------------------------------------------------|----------|---------|
| time_period  | string | Time period: day, week, month, year, all         | No       | month   |

#### Response Example

```json
{
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
```

### Environmental Impact Trend

```
GET /trend
```

Retrieves time-series data for environmental impact metrics to analyze trends over time.

#### Query Parameters

| Parameter    | Type   | Description                                     | Required | Default |
|--------------|--------|-------------------------------------------------|----------|---------|
| metric       | string | Metric to analyze: recycled, carbon, water, energy, users | No | recycled |
| time_range   | string | Time range: week, month, year                   | No       | month   |
| granularity  | string | Data granularity: day, week, month              | No       | day     |

#### Response Example

```json
{
  "metric": "recycled_kg",
  "time_range": "month",
  "granularity": "day",
  "data": [
    {"date": "2023-05-15", "value": 4.2},
    {"date": "2023-05-16", "value": 3.8},
    {"date": "2023-05-17", "value": 5.6},
    {"date": "2023-05-18", "value": 4.9},
    {"date": "2023-05-19", "value": 6.3},
    {"date": "2023-05-20", "value": 7.1},
    {"date": "2023-05-21", "value": 3.2}
  ],
  "timestamp": "2023-06-15T14:22:31.456Z"
}
```

### Materials Breakdown

```
GET /materials
```

Provides a detailed breakdown of recycled materials and their specific environmental impact.

#### Query Parameters

| Parameter    | Type   | Description                                      | Required | Default |
|--------------|--------|--------------------------------------------------|----------|---------|
| time_period  | string | Time period: day, week, month, year, all         | No       | month   |

#### Response Example

```json
{
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
    },
    "glass": {
      "weight_kg": 28.3,
      "percentage": 22.7,
      "carbon_saved_kg": 16.98,
      "water_saved_liters": 424.5,
      "energy_saved_kwh": 65.09
    },
    "metal": {
      "weight_kg": 18.2,
      "percentage": 14.6,
      "carbon_saved_kg": 78.26,
      "water_saved_liters": 273.0,
      "energy_saved_kwh": 91.0
    }
  },
  "total_impact": {
    "carbon_saved_kg": 258.6,
    "water_saved_liters": 7855.5,
    "energy_saved_kwh": 601.77
  },
  "equivalence": {
    "carbon": {
      "car_miles": 655.3,
      "smartphone_charges": 32325,
      "tree_days": 2586,
      "flights": 0.43
    },
    "water": {
      "showers": 131,
      "drinking_water_days": 3928,
      "olympic_pools_percentage": 0.31
    },
    "energy": {
      "home_days": 20.1,
      "lightbulb_hours": 60177,
      "electric_car_miles": 2407
    }
  },
  "timestamp": "2023-06-15T14:22:31.456Z"
}
```

### Community Leaderboard

```
GET /leaderboard
```

Retrieves a ranked leaderboard of users based on their environmental impact metrics.

#### Query Parameters

| Parameter    | Type   | Description                                      | Required | Default |
|--------------|--------|--------------------------------------------------|----------|---------|
| time_period  | string | Time period: week, month, year, all              | No       | month   |
| metric       | string | Metric: recycled_weight, completed_pickups, carbon_savings | No | recycled_weight |

#### Response Example

```json
{
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
    },
    {
      "position": 4,
      "user_id": 23,
      "user_name": "EarthSaver",
      "value": 87.4
    },
    {
      "position": 5,
      "user_id": 56,
      "user_name": "RecycleMaster",
      "value": 76.2
    }
  ],
  "timestamp": "2023-06-15T14:22:31.456Z"
}
```

### User Impact

```
GET /user
```

Retrieves environmental impact metrics for a specific user.

#### Query Parameters

| Parameter    | Type   | Description                                      | Required | Default |
|--------------|--------|--------------------------------------------------|----------|---------|
| user_id      | integer| User ID (omit to get current user's data)        | No       | current user |
| time_period  | string | Time period: day, week, month, year, all         | No       | month   |

#### Response Example

```json
{
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
```

## Error Responses

### 401 Unauthorized

```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found

```json
{
  "detail": "User not found"
}
```

### 500 Internal Server Error

```json
{
  "detail": "Error calculating environmental impact: [error message]"
}
```

## Calculation Methodology

The environmental impact calculations are based on industry-standard conversion factors for different materials:

- **Carbon savings**: kg CO2 equivalent saved by recycling vs producing from virgin materials
- **Water savings**: liters of water saved in recycling vs virgin material production
- **Energy savings**: kWh of energy saved in recycling vs virgin material production

Each material type (paper, plastic, glass, metal, etc.) has specific conversion factors based on peer-reviewed lifecycle assessment studies.

## Rate Limiting

API requests are subject to rate limiting of 100 requests per minute per user.

## Caching

Responses are cached for 3600 seconds (1 hour) by default to improve performance. The cache can be bypassed by adding `?no_cache=true` to any request.