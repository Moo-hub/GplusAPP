// import React from 'react'; // Remove duplicate React import
import { render, screen, fireEvent, within } from "@testing-library/react";
import * as api from "../../services/api";
import i18next from 'i18next';
import Pickup from '../Pickup';
import { I18nextProvider } from 'react-i18next';
// point to the component one level up

vi.mock("../../services/api");

describe("Pickup Screen Integration", () => {
  it("renders pickups and creates new pickup", async () => {
    // Create a controllable promise so Loading can be asserted before resolution
    let resolveGetPickups;
    const getPickupsPromise = new Promise((res) => { resolveGetPickups = res; });
    vi.spyOn(api, 'getPickups').mockImplementationOnce(() => getPickupsPromise);
    vi.spyOn(api, 'createPickup').mockResolvedValueOnce({ id: 2, type: 'paper', location: 'Office' });

    const instance = i18next.createInstance();
    instance.init({ lng: 'en', resources: { en: { translation: {} } }, initImmediate: false, interpolation: { escapeValue: false } });
    if (typeof globalThis !== 'undefined') globalThis.__TEST_I18N__ = instance;
    const { container } = render(
      <I18nextProvider i18n={instance}>
        <Pickup />
      </I18nextProvider>
    );

    // Loading indicator inside this component (scoped)
    const loadingNode = await within(container).findByText(/loading/i);
    expect(loadingNode).toBeInTheDocument();

  // Resolve getPickups with data and wait for the pickups list to render
  resolveGetPickups([{ id: 1, type: 'plastic', location: 'Home' }]);
  await screen.findByText(/plastic/i);

  fireEvent.click(await screen.findByText(/Request Now/i));
  await screen.findByText(/paper/i);
  });
});


