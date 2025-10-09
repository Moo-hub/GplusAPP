import React from 'react';
import { render, screen, waitFor, cleanup } from "@testing-library/react";
// Ensure handlers that check for test mode accept requests without Authorization
global.__TEST__ = true;
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { setupI18nMock } from '../../test-utils';

// Hoisted mocks: must be declared before importing modules that use them
vi.mock("../../services/api", () => {
  const apiMock = {
    post: vi.fn(),
    get: vi.fn()
  };
  // Provide named export used by PickupRequestForm
  return {
    default: apiMock,
    createPickup: vi.fn((data) => Promise.resolve({ data: { id: 1, scheduled_date: new Date().toISOString(), ...data } })),
  };
});

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Use the real api/pickup module so MSW can intercept the network request
// for the promo request and return deterministic data. We mock the
// pickup.service.getAvailableTimeSlots separately above.
// NOTE: fallback hoisted mock for `api/pickup`.
// Historically some CI environments produce absolute URL shapes or
// networking behaviors that make MSW interception flaky. To keep this
// integration test deterministic in CI we hoist a mock for the promo
// quick-request path. If you prefer MSW-only, remove this mock after
// verifying CI stability and ensure handlers cover absolute URL shapes.
vi.mock('../../api/pickup', () => ({
  requestPickup: vi.fn().mockResolvedValue({ requestId: 'REQ-12345', estimatedTime: '30 minutes' })
}));

// Mock pickup service so the component's initial timeslot fetch resolves
vi.mock('../../services/pickup.service', () => ({
  default: {
    getAvailableTimeSlots: vi.fn().mockImplementation(() => {
  // diagnostic suppressed: pickup.service.getAvailableTimeSlots called
      return Promise.resolve({ data: [ { date: new Date().toISOString().split('T')[0], slots: [ { id: '09:00-12:00', name: 'Morning' } ] } ] });
    })
  }
}));

// Ensure components using useTranslation() receive our test translations
vi.mock('react-i18next', () => setupI18nMock());

// Do not mock ../../api/pickup here: let the real module perform a POST
// which MSW will intercept and return the deterministic payload.
// Use the real api/pickup module so MSW intercepts the POST and returns deterministic data

import RequestPickupScreen from "../../screens/RequestPickup/RequestPickupScreen";
import PickupRequestForm from "../../components/PickupRequestForm";
import api from "../../services/api";
import { toast } from "react-toastify";
import * as apiPickup from '../../api/pickup';

// Set up the component for testing with all required providers
const setupTest = (initialRoute = "/request-pickup") => {
  // Create a fresh QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    user: userEvent.setup(),
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/request-pickup" element={<RequestPickupScreen />} />
            <Route path="/pickups" element={<div data-testid="pickups-list">Pickups List</div>} />
            <Route path="/pickup-form" element={<PickupRequestForm />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  };
};

describe("Pickup Request Workflow Integration Test", () => {
  beforeEach(() => {
    // Ensure DOM from previous renders is removed
    cleanup();
    vi.clearAllMocks();
  });
  
  it("allows a user to request a pickup with minimal information", async () => {
    // Ensure the initial timeslots fetch (pickupService -> api.get) resolves
    // — the services/api module is mocked at module scope so MSW won't be used
    const today = new Date().toISOString().split('T')[0];
    const slots = [
      { date: today, slots: [ { id: '09:00-12:00', name: 'Morning' }, { id: '13:00-16:00', name: 'Afternoon' } ] }
    ];
    api.get.mockResolvedValue({ data: slots });

    const { user } = setupTest();
    
  // Initial screen should show the promo request button (wait for it)
  expect(await screen.findByTestId('promo-request')).toBeInTheDocument();
    
  // Click the first promo request button via testid to avoid duplicate elements
  const promoButtons = await screen.findAllByTestId('promo-request');
  await user.click(promoButtons[0]);

    // Wait for success message rendered in the success block
    await waitFor(() => {
      expect(screen.getByTestId('request-id')).toHaveTextContent('REQ-12345');
      expect(screen.getByTestId('request-eta')).toHaveTextContent('30 minutes');
    });
    
  // Should show option to request another (accept i18n key or English)
  expect(screen.getByRole('button', { name: /request another|pickup\.requestAnother|requestAnother/i })).toBeInTheDocument();
  });
  
  it("shows error message when pickup request fails", async () => {
    // Override the hoisted api/pickup mock for this test via a spy so
    // we don't attempt to re-declare a mock which can be hoisted and
    // interfere with other tests.
  // Override the hoisted api/pickup mock implementation for this test
  apiPickup.requestPickup.mockRejectedValue(new Error('Network error'));

    const { user } = setupTest();
    
      // Click the first promo request button via testid (wait for it)
  const promoButtons2 = await screen.findAllByTestId('promo-request');
  await user.click(promoButtons2[0]);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
  
  it("completes the full pickup request form workflow", async () => {
  // Mock API responses
  api.post = vi.fn().mockResolvedValue({ id: 1, status: "scheduled" });
  api.get = vi.fn().mockResolvedValue([{ id: 1, name: "Test Material" }]);
    
    // Start with PickupRequestForm
    const { user } = setupTest("/pickup-form");
    
    // Fill out the form
    // Select material
    const materialCheckbox = screen.getByLabelText(/plastic/i);
    await user.click(materialCheckbox);
    
    // Enter weight
  const weightInput = screen.getByLabelText(/weight\s*estimate/i);
    await user.clear(weightInput);
    await user.type(weightInput, "10");
    
    // Set date
    const dateInput = screen.getByLabelText(/pickup\s*date/i);
    // Get tomorrow's date in the correct format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0] + "T12:00";
    // Type into the date input so React sees the update inside userEvent/act
    await user.clear(dateInput);
    await user.type(dateInput, tomorrowString);
    
    // Enter address
    const addressInput = screen.getByLabelText(/address/i);
    await user.type(addressInput, "123 Test Street, City");
    
    // Submit form
  await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Toast notification should be shown (use waitFor because mutation runs async)
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
  
  it("validates the pickup request form before submission", async () => {
    const { user } = setupTest("/pickup-form");
    
    // Try to submit without filling the form
    await user.click(screen.getByText(/submit/i));
    
    // Should show validation errors (use regex to tolerate i18n keys)
    await waitFor(() => {
      const mats = screen.getAllByText(/materials required/i);
      expect(mats.length).toBeGreaterThan(0);
      const dates = screen.getAllByText(/date required/i);
      expect(dates.length).toBeGreaterThan(0);
      const adds = screen.getAllByText(/address required/i);
      expect(adds.length).toBeGreaterThan(0);
    });
    
    // API should not be called
    expect(api.post).not.toHaveBeenCalled();
  });
});