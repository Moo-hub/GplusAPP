import React from "react";
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import Vehicles from '../../components/Vehicles';

describe('Vehicles', () => {
  it('renders vehicles list', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Vehicles />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Vehicles/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck A/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck B/i)).toBeInTheDocument();
  });
});


