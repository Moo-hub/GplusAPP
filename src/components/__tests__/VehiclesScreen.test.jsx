

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import VehiclesScreen from '../screens/VehiclesScreen';

vi.mock('../../services/api', () => ({
  getVehicles: vi.fn(),
}));
import { getVehicles } from '../../services/api';

describe('VehiclesScreen DOM scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator', () => {
    render(<VehiclesScreen />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows vehicles data when API succeeds', async () => {
    getVehicles.mockResolvedValueOnce([
      { name: 'Truck A', location: 'Cairo', price: 10000 },
      { name: 'Truck B', location: 'Giza', price: 12000 }
    ]);
    render(<VehiclesScreen />);
    await waitFor(() => expect(screen.getByText('Truck A (Cairo) - 10000')).toBeInTheDocument());
    expect(screen.getByText('Truck B (Giza) - 12000')).toBeInTheDocument();
  });

  it('shows empty state when vehicles is empty', async () => {
    getVehicles.mockResolvedValueOnce([]);
    render(<VehiclesScreen />);
    await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
  });

  it('shows error state when API fails', async () => {
    getVehicles.mockRejectedValueOnce(new Error('Server error'));
    render(<VehiclesScreen />);
    await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });
});



