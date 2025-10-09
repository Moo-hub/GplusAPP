import { screen, waitFor } from '@testing-library/react';
import * as api from '../../services/api';
import { customRender } from '../../test-utils';
import VehiclesScreen from '../screens/VehiclesScreen';

describe('VehiclesScreen Integration', () => {
  it('fetches and displays vehicles from API', async () => {
    customRender(<VehiclesScreen />);
    expect(await screen.findByText(/Truck A/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck B/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Force the vehicles API to reject so the UI shows the error state.
    // Prefer spying on the service layer rather than using server.use which
    // can be fragile across msw copies in the test environment.
    vi.spyOn(api, 'getVehicles').mockRejectedValue(new Error('Server error'));
    customRender(<VehiclesScreen />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});

