# G+ Recycling App API Reference

This document provides a comprehensive reference for the G+ Recycling App RESTful API endpoints.

## API Overview

The G+ Recycling App API is organized around REST principles. It uses standard HTTP response codes, accepts JSON-encoded request bodies, returns JSON-encoded responses, and utilizes OAuth2 for authentication.

### Base URL

```text
https://api.gplusrecycling.com/api/v1
```

### Authentication

The API uses OAuth2 with JWT tokens for authentication. All API requests must include an `Authorization` header with a valid access token, except for public endpoints like login and registration.

```http
Authorization: Bearer <access_token>
```

### CSRF Protection

For mutating operations (POST, PUT, DELETE), you must include a valid CSRF token in the `X-CSRF-Token` header.

```http
X-CSRF-Token: <csrf_token>
```

### Caching

Many API endpoints implement Redis caching for improved performance. Cache behavior is controlled through standard HTTP cache headers.

### Rate Limiting

API requests are limited to 100 requests per minute per user. Rate limit information is included in the response headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1632168000
```

## Authentication Endpoints

### Login

```http
POST /api/auth/login
```

Authenticates a user and returns access and refresh tokens.

**Request Body:**

```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "csrf_token": "random-csrf-token-string",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Test User",
    "role": "user",
    "is_active": true,
    "points": 250
  }
}
```

**Status Codes:**

- `200 OK`: Authentication successful
- `401 Unauthorized`: Invalid credentials
- `422 Unprocessable Entity`: Invalid request format
- `429 Too Many Requests`: Too many failed login attempts

### Register

```http
POST /api/auth/register
```

Registers a new user in the system and returns authentication tokens.

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "phone": "+1234567890",
  "address": "123 Main St, New City, State 12345"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "csrf_token": "random-csrf-token-string",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "name": "New User",
    "role": "user",
    "is_active": true,
    "email_verified": false,
    "points": 0
  }
}
```

**Status Codes:**

- `201 Created`: Registration successful
- `400 Bad Request`: Invalid request data
- `409 Conflict`: Email already registered
- `422 Unprocessable Entity`: Validation error

### Refresh Token

```http
POST /api/auth/refresh
```

Refreshes the access token using a valid refresh token. Use this endpoint when the access token expires.

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "csrf_token": "new-random-csrf-token-string",
  "expires_in": 3600
}
```

**Status Codes:**

- `200 OK`: Token refreshed successfully
- `401 Unauthorized`: Invalid or expired refresh token
- `403 Forbidden`: Token has been revoked or blacklisted

### Password Reset Request

```http
POST /api/auth/password-reset
```

Requests a password reset email with a reset link.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "If the email is registered, a password reset link has been sent"
}
```

**Status Codes:**

- `200 OK`: Request processed (always returns 200 for security reasons)
- `422 Unprocessable Entity`: Invalid email format

### Verify Email

```http
POST /api/auth/verify-email
```

Verifies a user's email address using the token sent to their email.

**Request Body:**

```json
{
  "token": "verification-token-from-email"
}
```

**Response:**

```json
{
  "message": "Email verified successfully",
  "email_verified": true
}
```

**Status Codes:**

- `200 OK`: Email verified successfully
- `400 Bad Request`: Invalid or expired token

## User Profile Endpoints

### Get Current User Profile

```http
GET /api/profile
```

Retrieves the profile information of the currently authenticated user.

**Authentication Required:** Yes

**Cache:** 5 minutes, private

**Response:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St, New City, State 12345",
  "points": 250,
  "is_active": true,
  "email_verified": true,
  "role": "user",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Status Codes:**

- `200 OK`: Profile retrieved successfully
- `401 Unauthorized`: Authentication required

### Update User Profile

```http
PUT /api/profile
```

Updates the profile information of the currently authenticated user.

**Authentication Required:** Yes

**CSRF Required:** Yes

**Request Body:**

```json
{
  "name": "John Smith",
  "phone": "+9876543210",
  "address": "456 Oak St, New City, State 12345"
}
```

