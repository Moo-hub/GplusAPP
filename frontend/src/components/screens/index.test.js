import { render, screen, waitFor } from "@testing-library/react";
import PickupScreen from "./PickupScreen";
import PickupScheduleScreen from "./PickupScheduleScreen";
import VehiclesScreen from "./VehiclesScreen";
import PointsScreen from "./PointsScreen";
import CompaniesScreen from "./CompaniesScreen";
import PaymentScreen from "./PaymentScreen";
import * as api from "../../services/api";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";

jest.mock("../../services/api");

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
    it(`${apiCall} - loading`, () => {
      api[apiCall].mockResolvedValue([]);
      render(<I18nextProvider i18n={i18n}><Component darkMode={false} /></I18nextProvider>);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
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
