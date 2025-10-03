# CSRF Protection in GPlus App

## Overview

This document describes the Cross-Site Request Forgery (CSRF) protection implementation in the GPlus App. CSRF protection helps prevent attacks where malicious websites can trick users into submitting unwanted actions to our web application when they are authenticated.

## Implementation Architecture

Our CSRF protection uses a double-submit cookie pattern with token rotation:

1. **Server-Side Implementation**:
   - Generates a secure CSRF token during authentication
   - Sets the token as both an HTTP-only cookie and returns it in response bodies
   - Validates tokens on all state-changing requests (POST, PUT, DELETE, PATCH)
   - Rotates tokens on sensitive operations (login, refresh token)

2. **Client-Side Implementation**:
   - Stores the CSRF token in memory and localStorage
   - Automatically includes the token in all mutation request headers
   - Handles token refresh when validation fails
   - Provides React context for components that need to use the token

## Technical Details

### Server-Side (Backend)

#### Token Generation and Validation

The server generates CSRF tokens using a cryptographically secure random generator. The token is then:

1. Set as a cookie named `csrf_token` with the following properties:
   - `samesite="strict"` - Prevents the cookie from being sent in cross-site requests
   - `httpOnly=false` - Allows JavaScript to read the cookie (necessary for our implementation)
   - `secure=true` in production - Ensures the cookie is only sent over HTTPS

2. Added to response bodies for all authentication-related endpoints:
   - `/api/v1/auth/login`
   - `/api/v1/auth/refresh`

3. Validated by the `CSRFProtection` middleware which:
   - Checks that the token in the `X-CSRF-Token` header matches the one in the cookie
   - Exempts safe methods (GET, HEAD, OPTIONS)
   - Exempts authentication endpoints (login, register)

#### CSRF Middleware

The backend implements CSRF protection as a middleware that:

- Intercepts all requests to protected routes
- Validates the CSRF token from request headers against the cookie
- Returns a 403 error if validation fails

### Client-Side (Frontend)

#### CSRFService

The frontend includes a dedicated `CSRFService` that:

1. Manages token retrieval, storage, and refresh:
   - In-memory storage for active use
   - localStorage for persistence between page refreshes
   - Cookie as a fallback source

2. Provides methods for:
   - `getToken()`: Get the current token from memory, localStorage, or cookie
   - `setToken(token)`: Store a new token in memory and localStorage
   - `clearToken()`: Remove the token from memory and localStorage
   - `refreshToken()`: Fetch a fresh token from the server

#### React Integration

1. **CSRFContext**: Provides React components with access to CSRF functionality:
   - `token`: Current CSRF token
   - `setToken(token)`: Update the token
   - `refresh()`: Refresh the token from the server
   - `clear()`: Clear the token

2. **CSRFProvider**: Wraps the application to provide CSRF context to all components

3. **useCSRF Hook**: Enables components to access and manage CSRF tokens

#### API Integration

Our API service automatically:

1. Adds the CSRF token to all mutation requests via an Axios interceptor
2. Updates the token when a new one is received in a response
3. Attempts to refresh the token when a CSRF validation error occurs (419/422 status)

## Usage Examples

### Adding the CSRF Token to a Form Submission

```jsx
import { useCSRFContext } from '../contexts/CSRFContext';

const MyForm = () => {
  const { token } = useCSRFContext();
  
  const handleSubmit = async (data) => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      body: JSON.stringify(data)
    });
    // Handle response
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Manual Token Refresh

```jsx
import { useCSRFContext } from '../contexts/CSRFContext';

const SecuritySettings = () => {
  const { token, refresh } = useCSRFContext();
  
  const handleRefreshToken = async () => {
    try {
      await refresh();
      alert('CSRF token refreshed successfully');
    } catch (error) {
      alert('Failed to refresh CSRF token');
    }
  };
  
  return (
    <div>
      <p>Current CSRF token: {token ? '✓ Valid' : '✗ Missing'}</p>
      <button onClick={handleRefreshToken}>Refresh Token</button>
    </div>
  );
};
```

## Security Considerations

1. **Token Storage**:
   - The token is stored in memory (for immediate use) and localStorage (for persistence)
   - This provides defense-in-depth while maintaining usability

2. **Token Validation**:
   - The server validates that the token in the request header matches the one in the cookie
   - This prevents CSRF attacks even if an attacker can set headers

3. **Token Rotation**:
   - The token is rotated on sensitive operations to limit the window of validity
   - New tokens are issued during login, token refresh, and after certain operations

4. **Error Handling**:
   - If token validation fails, the client attempts to refresh the token automatically
   - If refresh fails, the user is prompted to reload the page

## Testing CSRF Protection

To verify CSRF protection is working correctly:

1. Ensure all mutation API calls include the CSRF token
2. Confirm that requests without a valid token are rejected
3. Verify token rotation is working during authentication
4. Test the automatic token refresh when validation fails

## Troubleshooting

Common CSRF-related issues and solutions:

1. **"Invalid CSRF Token" errors**:
   - Check that the CSRFProvider is included in your component hierarchy
   - Ensure the token is being sent in the X-CSRF-Token header
   - Try refreshing the token manually

2. **Token not being set**:
   - Verify that cookies are being properly set by the server
   - Check for any cookie blocking settings in the browser
   - Ensure the response from authentication endpoints includes the token

3. **Automatic refresh not working**:
   - Check for console errors during the refresh attempt
   - Verify that the refresh endpoint is accessible
   - Ensure the CSRFService is properly integrated with the API service
