import React from 'react';
import { render, screen, act } from '@testing-library/react';
import GlobalLoadingIndicator from '../components/GlobalLoadingIndicator';
import { apiCallsInProgress } from '../services/api';

// Mock the apiCallsInProgress Set
jest.mock('../services/api', () => ({
  apiCallsInProgress: new Set()
}));

describe('GlobalLoadingIndicator', () => {
  beforeEach(() => {
    // Clear any mocked timers and intervals
    jest.useRealTimers();
    // Clear the apiCallsInProgress Set
    apiCallsInProgress.clear();
  });
  
  test('renders the loading indicator', () => {
    render(<GlobalLoadingIndicator />);
    const loadingElement = screen.getByRole('progressbar');
    expect(loadingElement).toBeInTheDocument();
    expect(loadingElement).toHaveAttribute('aria-hidden', 'true');
  });
  
  test('shows loading state when API calls are in progress', () => {
    jest.useFakeTimers();
    
    render(<GlobalLoadingIndicator />);
    
    // Add an API call to the in-progress set
    act(() => {
      apiCallsInProgress.add('get:/api/test');
      jest.advanceTimersByTime(150); // Advance past the 100ms interval check
    });
    
    const loadingElement = screen.getByRole('progressbar');
    expect(loadingElement).toHaveAttribute('aria-hidden', 'false');
  });
  
  test('hides loading state when API calls complete', () => {
    jest.useFakeTimers();
    
    render(<GlobalLoadingIndicator />);
    
    // Add an API call and then remove it
    act(() => {
      apiCallsInProgress.add('get:/api/test');
      jest.advanceTimersByTime(150);
    });
    
    const loadingElementBefore = screen.getByRole('progressbar');
    expect(loadingElementBefore).toHaveAttribute('aria-hidden', 'false');
    
    act(() => {
      apiCallsInProgress.clear();
      jest.advanceTimersByTime(150);
      jest.advanceTimersByTime(350); // Additional time for the hide delay
    });
    
    const loadingElementAfter = screen.getByRole('progressbar');
    expect(loadingElementAfter).toHaveAttribute('aria-hidden', 'true');
  });
  
  test('cleans up timers on unmount', () => {
    jest.useFakeTimers();
    jest.spyOn(window, 'clearInterval');
    jest.spyOn(window, 'clearTimeout');
    
    const { unmount } = render(<GlobalLoadingIndicator />);
    
    act(() => {
      apiCallsInProgress.add('get:/api/test');
      jest.advanceTimersByTime(150);
    });
    
    unmount();
    
    expect(clearInterval).toHaveBeenCalled();
    
    // Clean up the API call
    apiCallsInProgress.clear();
  });
});