**Response:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Smith",
  "phone": "+9876543210",
  "address": "456 Oak St, New City, State 12345",
  "points": 250,
  "is_active": true,
  "email_verified": true,
  "role": "user",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Status Codes:**

- `200 OK`: Profile updated successfully
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Invalid CSRF token
- `422 Unprocessable Entity`: Validation error

## Companies Endpoints

### Get All Companies

```http
GET /api/companies
```

Retrieves a paginated list of recycling companies. This endpoint is cached for performance.

**Authentication Required:** No (public endpoint)

**Cache:** 1 hour, public

**Query Parameters:**

- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Number of items per page (default: 10, max: 50)
- `search` (string, optional): Search term for filtering companies by name
- `sort` (string, optional): Field to sort by (options: "name", "created_at", default: "name")
- `order` (string, optional): Sort order (options: "asc", "desc", default: "asc")

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "name": "Green Recycling Co",
      "address": "123 Green St, Eco City, EC 98765",
      "phone": "555-123-4567",
      "email": "info@greenrecycling.com",
      "logo_url": "https://api.gplusrecycling.com/static/companies/1/logo.png",
      "website": "https://greenrecycling.com",
      "materials_accepted": ["plastic", "paper", "glass", "metal"],
      "rating": 4.5,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Urban Recyclers",
      "address": "456 City Ave, Metro City, MC 12345",
      "phone": "555-987-6543",
      "email": "contact@urbanrecyclers.com",
      "logo_url": "https://api.gplusrecycling.com/static/companies/2/logo.png",
      "website": "https://urbanrecyclers.com",
      "materials_accepted": ["electronics", "plastic", "metal"],
      "rating": 4.2,
      "created_at": "2023-02-15T00:00:00Z",
      "updated_at": "2023-02-15T00:00:00Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10,
  "pages": 2
}
```

**Status Codes:**

- `200 OK`: Companies retrieved successfully
- `400 Bad Request`: Invalid query parameters

### Get Company by ID

```http
GET /api/companies/{company_id}
```

Retrieves detailed information about a specific recycling company.

**Path Parameters:**

- `company_id` (integer, required): Unique identifier of the company

**Authentication Required:** No (public endpoint)

**Cache:** 1 hour, public

**Response:**

```json
{
  "id": 1,
  "name": "Green Recycling Co",
  "address": "123 Green St, Eco City, EC 98765",
  "phone": "555-123-4567",
  "email": "info@greenrecycling.com",
  "logo_url": "https://api.gplusrecycling.com/static/companies/1/logo.png",
  "website": "https://greenrecycling.com",
  "description": "Green Recycling Co is dedicated to sustainable waste management and recycling services for residential and commercial customers.",
  "materials_accepted": ["plastic", "paper", "glass", "metal"],
  "operating_hours": {
    "monday": "8:00 AM - 6:00 PM",
    "tuesday": "8:00 AM - 6:00 PM",
    "wednesday": "8:00 AM - 6:00 PM",
    "thursday": "8:00 AM - 6:00 PM",
    "friday": "8:00 AM - 6:00 PM",
    "saturday": "9:00 AM - 3:00 PM",
    "sunday": "Closed"
  },
  "rating": 4.5,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Status Codes:**

- `200 OK`: Company retrieved successfully
- `404 Not Found`: Company not found

### Create Company

```http
POST /api/companies
```

Creates a new recycling company in the system.

**Authentication Required:** Yes

**Authorization:** Admin role required

**CSRF Required:** Yes

**Request Body:**

```json
{
  "name": "New Recycling Co",
  "address": "456 New St, Innovation City, IC 54321",
  "phone": "555-987-6543",
  "email": "info@newrecycling.com",
  "website": "https://newrecycling.com",
  "description": "Innovative recycling solutions for modern waste management.",
  "materials_accepted": ["plastic", "electronics", "batteries"]
}
```

**Response:**

```json
{
  "id": 3,
  "name": "New Recycling Co",
  "address": "456 New St, Innovation City, IC 54321",
  "phone": "555-987-6543",
  "email": "info@newrecycling.com",
  "logo_url": null,
  "website": "https://newrecycling.com",
  "description": "Innovative recycling solutions for modern waste management.",
  "materials_accepted": ["plastic", "electronics", "batteries"],
  "rating": null,
  "created_at": "2023-09-28T14:35:42Z",
  "updated_at": "2023-09-28T14:35:42Z"
}
```

**Status Codes:**

- `201 Created`: Company created successfully
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions or invalid CSRF token
- `422 Unprocessable Entity`: Validation error

### Update Company

```http
PUT /api/companies/{company_id}
```

Updates an existing recycling company in the system.

**Path Parameters:**

- `company_id` (integer, required): Unique identifier of the company

**Authentication Required:** Yes

**Authorization:** Admin role required

**CSRF Required:** Yes

**Request Body:**

```json
{
  "name": "Updated Recycling Co",
  "address": "789 Updated St",
  "phone": "555-111-2222",
  "email": "info@updatedrecycling.com",
  "website": "https://updatedrecycling.com",
  "description": "Updated company description with new services",
  "materials_accepted": ["plastic", "paper", "electronics", "metal"]
}
```

**Response:**

```json
{
  "id": 1,
  "name": "Updated Recycling Co",
  "address": "789 Updated St",
  "phone": "555-111-2222",
  "email": "info@updatedrecycling.com",
  "logo_url": "https://api.gplusrecycling.com/static/companies/1/logo.png",
  "website": "https://updatedrecycling.com",
  "description": "Updated company description with new services",
  "materials_accepted": ["plastic", "paper", "electronics", "metal"],
  "rating": 4.5,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-09-28T15:42:10Z"
}
```

**Status Codes:**

- `200 OK`: Company updated successfully
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions or invalid CSRF token
- `404 Not Found`: Company not found
- `422 Unprocessable Entity`: Validation error

### Delete Company

```http
DELETE /api/companies/{company_id}
```

Deletes a company. Requires authentication with admin role.

**Response:**

```json
{
  "message": "Company deleted successfully"
}
```

## Pickup Requests

### Get All Pickup Requests

```http
GET /api/pickups
```

Retrieves a paginated list of pickup requests associated with the authenticated user. For admin users, this endpoint returns all pickup requests in the system.

**Authentication Required:** Yes

**Cache:** 2 minutes, private

**Query Parameters:**

- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Number of items per page (default: 10, max: 50)
- `status` (string, optional): Filter by status (options: "pending", "approved", "completed", "rejected")
- `company_id` (integer, optional): Filter by company ID
- `start_date` (string, optional): Filter by pickup requests scheduled on or after this date (ISO format)
- `end_date` (string, optional): Filter by pickup requests scheduled on or before this date (ISO format)
- `sort` (string, optional): Field to sort by (options: "scheduled_date", "created_at", default: "created_at")
- `order` (string, optional): Sort order (options: "asc", "desc", default: "desc")

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com"
      },
      "company_id": 1,
      "company": {
        "id": 1,
        "name": "Green Recycling Co",
        "logo_url": "https://api.gplusrecycling.com/static/companies/1/logo.png"
      },
      "status": "pending",
      "address": "123 User St",
      "scheduled_date": "2023-01-15T10:00:00Z",
      "materials": ["plastic", "paper"],
      "estimated_weight": 5.2,
      "estimated_points": 52,
      "notes": "Please pickup before noon",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

