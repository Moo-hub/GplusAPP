import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import { vi } from 'vitest';
import GlobalLoadingIndicator from '../components/GlobalLoadingIndicator.jsx';
import { apiCallsInProgress } from '../services/api';

// Mock the apiCallsInProgress Set using Vitest
vi.mock('../services/api', () => ({
  apiCallsInProgress: new Set()
}));

describe('GlobalLoadingIndicator', () => {
  beforeEach(() => {
    // Clear any mocked timers and intervals
    vi.useRealTimers();
    // Clear the apiCallsInProgress Set
    apiCallsInProgress.clear();
  });
  
  test('renders the loading indicator', () => {
    const { container } = render(<GlobalLoadingIndicator />);
    const loadingElement = within(container).getByRole('progressbar', { hidden: true });
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute('aria-hidden', 'true');
  });
  
  test('shows loading state when API calls are in progress', () => {
  vi.useFakeTimers();
    
    const { container } = render(<GlobalLoadingIndicator />);

    // Add an API call to the in-progress set
    act(() => {
      apiCallsInProgress.add('get:/api/test');
      vi.advanceTimersByTime(150); // Advance past the 100ms interval check
    });

    const loadingElement = within(container).getByRole('progressbar', { hidden: true });
    expect(loadingElement).toHaveAttribute('aria-hidden', 'false');
  });
  
  test('hides loading state when API calls complete', () => {
  vi.useFakeTimers();
    
    const { container } = render(<GlobalLoadingIndicator />);

    // Add an API call and then remove it
    act(() => {
      apiCallsInProgress.add('get:/api/test');
      vi.advanceTimersByTime(150);
    });

    const loadingElementBefore = within(container).getByRole('progressbar', { hidden: true });
    expect(loadingElementBefore).toHaveAttribute('aria-hidden', 'false');

    act(() => {
      apiCallsInProgress.clear();
      vi.advanceTimersByTime(150);
      vi.advanceTimersByTime(350); // Additional time for the hide delay
    });

    const loadingElementAfter = within(container).getByRole('progressbar', { hidden: true });
    expect(loadingElementAfter).toHaveAttribute('aria-hidden', 'true');
  });
  
  test('cleans up timers on unmount', () => {
  vi.useFakeTimers();
  vi.spyOn(window, 'clearInterval');
  vi.spyOn(window, 'clearTimeout');
    
    const { unmount } = render(<GlobalLoadingIndicator />);
    
    act(() => {
      apiCallsInProgress.add('get:/api/test');
      vi.advanceTimersByTime(150);
    });
    
    unmount();
    
  expect(window.clearInterval).toHaveBeenCalled();
    
    // Clean up the API call
    apiCallsInProgress.clear();
  });
});