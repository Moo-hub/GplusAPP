import { render, screen, waitFor } from "@testing-library/react";
import i18n from '../../i18n';
// Ensure the API is mockable and has all functions used in tests
import { vi } from 'vitest';
vi.mock('../../services/api', () => ({
  getPickups: vi.fn(),
  getPickupSchedule: vi.fn(),
  getVehicles: vi.fn(),
  getPoints: vi.fn(),
  getCompanies: vi.fn(),
  getPaymentMethods: vi.fn(),
}));
import * as api from '../../services/api';
import PickupScreen from "./PickupScreen";
import PickupScheduleScreen from "./PickupScheduleScreen";
import VehiclesScreen from "./VehiclesScreen";
import PointsScreen from "./PointsScreen";
import CompaniesScreen from "./CompaniesScreen";
import PaymentScreen from "./PaymentScreen";

describe("GPlus Screens Integration", () => {
  const screens = [
    { Component: PickupScreen, apiCall: "getPickups", empty: /no pickups/i, fail: /failed to load pickups/i },
    { Component: PickupScheduleScreen, apiCall: "getPickupSchedule", empty: /no pickups/i, fail: /failed to load pickups/i },
    { Component: VehiclesScreen, apiCall: "getVehicles", empty: /no vehicles/i, fail: /failed to load vehicles/i },
    { Component: PointsScreen, apiCall: "getPoints", empty: /no points/i, fail: /failed to load points/i },
    { Component: CompaniesScreen, apiCall: "getCompanies", empty: /no companies/i, fail: /failed to load companies/i },
    { Component: PaymentScreen, apiCall: "getPaymentMethods", empty: /no payment/i, fail: /failed to load payment/i },
  ];

  screens.forEach(({ Component, apiCall, empty, fail }) => {
    it(`${apiCall} - loading`, async () => {
      api[apiCall].mockResolvedValueOnce([]);
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      const loaders = await screen.findAllByText(/loading/i);
      expect(loaders.length).toBeGreaterThan(0);
    });
    it(`${apiCall} - empty`, async () => {
      api[apiCall].mockResolvedValueOnce([]);
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      // Wait until loading spinner is gone
      await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
      // Use the AllBy variant and assert there is at least one match to tolerate
      // React 18 StrictMode duplicate mounts in tests which can produce
      // multiple elements with the same test id. Asserting length > 0 is
      // robust against that behavior.
      const empties = await screen.findAllByTestId('empty');
      expect(empties.length).toBeGreaterThan(0);
    });
    it(`${apiCall} - error`, async () => {
      api[apiCall].mockRejectedValueOnce(new Error("API Error"));
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      // Wait until loading spinner is gone
      await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
      const errors = await screen.findAllByTestId('error');
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