**Status Codes:**

- `200 OK`: Pickup requests retrieved successfully
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Authentication required

### Get Pickup Request by ID

```http
GET /api/pickups/{pickup_id}
```

Retrieves detailed information about a specific pickup request. Users can only access their own pickup requests, while admins can access any pickup request.

**Path Parameters:**

- `pickup_id` (integer, required): Unique identifier of the pickup request

**Authentication Required:** Yes

**Cache:** 2 minutes, private

**Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "+1234567890"
  },
  "company_id": 1,
  "company": {
    "id": 1,
    "name": "Green Recycling Co",
    "logo_url": "https://api.gplusrecycling.com/static/companies/1/logo.png",
    "phone": "555-123-4567",
    "email": "info@greenrecycling.com"
  },
  "status": "pending",
  "address": "123 User St",
  "scheduled_date": "2023-01-15T10:00:00Z",
  "materials": ["plastic", "paper"],
  "estimated_weight": 5.2,
  "estimated_points": 52,
  "actual_weight": null,
  "awarded_points": null,
  "notes": "Please pickup before noon",
  "feedback": null,
  "rating": null,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "status_history": [
    {
      "status": "pending",
      "timestamp": "2023-01-01T00:00:00Z",
      "comment": "Pickup request created"
    }
  ]
}
```

**Status Codes:**

- `200 OK`: Pickup request retrieved successfully
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions to access this pickup request
- `404 Not Found`: Pickup request not found

### Create Pickup Request

```http
POST /api/pickups
```

Creates a new recycling pickup request in the system. The request is automatically associated with the authenticated user.

**Authentication Required:** Yes

**CSRF Required:** Yes

**Request Body:**

```json
{
  "company_id": 1,
  "address": "123 User St",
  "scheduled_date": "2023-01-15T10:00:00Z",
  "materials": ["plastic", "paper", "glass"],
  "estimated_weight": 5.2,
  "notes": "Please pickup before noon",
  "use_profile_address": false
}
```

**Request Fields:**

- `company_id` (integer, required): ID of the recycling company to handle the pickup
- `address` (string, conditional): Address for pickup location (required if use_profile_address is false)
- `scheduled_date` (string, required): Requested date and time for pickup (ISO format)
- `materials` (array, required): Types of materials to be recycled
- `estimated_weight` (number, optional): Estimated weight of materials in kg
- `notes` (string, optional): Additional instructions or information
- `use_profile_address` (boolean, optional): If true, uses the address from user's profile

**Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "company_id": 1,
  "company": {
    "id": 1,
    "name": "Green Recycling Co",
    "logo_url": "https://api.gplusrecycling.com/static/companies/1/logo.png"
  },
  "status": "pending",
  "address": "123 User St",
  "scheduled_date": "2023-01-15T10:00:00Z",
  "materials": ["plastic", "paper", "glass"],
  "estimated_weight": 5.2,
  "estimated_points": 52,
  "actual_weight": null,
  "awarded_points": null,
  "notes": "Please pickup before noon",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Status Codes:**

- `201 Created`: Pickup request created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Invalid CSRF token
- `404 Not Found`: Company not found
- `422 Unprocessable Entity`: Validation error

### Update Pickup Request Status

```http
PUT /api/pickups/{pickup_id}/status
```

Updates the status of a pickup request. Different user roles have different permissions:

- Regular users can only cancel their own pending pickup requests
- Company users can update the status of pickup requests assigned to their company
- Admin users can update the status of any pickup request

**Path Parameters:**

- `pickup_id` (integer, required): Unique identifier of the pickup request

**Authentication Required:** Yes

**CSRF Required:** Yes

**Request Body:**

```json
{
  "status": "approved",
  "comment": "Approved and scheduled for pickup",
  "actual_weight": 5.5,
  "awarded_points": 55
}
```

**Request Fields:**

- `status` (string, required): New status (options: "pending", "approved", "in_progress", "completed", "rejected", "cancelled")
- `comment` (string, optional): Comment about the status change
- `actual_weight` (number, conditional): Required when status is "completed", the actual weight of materials in kg
- `awarded_points` (number, conditional): Required when status is "completed", points awarded to the user

**Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "company_id": 1,
  "status": "approved",
  "address": "123 User St",
  "scheduled_date": "2023-01-15T10:00:00Z",
  "materials": ["plastic", "paper"],
  "estimated_weight": 5.2,
  "estimated_points": 52,
  "actual_weight": null,
  "awarded_points": null,
  "notes": "Please pickup before noon",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-05T11:20:00Z",
  "status_history": [
    {
      "status": "pending",
      "timestamp": "2023-01-01T00:00:00Z",
      "comment": "Pickup request created"
    },
    {
      "status": "approved",
      "timestamp": "2023-01-05T11:20:00Z",
      "comment": "Approved and scheduled for pickup"
    }
  ]
}
```

