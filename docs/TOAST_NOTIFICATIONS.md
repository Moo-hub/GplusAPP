# Toast Notification System

## Overview

The GPlus App includes a comprehensive toast notification system designed to provide consistent and user-friendly feedback to users. The system extends the capabilities of `react-toastify` with accessibility features, consistent styling, and integration with our error handling system.

## Features

- **Consistent Styling**: Unified appearance for all toast notifications
- **Four Notification Types**: Success, Error, Warning, and Info
- **Promise-Based Toasts**: Show toast notifications based on promise states
- **Accessibility**: ARIA attributes for screen readers
- **RTL Support**: Right-to-left language support
- **Dark Mode Support**: Theme-aware styling
- **Integration**: Works with our global error handling system

## Usage

### Basic Toast Functions

```jsx
import { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo,
  showPromise,
  dismissAll,
  updateToast
} from '../utils/toast';

// Display different types of toasts
showSuccess('Operation completed successfully!');
showError('Something went wrong. Please try again.');
showWarning('This action might cause problems.');
showInfo('The system is currently updating.');

// Track promises
const promise = fetchData();
showPromise(
  promise,
  {
    pending: 'Loading data...',
    success: 'Data loaded successfully!',
    error: 'Failed to load data!'
  }
);

// Dismiss all active toasts
dismissAll();

// Update existing toast
updateToast('toast-id', { 
  content: 'Updated content',
  autoClose: false 
});
```

### Toast Handler Hook

The `useToastHandler` hook provides an elegant way to combine toast notifications with async operations:

```jsx
import { useToastHandler } from '../hooks/useToastHandler';

function MyComponent() {
  const { 
    isLoading, 
    handleAsync, 
    success, 
    error, 
    warning, 
    info 
  } = useToastHandler();

  const submitForm = async (data) => {
    try {
      const result = await handleAsync(
        () => api.submitData(data),
        {
          loading: 'Submitting your data...',
          success: 'Data submitted successfully!',
          error: 'Failed to submit data.'
        }
      );
      return result;
    } catch (err) {
      // Error already handled by the hook
      console.error(err);
    }
  };

  // Direct toast functions
  const showSuccessExample = () => {
    success('This is a success message!');
  };

  return (
    <div>
      <button onClick={submitForm} disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
      <button onClick={showSuccessExample}>Show Success</button>
    </div>
  );
}
```

## Configuration

The toast system includes default configurations that can be overridden when calling the toast functions:

```jsx
showSuccess('Message', {
  position: 'bottom-center',
  autoClose: 2000,
  hideProgressBar: true,
  // ...other options
});
```

## Styling

Custom styling for toasts is defined in `frontend/src/styles/toast.css`. The styles include:

- Color coding for different toast types
- Responsive design for various screen sizes
- Dark mode support
- Accessibility focus styles
- RTL language support

## Accessibility

The toast system includes several accessibility features:

- ARIA roles and attributes
- Keyboard focus management
- Screen reader announcements
- High contrast colors
- Customizable dismiss buttons

## Integration with Error Handling

The toast system integrates with our global error handling:

```jsx
import { useErrorContext } from '../context/ErrorContext';
import { showError } from '../utils/toast';

function ErrorHandler() {
  const { error, clearError } = useErrorContext();
  
  // Show toast when error changes
  useEffect(() => {
    if (error) {
      showError(error.message);
    }
  }, [error]);
  
  return null;
}
```

## Example Component

An example component demonstrating all toast features is available at:
`frontend/src/components/examples/ToastExample.jsx`

## Tests

The toast system includes comprehensive test coverage:
- `frontend/src/__tests__/toast.test.js`
- `frontend/src/__tests__/useToastHandler.test.js`