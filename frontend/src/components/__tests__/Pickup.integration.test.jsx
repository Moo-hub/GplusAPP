import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import * as api from "../../services/api";
import i18n from "../../i18n";
import { I18nextProvider } from 'react-i18next';
import Pickup from './Pickup'; // Assuming the Pickup component is in the same directory level

vi.mock("../../services/api");

describe("Pickup Screen Integration", () => {
  it("renders pickups and creates new pickup", async () => {
    api.getPickups.mockResolvedValueOnce([
      { id: 1, type: "plastic", location: "Home" },
    ]);
    api.createPickup.mockResolvedValueOnce({
      id: 2,
      type: "paper",
      location: "Office",
    });

    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <Pickup />
      </I18nextProvider>
    );

    // Loading indicator inside this component (scoped)
    const loadingNode = await within(container).findByText(/loading/i);
    expect(loadingNode).toBeInTheDocument();

    // Wait for the pickups list to render
    await screen.findByText(/plastic/i);

    fireEvent.click(await screen.findByText(/Request Now/i));
    await screen.findByText(/paper/i);
  });
});