**Status Codes:**

- `200 OK`: Status updated successfully
- `400 Bad Request`: Invalid status or missing required fields
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions or invalid CSRF token
- `404 Not Found`: Pickup request not found
- `422 Unprocessable Entity`: Validation error

### Delete Pickup Request

```http
DELETE /api/pickups/{pickup_id}
```

Deletes a pickup request from the system. Users can only delete their own pickup requests with a "pending" status. Admin users can delete any pickup request.

**Path Parameters:**

- `pickup_id` (integer, required): Unique identifier of the pickup request

**Authentication Required:** Yes

**CSRF Required:** Yes

**Response:**

```json
{
  "message": "Pickup request deleted successfully"
}
```

**Status Codes:**

- `200 OK`: Pickup request deleted successfully
- `400 Bad Request`: Cannot delete a pickup request that is not in "pending" status
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions or invalid CSRF token
- `404 Not Found`: Pickup request not found

## Points & Rewards

### Get User Points

```http
GET /api/points
```

Retrieves the current user's points balance and transaction history. The transaction history is paginated and can be filtered by transaction type.

**Authentication Required:** Yes

**Cache:** 2 minutes, private

**Query Parameters:**

- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Number of items per page (default: 10, max: 50)
- `transaction_type` (string, optional): Filter by transaction type (options: "credit", "debit")
- `start_date` (string, optional): Filter by transactions on or after this date (ISO format)
- `end_date` (string, optional): Filter by transactions on or before this date (ISO format)
- `sort` (string, optional): Field to sort by (options: "points", "created_at", default: "created_at")
- `order` (string, optional): Sort order (options: "asc", "desc", default: "desc")

