import { render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import * as api from "../../services/api";
import i18n from "../../i18n";
import { I18nextProvider } from 'react-i18next';
import Pickup from './Pickup'; // Assuming the Pickup component is in the same directory level

vi.mock("../../services/api");

describe("Pickup Screen Integration", () => {
  it("renders pickups and creates new pickup", async () => {
    api.getPickups.mockImplementationOnce(() => Promise.resolve([
      { id: 1, type: "plastic", location: "Home" },
    ]));
    api.createPickup.mockImplementationOnce(() => Promise.resolve({
      id: 2,
      type: "paper",
      location: "Office",
    }));

    render(
      <I18nextProvider i18n={i18n}>
        <Pickup />
      </I18nextProvider>
    );

  expect(await screen.findByText(/Loading/i)).toBeInTheDocument();
  expect(await screen.findByText(/plastic/i)).toBeInTheDocument();

  await userEvent.click(await screen.findByText(/Request Now/i));
  expect(await screen.findByText(/paper/i)).toBeInTheDocument();
  });
});


