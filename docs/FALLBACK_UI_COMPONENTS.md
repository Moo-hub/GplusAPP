# Fallback UI Components

## Overview

The GPlus App includes a comprehensive set of fallback UI components and utilities designed to provide a better user experience during loading states, errors, and when no data is available. These components follow best practices for accessibility and user experience.

## Components

### LoadingOverlay

A full-screen loading overlay that blocks interaction with the application during global loading states.

```jsx
import LoadingOverlay from '../components/ui/LoadingOverlay';

// Usage
<LoadingOverlay 
  isVisible={isLoading} 
  message="Processing your request..." 
/>
```

**Props:**

- `isVisible` (boolean, required): Whether the overlay should be shown
- `message` (string): The message to display, defaults to "Loading..."
- `spinnerComponent` (ReactNode): Custom spinner component to replace the default
- `overlayClass` (string): Additional CSS class for the overlay
- `spinnerClass` (string): Additional CSS class for the spinner

### InlineLoader

A smaller loading indicator designed for inline use within components or specific areas of the UI.

```jsx
import InlineLoader from '../components/ui/InlineLoader';

// Usage
<InlineLoader 
  size="medium" 
  message="Loading items..." 
  centered 
/>
```

**Props:**

- `size` (string): Size of the loader - "small", "medium", or "large"
- `message` (string): The message to display alongside the spinner
- `centered` (boolean): Whether to center the loader in its container
- `className` (string): Additional CSS class
- `style` (object): Additional inline styles

### EmptyState

A component to display when no data is available.

```jsx
import EmptyState from '../components/ui/EmptyState';

// Usage
<EmptyState
  title="No items found"
  message="Try adjusting your search or filters."
  icon={<SearchIcon />}
  action={<Button onClick={resetFilters}>Clear Filters</Button>}
/>
```

**Props:**

- `title` (string): The title to display
- `message` (string): A more detailed message to display
- `icon` (ReactNode): Icon to display at the top
- `action` (ReactNode): Action component like a button
- `className` (string): Additional CSS class
- `style` (object): Additional inline styles
- `children` (ReactNode): Alternative to using the props above

### AsyncStateHandler

A component that handles all possible states of asynchronous operations: loading, error, empty, and success.

```jsx
import AsyncStateHandler from '../components/ui/AsyncStateHandler';

// Usage
<AsyncStateHandler
  loading={isLoading}
  error={error}
  isEmpty={data && data.length === 0}
  onRetry={fetchData}
  emptyTitle="No results found"
  emptyMessage="Try adjusting your search criteria."
>
  {/* Content to display when data is loaded successfully */}
  <DataTable data={data} />
</AsyncStateHandler>
```

**Props:**

- `loading` (boolean): Whether data is currently loading
- `error` (object): Error object if an error occurred
- `isEmpty` (boolean): Whether the data is empty
- `onRetry` (function): Function to retry the operation
- `loadingFallback` (ReactNode): Custom loading component
- `errorFallback` (ReactNode): Custom error component
- `emptyFallback` (ReactNode): Custom empty state component
- `loadingMessage` (string): Message to display during loading
- `emptyTitle` (string): Title for empty state
- `emptyMessage` (string): Message for empty state
- `emptyIcon` (ReactNode): Icon for empty state
- `emptyAction` (ReactNode): Action for empty state
- `children` (ReactNode, required): Content to render on success

## Contexts

### LoadingContext

Provides loading state management throughout the application.

```jsx
import { useLoading } from '../contexts/LoadingContext';

// Usage inside a component
const { isLoading, startLoading, stopLoading } = useLoading();

// Start loading
startLoading();

// Stop loading
stopLoading();
```

**Context Values:**

- `isLoading` (boolean): The current global loading state
- `setGlobalLoading` (function): Set the global loading state directly
- `startLoading` (function): Start the global loading state
- `stopLoading` (function): Stop the global loading state
- `loadingOperations` (object): Map of all active loading operations by ID
- `registerLoadingOperation` (function): Register a named loading operation
- `unregisterLoadingOperation` (function): Unregister a loading operation

## Hooks

### useLoadingIndicator

A hook for managing loading indicators tied to specific operations.

```jsx
import useLoadingIndicator from '../hooks/useLoadingIndicator';

// Usage
const { isLoading, startLoading, stopLoading, wrapPromise } = useLoadingIndicator({
  id: 'fetch-users',
  global: true
});

// Start loading
startLoading();

// Stop loading
stopLoading();

// Wrap an async operation with loading indicators
const fetchData = async () => {
  return wrapPromise(api.getUsers());
};
```

**Options:**

- `id` (string): Unique identifier for this loading operation
- `global` (boolean): Whether this operation should affect global loading state

**Returns:**

- `isLoading` (boolean): Current loading state
- `startLoading` (function): Start loading
- `stopLoading` (function): Stop loading
- `wrapPromise` (function): Wrap an async operation with loading state
- `loadingId` (string): The ID of this loading operation

### useOfflineStatus

A hook for detecting online/offline status and showing appropriate notifications.

```jsx
import useOfflineStatus from '../hooks/useOfflineStatus';

// Usage
const { isOffline, isOnline, checkConnection } = useOfflineStatus({
  showToasts: true,
  checkInterval: 30000
});

if (isOffline) {
  return <OfflineMessage />;
}
```

**Options:**

- `showToasts` (boolean): Whether to show toast notifications on status changes
- `checkInterval` (number): Interval in ms to actively check connection
- `endpoint` (string): URL to ping for active connection checks

**Returns:**

- `isOffline` (boolean): Whether the user is offline
- `isOnline` (boolean): Whether the user is online
- `checkConnection` (function): Manually check the connection
- `isCheckingConnection` (boolean): Whether a connection check is in progress

## CSS and Styling

The fallback UI components use a CSS file located at `src/styles/fallback-ui.css` that provides consistent styling for loading spinners, error messages, retry buttons, and empty states.

Key features:

- Consistent theming with light/dark mode support
- Accessible focus states
- RTL language support
- Loading animations
- Responsive design