**Response:**

```json
{
  "total_points": 250,
  "transactions": [
    {
      "id": 1,
      "user_id": 1,
      "points": 50,
      "description": "Recycled paper",
      "transaction_type": "credit",
      "reference_type": "pickup",
      "reference_id": 5,
      "created_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "points": 200,
      "description": "Recycled plastic bottles",
      "transaction_type": "credit",
      "reference_type": "pickup",
      "reference_id": 8,
      "created_at": "2023-01-10T00:00:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total_transactions": 2,
  "pages": 1
}
```

**Status Codes:**

- `200 OK`: Points retrieved successfully
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Authentication required

### Add Points

```http
POST /api/points
```

Adds points to a user's account. This endpoint is primarily used by admins and the system to award points for recycling activities.

**Authentication Required:** Yes

**Authorization:** Admin role required

**CSRF Required:** Yes

**Request Body:**

```json
{
  "user_id": 1,
  "points": 100,
  "description": "Recycled aluminum cans",
  "reference_type": "pickup",
  "reference_id": 12
}
```

**Request Fields:**

- `user_id` (integer, required): ID of the user to award points to
- `points` (integer, required): Number of points to award (must be positive)
- `description` (string, required): Description of why points are being awarded
- `reference_type` (string, optional): Type of reference (e.g., "pickup", "challenge", "bonus")
- `reference_id` (integer, optional): ID of the referenced entity (e.g., pickup request ID)

**Response:**

```json
{
  "id": 3,
  "user_id": 1,
  "points": 100,
  "description": "Recycled aluminum cans",
  "transaction_type": "credit",
  "reference_type": "pickup",
  "reference_id": 12,
  "created_at": "2023-01-20T00:00:00Z",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "current_points": 350
  }
}
```

**Status Codes:**

- `201 Created`: Points added successfully
- `400 Bad Request`: Invalid points value or missing required fields
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions or invalid CSRF token
- `404 Not Found`: User not found
- `422 Unprocessable Entity`: Validation error

### Redeem Points

```http
POST /api/points/redeem
```

Redeems user points for a reward from the rewards catalog. The points are deducted from the user's account balance.

