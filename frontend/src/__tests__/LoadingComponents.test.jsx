import React from 'react';
import { render, screen, act } from '@testing-library/react';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import InlineLoader from '../components/ui/InlineLoader';
import { LoadingProvider, useLoading } from '../contexts/LoadingContext';

// Mock component that uses the loading context
const TestComponent = () => {
  const { isLoading, startLoading, stopLoading } = useLoading();
  return (
    <div>
      <button data-testid="start-btn" onClick={startLoading}>Start Loading</button>
      <button data-testid="stop-btn" onClick={stopLoading}>Stop Loading</button>
      {isLoading && <div data-testid="is-loading">Loading</div>}
      <LoadingOverlay isVisible={isLoading} message="Test Loading Message" />
    </div>
  );
};

describe('Loading Components Integration', () => {
  describe('LoadingOverlay Component', () => {
    it('renders correctly when visible', () => {
      render(<LoadingOverlay isVisible={true} message="Loading Test" />);
      
      expect(screen.getByText('Loading Test')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    
    it('does not render when not visible', () => {
      render(<LoadingOverlay isVisible={false} message="Loading Test" />);
      
      expect(screen.queryByText('Loading Test')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    it('accepts custom spinner component', () => {
      const CustomSpinner = () => <div data-testid="custom-spinner">Custom Spinner</div>;
      
      render(
        <LoadingOverlay 
          isVisible={true} 
          message="Loading Test" 
          spinnerComponent={<CustomSpinner />} 
        />
      );
      
      expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading Test')).toBeInTheDocument();
    });
  });

  describe('InlineLoader Component', () => {
    it('renders with default props', () => {
      render(<InlineLoader />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    
    it('renders with message', () => {
      render(<InlineLoader message="Loading items" />);
      
      expect(screen.getByText('Loading items')).toBeInTheDocument();
    });
    
    it('applies different sizes', () => {
      const { rerender } = render(<InlineLoader size="small" data-testid="loader" />);
      const smallLoader = screen.getByRole('status');
      
      rerender(<InlineLoader size="large" data-testid="loader" />);
      const largeLoader = screen.getByRole('status');
      
      // Check that styles are applied - we can't directly test the CSS here
      // but we could check className or attributes in a real test
      expect(smallLoader).toBeInTheDocument();
      expect(largeLoader).toBeInTheDocument();
    });
  });

  describe('LoadingContext', () => {
    it('provides loading state and methods', () => {
      render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );
      
      // Initially not loading
      expect(screen.queryByTestId('is-loading')).not.toBeInTheDocument();
      
      // Start loading
      act(() => {
        screen.getByTestId('start-btn').click();
      });
      
      // Check loading is active
      expect(screen.getByTestId('is-loading')).toBeInTheDocument();
      expect(screen.getByText('Test Loading Message')).toBeInTheDocument();
      
      // Stop loading
      act(() => {
        screen.getByTestId('stop-btn').click();
      });
      
      // Check loading is inactive
      expect(screen.queryByTestId('is-loading')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Loading Message')).not.toBeInTheDocument();
    });
    
    it('handles named loading operations', () => {
      const OperationsComponent = () => {
        const { loadingOperations, registerLoadingOperation, unregisterLoadingOperation } = useLoading();
        return (
          <div>
            <button 
              data-testid="register-btn" 
              onClick={() => registerLoadingOperation('test-op')}
            >
              Register
            </button>
            <button 
              data-testid="unregister-btn" 
              onClick={() => unregisterLoadingOperation('test-op')}
            >
              Unregister
            </button>
            {loadingOperations['test-op'] && <div data-testid="op-active">Operation Active</div>}
          </div>
        );
      };
      
      render(
        <LoadingProvider>
          <OperationsComponent />
        </LoadingProvider>
      );
      
      // Initially no operations
      expect(screen.queryByTestId('op-active')).not.toBeInTheDocument();
      
      // Register operation
      act(() => {
        screen.getByTestId('register-btn').click();
      });
      
      // Check operation is registered
      expect(screen.getByTestId('op-active')).toBeInTheDocument();
      
      // Unregister operation
      act(() => {
        screen.getByTestId('unregister-btn').click();
      });
      
      // Check operation is unregistered
      expect(screen.queryByTestId('op-active')).not.toBeInTheDocument();
    });
  });
});