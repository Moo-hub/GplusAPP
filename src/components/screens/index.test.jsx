import { render, screen, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
// Ensure the API is mockable and has all functions used in tests
import { vi } from 'vitest';
vi.mock('../../api', () => ({
  getPickups: vi.fn(),
  getPickupSchedule: vi.fn(),
  getVehicles: vi.fn(),
  getPoints: vi.fn(),
  getCompanies: vi.fn(),
  getPaymentMethods: vi.fn(),
}));
import * as api from '../../api';
import PickupScreen from "./PickupScreen";
import PickupScheduleScreen from "./PickupScheduleScreen";
import VehiclesScreen from "./VehiclesScreen";
import PointsScreen from "./PointsScreen";
import CompaniesScreen from "../../screens/Companies/CompaniesScreen";
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
      api[apiCall].mockResolvedValue([]);
      const { container } = render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      // Wait for a loading indicator inside this component's container
      await within(container).findByText(/loading/i);
    });
    it(`${apiCall} - empty`, async () => {
      api[apiCall].mockResolvedValue([]);
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      await waitFor(() => expect(screen.getByText(empty)).toBeInTheDocument());
    });
    it(`${apiCall} - error`, async () => {
      api[apiCall].mockRejectedValue(new Error("API Error"));
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      await waitFor(() => expect(screen.getByText(fail)).toBeInTheDocument());
    });
  });
});

