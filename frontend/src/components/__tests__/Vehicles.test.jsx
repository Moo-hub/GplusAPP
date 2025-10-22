import React from 'react';
import { render, screen } from '@testing-library/react';
import i18n from '../../i18n';
import Vehicles from '../Vehicles';
import { I18nextProvider } from 'react-i18next';
vi.mock('../../services/api', () => ({ getVehicles: vi.fn() }));
import * as api from '../../services/api';

describe('Vehicles', () => {
  it('renders vehicles list', async () => {
  api.getVehicles.mockResolvedValueOnce([{ id: 1, name: 'Truck 1' }, { id: 2, name: 'Truck 2' }]);
    render(
      <I18nextProvider i18n={i18n}>
        <Vehicles />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Vehicles/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck 1/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck 2/i)).toBeInTheDocument();
    api.getVehicles.mockReset();
  });
});


