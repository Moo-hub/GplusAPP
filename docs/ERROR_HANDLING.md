# Error Handling System Documentation

## Overview

The GPlus App implements a comprehensive error handling system designed to provide a consistent, user-friendly experience when errors occur. The system includes React error boundaries, global error context, API error handling, and integration with error tracking services.

## Components

### 1. Error Boundary

Located at `frontend/src/components/ErrorBoundary.jsx`, this is a class component that catches JavaScript errors in its child component tree. It prevents the entire app from crashing when errors occur in a specific UI component.

**Features:**
- Catches and contains component errors
- Renders a fallback UI when errors occur
- Provides error reset functionality
- Supports custom fallback components

**Usage Example:**
```jsx
import ErrorBoundary from './components/ErrorBoundary';
import ErrorFallback from './components/ErrorFallback';

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

### 2. Error Context

Located at `frontend/src/context/ErrorContext.js`, this provides global error state management throughout the application using React Context.

**Features:**
- Global error state accessible throughout the app
- Functions to set, clear, and handle errors
- Integration with error message formatting

**Usage Example:**
```jsx
import { useErrorContext } from '../context/ErrorContext';

function MyComponent() {
  const { error, setError, clearError, catchError } = useErrorContext();
  
  // Handle async operations with automatic error handling
  const handleSubmit = async () => {
    try {
      await catchError(submitData());
    } catch (err) {
      // Error is already set in the global context
    }
  };
  
  return (
    <div>
      {error && <div className="error-message">{error.message}</div>}
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
}
```

### 3. Error Hook

Located at `frontend/src/hooks/useErrorHandler.js`, this custom hook provides error handling functionality for async operations.

**Features:**
- Loading state management
- Error state management
- Toast notifications integration
- Custom error callbacks

**Usage Example:**
```jsx
import { useErrorHandler } from '../hooks/useErrorHandler';

function DataComponent() {
  const { error, isLoading, handleAsync, clearError } = useErrorHandler();
  
  const fetchData = async () => {
    try {
      const data = await handleAsync(
        () => api.getData(), 
        'Failed to load data'
      );
      return data;
    } catch (err) {
      // Error is already handled by the hook
      return null;
    }
  };
  
  return (
    <div>
      {isLoading && <Spinner />}
      {error && <div className="error-message">{error.message}</div>}
      <button onClick={fetchData} disabled={isLoading}>Load Data</button>
    </div>
  );
}
```

### 4. API Error Handling

Enhanced API service (in `frontend/src/services/api.js`) with comprehensive error handling:

**Features:**
- Axios interceptors for centralized error handling
- API call tracking for loading indicators
- Consistent error formatting and messaging
- Authentication error handling
- Error events for global monitoring

### 5. Error Reporting Utility

Located at `frontend/src/utils/errorReporter.js`, this provides integration with external error monitoring services.

**Features:**
- Initialization for error reporting services
- Global error handlers for uncaught errors
- Performance tracking
- User context for error reports

## Error Types and Messages

The system handles various types of errors with user-friendly messages:

- **Network Errors:** "Unable to connect to the server. Please check your internet connection."
- **Authentication Errors (401):** "Your session has expired. Please log in again."
- **Permission Errors (403):** "You do not have permission to perform this action."
- **Not Found Errors (404):** "The requested resource was not found."
- **Validation Errors (422):** Displays detailed validation messages
- **Server Errors (5xx):** "Server error. Our team has been notified."

## Testing

The error handling system includes comprehensive test coverage:

- `frontend/src/__tests__/useErrorHandler.test.js`
- `frontend/src/__tests__/ErrorContext.test.js`
- `frontend/src/__tests__/GlobalLoadingIndicator.test.jsx`
- `frontend/src/components/__tests__/ErrorBoundary.test.jsx`

## Best Practices

1. **Component-Level Errors:** Use ErrorBoundary around route components
2. **API Calls:** Use the `apiHandler` wrapper or `useErrorHandler` hook
3. **Async Functions:** Use `catchError` from ErrorContext or `handleAsync` from useErrorHandler
4. **Custom Error Handling:** Extend the error system through custom callbacks

## Integration with Monitoring Services

The error reporting utility is designed to integrate with services like Sentry, LogRocket, or other monitoring tools. To connect with a specific service, update the implementation in `errorReporter.js`.