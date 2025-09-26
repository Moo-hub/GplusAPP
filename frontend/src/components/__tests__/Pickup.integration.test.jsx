import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as api from "../../services/api";
import i18n from "../../i18n";

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

    render(
      <I18nextProvider i18n={i18n}>
        <Pickup />
      </I18nextProvider>
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/plastic/i)).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Request Now/i));
    await waitFor(() => expect(screen.getByText(/paper/i)).toBeInTheDocument());
  });
});


