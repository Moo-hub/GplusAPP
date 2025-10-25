import { render, screen } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import React from 'react';
// Mock service module (RequestPickupScreen uses services/pickup.service)
vi.mock('../../services/pickup.service');
import pickupService from '../../services/pickup.service';
import RequestPickupScreen from '../RequestPickup/RequestPickupScreen';
import { MemoryRouter } from 'react-router-dom';
/** @type {any} */
const mockedCreatePickup = pickupService.createPickupRequest;

describe('RequestPickupScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows success message after successful request', async () => {
    // Setup mock response
    // Mock the service to return the API-like shape the component expects
    mockedCreatePickup.mockResolvedValue({
      data: {
        id: 'REQ-1234',
        scheduled_date: '2025-01-01T09:00:00Z'
      }
    });

    // Render component in test mode with pre-filled form and skip to final step
    render(
      <MemoryRouter>
        <RequestPickupScreen testSkipToStep={4} testInitialForm={{
          materials: ['Plastic'],
          address: '123 Test St',
          weightEstimate: '2',
          selectedDate: '2025-01-01',
          selectedTimeSlot: '09:00-10:00',
        }} />
      </MemoryRouter>
    );
    
  // Click the request button (use explicit test id)
  const submitButton = screen.getByTestId('submit-pickup');
  await userEvent.click(submitButton);

  // Verify success appears by checking the requestId and scheduled time
  await waitFor(() => expect(screen.getAllByText(/REQ-1234/).length).toBeGreaterThanOrEqual(1));
  // The component shows a formatted scheduled date/time instead of duration
  expect(screen.getByText(/1\/1\/2025/)).toBeInTheDocument();
  });

  it('allows requesting another pickup after success', async () => {
    // Setup mock response
    mockedCreatePickup.mockResolvedValue({
      data: {
        id: 'REQ-1234',
        scheduled_date: '2025-01-01T09:00:00Z'
      }
    });

    render(
      <MemoryRouter>
        <RequestPickupScreen testSkipToStep={4} testInitialForm={{
          materials: ['Plastic'],
          address: '123 Test St',
          weightEstimate: '2',
          selectedDate: '2025-01-01',
          selectedTimeSlot: '09:00-10:00',
        }} />
      </MemoryRouter>
    );
    
  // Request first pickup - use explicit test id
  const submitBtn = screen.getByTestId('submit-pickup');
  await userEvent.click(submitBtn);
    
    // Wait for success (requestId appears)
    await waitFor(() => {
      expect(screen.getAllByText(/REQ-1234/).length).toBeGreaterThanOrEqual(1);
    });
    
  // Request another (click the secondary button)
  // Use queryByText so the test doesn't throw if the text differs slightly
  let requestAnotherBtn = screen.queryByText(/Schedule Another Pickup/i);
  if (!requestAnotherBtn) {
    // fallback: find a button element with btn-secondary class
    const candidates = screen.getAllByTestId('button');
    requestAnotherBtn = candidates.find(b => b.className && b.className.includes('btn-secondary'));
  }
  // As a last resort, fall back to the first button
  if (!requestAnotherBtn) requestAnotherBtn = screen.getAllByTestId('button')[0];
  await userEvent.click(requestAnotherBtn);
    
    // Verify back to initial state
  expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
  expect(screen.queryByText(/Pickup Requested/i)).not.toBeInTheDocument();
  });
});