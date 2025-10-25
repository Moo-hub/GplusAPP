// import React from 'react'; // Remove duplicate React import
import { render, screen } from '@testing-library/react';
import Vehicles from '../Vehicles';
import { setupI18nMock } from '../../test-utils';
const getVehicles = vi.fn();
vi.mock('../../services/api', () => ({ getVehicles }));

describe('Vehicles', () => {
  it('renders vehicles list', async () => {
    getVehicles.mockResolvedValueOnce([{ id: 1, name: 'Truck 1' }, { id: 2, name: 'Truck 2' }]);
    const { useTranslation } = setupI18nMock({ Vehicles: 'Vehicles' });
    vi.mock('react-i18next', () => ({ useTranslation: () => useTranslation() }));
    render(<Vehicles />);
    expect(await screen.findByText(/Vehicles|vehicles/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck 1/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck 2/i)).toBeInTheDocument();
    getVehicles.mockReset();
  });
});


