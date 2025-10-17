# State Management Improvements in GPlus App

## Overview

We've implemented a comprehensive state management solution for the GPlus App using React Context API and React Query. These improvements provide a more maintainable, performant, and developer-friendly way to manage application state and data fetching.

## Context-Based State Management

### 1. AuthContext

The `AuthContext` provides authentication state and methods throughout the application, handling:

- User authentication status
- Login, logout, and registration flows
- Profile updates
- Session management
- Integration with token-based authentication

```jsx
import { useAuth } from '../contexts/AuthContext';

// In a component
const { user, isAuthenticated, login, logout } = useAuth();
```

### 2. PreferencesContext

The `PreferencesContext` manages user preferences and settings, providing:

- Theme preferences (light, dark, or system)
- UI customization options
- Notification settings
- Accessibility preferences
- Language preferences

```jsx
import { usePreferences } from '../contexts/PreferencesContext';

// In a component
const { preferences, setPreference } = usePreferences();
const { theme } = preferences.ui;

// Update a preference
setPreference('ui.compactMode', true);
```

### 3. ThemeContext

The `ThemeContext` provides theme management capabilities:

- Current theme state (light or dark)
- Theme toggling functionality
- System theme detection
- Integration with CSS theme variables

```jsx
import { useTheme } from '../contexts/ThemeContext';

// In a component
const { currentTheme, isDarkMode, toggleTheme } = useTheme();
```

## React Query Integration

We've implemented React Query to manage server state with a range of benefits:

### 1. Centralized Query Client

- Consistent configuration for all data fetching operations
- Global error handling
- Automatic retries with intelligent backoff
- Cache management with appropriate stale times

```jsx
// queryClient.js configuration
export const queryClient = createQueryClient();
```

### 2. Service-Specific Query Hooks

We've created custom hooks for each service area:

#### Points Service Hooks

- `usePointsSummary`: Fetches the user's points summary
- `usePointsHistory`: Retrieves transaction history
- `useRedeemPoints`: Mutation for redeeming points
- `useTransferPoints`: Mutation for transferring points

```jsx
import { usePointsSummary, usePointsHistory } from '../hooks/usePointsQuery';

// In a component
const { data: pointsSummary } = usePointsSummary();
const { data: history } = usePointsHistory({ limit: 10 });
```

#### Pickup Service Hooks

- `usePickupRequests`: Fetches pickup requests with filtering
- `usePickupRequest`: Retrieves a single pickup request
- `useCreatePickupRequest`: Mutation for creating requests with optimistic updates
- `useUpdatePickupRequest`: Mutation for updating requests
- `useCancelPickupRequest`: Mutation for canceling requests

```jsx
import { usePickupRequests, useCreatePickupRequest } from '../hooks/usePickupQuery';

// In a component
const { data: pickups } = usePickupRequests({ status: 'pending' });
const { mutate: createPickup } = useCreatePickupRequest();
```

#### Company Service Hooks

- `useCompanies`: Fetches filtered company listings
- `useCompany`: Retrieves a single company
- `useCompanyLocations`: Gets company locations
- `useNearbyCompanies`: Finds companies near a location

```jsx
import { useCompanies, useNearbyCompanies } from '../hooks/useCompanyQuery';

// In a component
const { data: companies } = useCompanies({ type: 'recycling' });
const { data: nearbyCompanies } = useNearbyCompanies(userLocation, 5);
```

#### User Service Hooks

- `useUserProfile`: Fetches the current user's profile
- `useUpdateProfile`: Updates user profile with optimistic updates
- `useChangePassword`: Changes user password
- `useUploadProfilePicture`: Uploads a profile picture

```jsx
import { useUserProfile, useUpdateProfile } from '../hooks/useUserQuery';

// In a component
const { data: profile } = useUserProfile();
const { mutate: updateProfile } = useUpdateProfile();
```

### 3. Optimistic Updates

Implemented optimistic updates for better user experience in:

- Pickup request creation and cancellation
- Points redemption and transfer
- User profile updates
- Notification settings

### 4. Query Key Management

Established a consistent query key structure for better cache management:

```javascript
// queryClient.js
export const queryKeys = {
  auth: {
    user: ['auth', 'user'],
    // ...
  },
  points: {
    summary: ['points', 'summary'],
    transactions: (filters) => ['points', 'transactions', { ...filters }],
    // ...
  },
  // ...
};
```

## Benefits of the New Architecture

1. **Separation of Concerns**: Clear distinction between UI state (React Context) and server state (React Query)

2. **Developer Experience**:
   - Reduced boilerplate code
   - Consistent patterns for data fetching
   - Better TypeScript integration
   - Devtools for debugging

3. **Performance Improvements**:
   - Automatic caching and deduplication
   - Background refetching
   - Optimistic updates for a responsive feel
   - Request cancellation

4. **User Experience**:
   - Immediate UI feedback with optimistic updates
   - Proper loading states
   - Consistent error handling
   - Offline detection

5. **Maintainability**:
   - Centralized configuration
   - Modular query hooks
   - Consistent patterns
   - Better testability

## Integration with App Structure

- Added `PreferencesProvider` to the app's provider hierarchy
- Connected React Query to the app
- Added React Query Devtools for development environment
- Ensured compatibility with existing components

## Next Steps

1. **Refactor Existing Components**:
   - Update components to use new query hooks
   - Replace direct API calls with React Query hooks

2. **Extend Cache Management**:
   - Implement prefetching for anticipated user actions
   - Add pagination cursors to queries

3. **Offline Support**:
   - Integrate with service worker for offline data
   - Add optimistic updates that persist across sessions
