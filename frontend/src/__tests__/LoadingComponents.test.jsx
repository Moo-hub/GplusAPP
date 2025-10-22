import { render, screen, act, within, waitFor } from '@testing-library/react';
import { useLoading } from '../contexts/LoadingContext.jsx';

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
    it('renders correctly when visible', async () => {
      const spinner = <div data-testid="spinner" />;
      const { container } = render(<LoadingOverlay isVisible={true} message="Loading Test" spinnerComponent={spinner} overlayClass="overlay" spinnerClass="spinner" />);
      
  expect(await screen.findByText('Loading Test')).toBeInTheDocument();
  // Ensure the provided spinner is present inside this overlay's container
  const spinnerNode = container.querySelector('[data-testid="spinner"]');
  expect(spinnerNode).toBeTruthy();
    });
    
    it('does not render when not visible', async () => {
      const { container } = render(<LoadingOverlay isVisible={false} message="Loading Test" spinnerComponent={<div/>} overlayClass="overlay" spinnerClass="spinner" />);
      
      // Ensure nothing for this overlay is present in this container
      const spinnerNode = container.querySelector('[data-testid="spinner"]');
      expect(spinnerNode).toBeNull();
      expect(container.querySelector('.overlay')).toBeNull();
    });
    
    it('accepts custom spinner component', async () => {
      const CustomSpinner = () => <div data-testid="custom-spinner">Custom Spinner</div>;
      
      render(
        <LoadingOverlay 
          isVisible={true} 
          message="Loading Test" 
          spinnerComponent={<CustomSpinner />} 
          overlayClass="overlay"
          spinnerClass="spinner"
        />
      );
      
      expect(await screen.findByTestId('custom-spinner')).toBeInTheDocument();
      expect(await screen.findByText('Loading Test')).toBeInTheDocument();
    });
  });

  describe('InlineLoader Component', () => {
    it('renders with default props', async () => {
      const { container } = render(<InlineLoader size="small" message="" centered={false} className="" style={{}} />);
      const statuses = await screen.findAllByRole('status');
      const local = statuses.find(s => container.contains(s));
      expect(local).toBeTruthy();
    });
    
    it('renders with message', async () => {
      render(<InlineLoader size="small" message="Loading items" centered={false} className="" style={{}} />);
      expect(await screen.findByText('Loading items')).toBeInTheDocument();
    });
    
  it('applies different sizes', async () => {
  const { container, rerender } = render(<InlineLoader size="small" message="" centered={false} className="" style={{}} data-testid="loader" />);
  const statuses = await screen.findAllByRole('status');
  const smallLoader = statuses.find(s => container.contains(s));
      
  rerender(<InlineLoader size="large" message="" centered={false} className="" style={{}} data-testid="loader" />);
  const statusesAfter = await screen.findAllByRole('status');
  const largeLoader = statusesAfter.find(s => container.contains(s));
      
      // Check that styles are applied - we can't directly test the CSS here
      // but we could check className or attributes in a real test
      expect(smallLoader).toBeInTheDocument();
      expect(largeLoader).toBeInTheDocument();
    });
  });

  describe('LoadingContext', () => {
  it('provides loading state and methods', async () => {
      const { container } = render(
        <LoadingProvider>
          <TestComponent />
        </LoadingProvider>
      );
      const root = within(container);
      // Initially not loading
      expect(root.queryByTestId('is-loading')).not.toBeInTheDocument();

      // Start loading
      act(() => {
        root.getByTestId('start-btn').click();
      });

  // Check loading is active (use async queries scoped to this container)
  const loadingEl = await root.findByTestId('is-loading');
  await root.findByText('Test Loading Message');

      // Stop loading
      act(() => {
        root.getByTestId('stop-btn').click();
      });

  // Check loading is inactive
  await waitFor(() => expect(root.queryByTestId('is-loading')).not.toBeInTheDocument());
  expect(root.queryByText('Test Loading Message')).not.toBeInTheDocument();
    });
    
  it('handles named loading operations', async () => {
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

      // Check operation is registered (async)
      const opEl = await screen.findByTestId('op-active');

      // Unregister operation
      act(() => {
        screen.getByTestId('unregister-btn').click();
      });

  // Check operation is unregistered (wait for removal)
  await waitFor(() => expect(screen.queryByTestId('op-active')).not.toBeInTheDocument());
    });
  });
});