import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from 'react-i18next';
import i18n from "../../i18n/i18n";
import RequestPickupScreen from "../../screens/RequestPickup/RequestPickupScreen";
import PickupRequestForm from "../../components/PickupRequestForm";
import api from "../../services/api";
import { toast } from "react-toastify";

// Mock dependencies
vi.mock("../../services/api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock("../../api/pickup", () => ({
  requestPickup: vi.fn().mockImplementation(() => 
    Promise.resolve({
      success: true,
      requestId: "REQ-12345",
      estimatedTime: "30 minutes"
    })
  )
}));

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
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/request-pickup" element={<RequestPickupScreen />} />
              <Route path="/pickups" element={<div data-testid="pickups-list">Pickups List</div>} />
              <Route path="/pickup-form" element={<PickupRequestForm />} />
            </Routes>
          </MemoryRouter>
        </I18nextProvider>
      </QueryClientProvider>
    )
  };
};

describe("Pickup Request Workflow Integration Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it("allows a user to request a pickup with minimal information", async () => {
    const { user } = setupTest();
    
    // Initial screen should show request button
    expect(screen.getByText(/Schedule a waste pickup easily with one click/i)).toBeInTheDocument();
    
    // Click the request button
    await user.click(screen.getByText("Request Now"));
    
    // Should show loading state
    expect(screen.getByText("Requesting...")).toBeInTheDocument();
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Pickup Requested!/i)).toBeInTheDocument();
      expect(screen.getByText(/Request ID: REQ-12345/i)).toBeInTheDocument();
      expect(screen.getByText(/Estimated arrival: 30 minutes/i)).toBeInTheDocument();
    });
    
    // Should show option to request another
    expect(screen.getByText("Request Another")).toBeInTheDocument();
  });
  
  it("shows error message when pickup request fails", async () => {
    // Override the mock for this test
    vi.mock("../../api/pickup", () => ({
      requestPickup: vi.fn().mockImplementation(() => 
        Promise.reject(new Error("Network error"))
      )
    }), { virtual: true });
    
    const { user } = setupTest();
    
    // Click the request button
    await user.click(screen.getByText("Request Now"));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
  
  it("completes the full pickup request form workflow", async () => {
    // Mock API responses
    api.post.mockResolvedValue({ id: 1, status: "scheduled" });
    api.get.mockResolvedValue([{ id: 1, name: "Test Material" }]);
    
    // Start with PickupRequestForm
    const { user } = setupTest("/pickup-form");
    
    // Fill out the form
    // Select material
    const materialCheckbox = screen.getByLabelText(/plastic/i);
    await user.click(materialCheckbox);
    
    // Enter weight
    const weightInput = screen.getByLabelText(/weight estimate/i);
    await user.clear(weightInput);
    await user.type(weightInput, "10");
    
    // Set date
    const dateInput = screen.getByLabelText(/pickup date/i);
    // Get tomorrow's date in the correct format
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0] + "T12:00";
    fireEvent.change(dateInput, { target: { value: tomorrowString } });
    
    // Enter address
    const addressInput = screen.getByLabelText(/address/i);
    await user.type(addressInput, "123 Test Street, City");
    
    // Submit form
    await user.click(screen.getByText(/submit/i));
    
    // API should be called
    expect(api.post).toHaveBeenCalledWith("/pickup", expect.objectContaining({
      materials: ["plastic"],
      weight_estimate: "10",
      address: "123 Test Street, City"
    }));
    
    // Toast notification should be shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });
  
  it("validates the pickup request form before submission", async () => {
    const { user } = setupTest("/pickup-form");
    
    // Try to submit without filling the form
    await user.click(screen.getByText(/submit/i));
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/materials required/i)).toBeInTheDocument();
      expect(screen.getByText(/date required/i)).toBeInTheDocument();
      expect(screen.getByText(/address required/i)).toBeInTheDocument();
    });
    
    // API should not be called
    expect(api.post).not.toHaveBeenCalled();
  });
});