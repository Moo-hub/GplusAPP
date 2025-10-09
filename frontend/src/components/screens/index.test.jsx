import { render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from 'react-i18next';
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
      api[apiCall].mockImplementationOnce(() => Promise.resolve([]));
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      const loaders = await screen.findAllByText(/loading/i);
      expect(loaders.length).toBeGreaterThan(0);
    });
    it(`${apiCall} - empty`, async () => {
      api[apiCall].mockImplementationOnce(() => Promise.resolve([]));
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      // Wait until loading spinner is gone
      await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
      // Assert empty state via test id to avoid translation/string brittleness
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
    it(`${apiCall} - error`, async () => {
      api[apiCall].mockImplementationOnce(() => Promise.reject(new Error("API Error")));
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      // Wait until loading spinner is gone
      await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());
      // Assert error state via test id
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });
});

