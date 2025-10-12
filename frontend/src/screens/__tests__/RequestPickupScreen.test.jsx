import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestPickupScreen from '../RequestPickup/RequestPickupScreen';
import { requestPickup } from '../../api/pickup';

// Mock API module
jest.mock('../../api/pickup');

describe('RequestPickupScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows success message after successful request', async () => {
    // Setup mock response
    requestPickup.mockResolvedValue({
      success: true,
      requestId: 'REQ-1234',
      estimatedTime: '30 minutes'
    });

    render(<RequestPickupScreen />);
    
    // Click the request button
    await userEvent.click(screen.getByText('Request Now'));
    
    // Verify loading state
    expect(screen.getByText('Requesting...')).toBeInTheDocument();
    
    // Verify success appears
    await waitFor(() => {
      expect(screen.getByText('Pickup Requested!')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/REQ-1234/)).toBeInTheDocument();
    expect(screen.getByText(/30 minutes/)).toBeInTheDocument();
  });

  it('allows requesting another pickup after success', async () => {
    // Setup mock response
    requestPickup.mockResolvedValue({
      success: true,
      requestId: 'REQ-1234',
      estimatedTime: '30 minutes'
    });

    render(<RequestPickupScreen />);
    
    // Request first pickup
    await userEvent.click(screen.getByText('Request Now'));
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText('Pickup Requested!')).toBeInTheDocument();
    });
    
    // Request another
    await userEvent.click(screen.getByText('Request Another'));
    
    // Verify back to initial state
    expect(screen.getByText('Request Now')).toBeInTheDocument();
    expect(screen.queryByText('Pickup Requested!')).not.toBeInTheDocument();
  });
});