**Authentication Required:** Yes

**CSRF Required:** Yes

**Request Body:**

```json
{
  "reward_id": 1,
  "quantity": 1,
  "delivery_address": "123 Main St, New City, State 12345"
}
```

**Request Fields:**

- `reward_id` (integer, required): ID of the reward to redeem
- `quantity` (integer, optional): Quantity of rewards to redeem (default: 1)
- `delivery_address` (string, optional): Address for reward delivery (defaults to user's profile address if not provided)

**Response:**

```json
{
  "transaction": {
    "id": 4,
    "user_id": 1,
    "points": -50,
    "description": "Redeemed for Eco-friendly water bottle",
    "transaction_type": "debit",
    "reference_type": "reward",
    "reference_id": 1,
    "created_at": "2023-01-25T00:00:00Z"
  },
  "redemption": {
    "id": 1,
    "user_id": 1,
    "reward_id": 1,
    "reward": {
      "id": 1,
      "name": "Eco-friendly water bottle",
      "description": "Reusable 750ml water bottle made from recycled materials",
      "points_required": 50,
      "image_url": "https://api.gplusrecycling.com/static/rewards/water-bottle.png"
    },
    "quantity": 1,
    "points_spent": 50,
    "status": "processing",
    "delivery_address": "123 Main St, New City, State 12345",
    "created_at": "2023-01-25T00:00:00Z"
  },
  "user_points_remaining": 200
}
```

**Status Codes:**

- `200 OK`: Points redeemed successfully
- `400 Bad Request`: Invalid request or insufficient points
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Invalid CSRF token
- `404 Not Found`: Reward not found
- `422 Unprocessable Entity`: Validation error

### Get Available Rewards

```http
GET /api/rewards
```

Retrieves a paginated list of available rewards that users can redeem with their points.

**Authentication Required:** Optional (shows personalized availability if authenticated)

**Cache:** 30 minutes, public

**Query Parameters:**

- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Number of items per page (default: 10, max: 50)
- `min_points` (integer, optional): Filter rewards by minimum points required
- `max_points` (integer, optional): Filter rewards by maximum points required
- `category` (string, optional): Filter rewards by category
- `sort` (string, optional): Field to sort by (options: "name", "points_required", default: "points_required")
- `order` (string, optional): Sort order (options: "asc", "desc", default: "asc")

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "name": "Eco-friendly water bottle",
      "description": "Reusable 750ml water bottle made from recycled materials",
      "points_required": 50,
      "image_url": "https://api.gplusrecycling.com/static/rewards/water-bottle.png",
      "category": "merchandise",
      "available": true,
      "can_redeem": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Recycled notebook",
      "description": "A5 notebook made from 100% recycled paper",
      "points_required": 30,
      "image_url": "https://api.gplusrecycling.com/static/rewards/notebook.png",
      "category": "merchandise",
      "available": true,
      "can_redeem": true,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "pages": 1,
  "user_points": 250
}
```

**Status Codes:**

- `200 OK`: Rewards retrieved successfully
- `400 Bad Request`: Invalid query parameters

### Get User Redemption History

```http
GET /api/points/redemptions
```

Retrieves the history of reward redemptions for the authenticated user.

**Authentication Required:** Yes

**Cache:** 2 minutes, private

**Query Parameters:**

- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Number of items per page (default: 10, max: 50)
- `status` (string, optional): Filter by redemption status (options: "processing", "shipped", "delivered", "cancelled")
- `sort` (string, optional): Field to sort by (options: "created_at", default: "created_at")
- `order` (string, optional): Sort order (options: "asc", "desc", default: "desc")

**Response:**

```json
{
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "reward_id": 1,
      "reward": {
        "id": 1,
        "name": "Eco-friendly water bottle",
        "description": "Reusable 750ml water bottle made from recycled materials",
        "points_required": 50,
        "image_url": "https://api.gplusrecycling.com/static/rewards/water-bottle.png"
      },
      "quantity": 1,
      "points_spent": 50,
      "status": "delivered",
      "delivery_address": "123 Main St, New City, State 12345",
      "tracking_number": "TRK123456789",
      "created_at": "2023-01-25T00:00:00Z",
      "updated_at": "2023-02-01T00:00:00Z",
      "delivered_at": "2023-02-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

**Status Codes:**

- `200 OK`: Redemption history retrieved successfully
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Authentication required

## Error Handling

All API endpoints follow a consistent error format:

```json
{
  "detail": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "params": {}
  }
}
```

Common error codes:

- `AUTHENTICATION_FAILED`: Invalid credentials or missing authentication
- `PERMISSION_DENIED`: User does not have permission to perform the action
- `RESOURCE_NOT_FOUND`: The requested resource was not found
- `VALIDATION_ERROR`: Request validation failed
- `TOKEN_EXPIRED`: Authentication token has expired
- `CSRF_TOKEN_INVALID`: Invalid or missing CSRF token
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server encountered an unexpected error

## API Rate Limiting

To ensure fair usage and system stability, the API implements rate limiting:

- Public endpoints: 60 requests per minute per IP address
- Authenticated endpoints: 120 requests per minute per user
- Admin endpoints: 300 requests per minute per admin user

When a rate limit is exceeded, the API returns a 429 Too Many Requests status code with headers:

- `X-RateLimit-Limit`: Total number of requests allowed in the time window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit window resets

## Cache Control

Many API endpoints implement caching for improved performance. Cache headers include:

- `Cache-Control`: Specifies caching policy (e.g., "public, max-age=3600" or "private, max-age=120")
- `ETag`: Entity tag for conditional requests
- `Last-Modified`: Timestamp when the resource was last updated

To force a fresh response (bypassing cache), include the header `Cache-Control: no-cache` with your request.

## API Usage Examples

### Example 1: Authentication and Company Listing

This example demonstrates how to authenticate and retrieve a list of recycling companies:

**Using cURL:**

```bash
# Step 1: Authenticate and obtain a token
curl -X POST https://api.gplusrecycling.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'

# Response will include an access_token and refresh_token

# Step 2: Use the token to retrieve companies
curl -X GET https://api.gplusrecycling.com/v1/companies \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Using JavaScript SDK:**

```javascript
import GplusApi from 'gplus-api-client';

const api = new GplusApi({
  baseUrl: 'https://api.gplusrecycling.com/v1'
});

// Authenticate
const authResult = await api.auth.login({
  email: 'user@example.com',
  password: 'your_password'
});

// The SDK automatically stores and manages tokens

// Get companies
const companies = await api.companies.list({
  page: 1,
  limit: 10,
  sort: 'name',
  order: 'asc'
});

console.log(companies.items);
```

### Example 2: Creating a Pickup Request

This example shows how to create a new recycling pickup request:

**Using cURL:**

```bash
curl -X POST https://api.gplusrecycling.com/v1/pickups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "company_id": 1,
    "address": "123 Main St, New City",
    "scheduled_date": "2023-10-15T10:00:00Z",
    "materials": ["plastic", "paper", "glass"],
    "estimated_weight": 5.2,
    "notes": "Please pickup before noon"
  }'
```

**Using JavaScript SDK:**

```javascript
import GplusApi from 'gplus-api-client';

const api = new GplusApi({
  baseUrl: 'https://api.gplusrecycling.com/v1'
});

// Authenticate (if not already authenticated)
await api.auth.login({ email: 'user@example.com', password: 'your_password' });

// Create pickup request
const pickup = await api.pickups.create({
  company_id: 1,
  address: "123 Main St, New City",
  scheduled_date: "2023-10-15T10:00:00Z",
  materials: ["plastic", "paper", "glass"],
  estimated_weight: 5.2,
  notes: "Please pickup before noon"
});

console.log(`Pickup created with ID: ${pickup.id}`);
```

## Need Help?

If you encounter issues with the API or have questions, please contact our developer support team at `api-support@gplusrecycling.com` or visit our [Developer Portal](https://developers.gplusrecycling.com/) for additional resources and documentation.
