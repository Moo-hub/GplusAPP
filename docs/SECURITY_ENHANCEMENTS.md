# GPlus App Security Enhancements

This document outlines the security enhancements implemented in the GPlus App to protect user data and prevent common web security vulnerabilities.

## Security Features Implemented

### 1. Enhanced Token Management
- JWT access and refresh tokens with proper type verification
- Token blacklisting for logout and security revocation
- Token rotation for refresh tokens to prevent token theft
- JWT payload validation with proper error handling

### 2. CSRF Protection
- Double-submit cookie pattern implementation
- CSRF token validation for all mutation operations (POST, PUT, DELETE)
- Separate CSRF token for JavaScript access and inclusion in headers
- CSRF protection middleware for global application security

### 3. Rate Limiting
- Redis-based rate limiting to prevent brute force attacks
- Configurable limits based on endpoint sensitivity
- IP-based tracking with proper error responses
- Bypass options for trusted sources when needed

### 4. Cookie Security
- HTTP-only cookies for sensitive data (refresh tokens)
- Secure flag for production environments
- SameSite=Strict policy to prevent CSRF
- Proper cookie expiration management

### 5. Role-Based Access Control
- User role verification in token payload
- Role-specific endpoints and permissions
- Superuser and company-specific role enforcement
- Fine-grained access control for company resources

## Implementation Details

### Backend (FastAPI)
- `security.py`: Core security functions for token management and CSRF protection
- `middlewares/security.py`: Rate limiting middleware
- `api/dependencies/auth.py`: Authentication dependencies for route protection
- `api/api_v1/endpoints/auth.py`: Authentication endpoints with security features

### Frontend (React)
- `services/api.js`: API service with token and CSRF handling
- `services/auth.js`: Authentication service with secure login/logout
- `services/token.js`: Token management with proper refresh handling

## Usage Guidelines

### Protecting Routes
To protect a route with authentication:
```python
@router.get("/protected-resource")
def get_protected_resource(current_user: User = Depends(get_current_user)):
    # Only authenticated users can access
    return {"data": "protected"}
```

To protect a route with role-based access:
```python
@router.post("/admin-resource")
def create_admin_resource(
    current_user: User = Depends(get_current_superuser)
):
    # Only superusers can access
    return {"data": "admin only"}
```

### CSRF Protection for Mutation Operations
```python
@router.put("/update-resource")
def update_resource(
    request: Request,
    data: Dict[str, Any],
    x_csrf_token: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user)
):
    # Validate CSRF token
    validate_csrf_token(request, x_csrf_token)
    # Process update
    return {"status": "updated"}
```

### Frontend Authentication
```javascript
// Login with CSRF protection
const login = async (email, password) => {
  const response = await api.post('/auth/login', formData, {
    withCredentials: true // Important to receive cookies
  });
  
  // Store tokens securely
  localStorage.setItem('token', response.data.access_token);
  localStorage.setItem('csrfToken', response.data.csrf_token);
}

// Making authenticated requests with CSRF protection
const updateProfile = async (data) => {
  const response = await api.put('/profile', data, {
    withCredentials: true,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'X-CSRF-Token': localStorage.getItem('csrfToken')
    }
  });
  return response.data;
}
```

## Testing Security Features

Run the security tests to validate implementation:

```bash
cd backend
pytest app/tests/test_auth_security.py -v
```