import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import * as api from "../../services/api";

// Ensure api.getPickups and api.createPickup are vi.fn()
api.getPickups = vi.fn();
api.createPickup = vi.fn();
import i18n from "../../i18n";
import { I18nextProvider } from 'react-i18next';
import Pickup from './Pickup'; // Assuming the Pickup component is in the same directory level

vi.mock("../../services/api");

describe("Pickup Screen Integration", () => {
  let getPickupsMock, createPickupMock;
  beforeEach(() => {
    vi.clearAllMocks();
    getPickupsMock = vi.spyOn(api, 'getPickups');
    createPickupMock = vi.spyOn(api, 'createPickup');
  });

  it("renders pickups and creates new pickup", async () => {
    // Mock getPickups to return a pickup
    getPickupsMock.mockResolvedValueOnce([
      { id: 1, type: "plastic", location: "Home" },
    ]);
    createPickupMock.mockResolvedValueOnce({
      id: 2,
      type: "paper",
      location: "Office",
    });

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <Pickup />
      </I18nextProvider>
    );

    // Loading indicator should be rendered on first paint
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for the pickups list to render
    await screen.findByText(/plastic/i);

    fireEvent.click(await screen.findByText(/Request Now/i));
    await screen.findByText(/paper/i);
  });

  it("handles empty pickups list", async () => {
    getPickupsMock.mockResolvedValueOnce([]);
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <Pickup />
      </I18nextProvider>
    );
    await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
  });

  it("handles API error gracefully", async () => {
    getPickupsMock.mockRejectedValueOnce(new Error('Server error'));
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <Pickup />
      </I18nextProvider>
    );
    await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
  });
});


