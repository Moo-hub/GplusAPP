import { screen, waitFor } from '@testing-library/react';
import { server } from '../../mocks/server';
import { rest } from 'msw';
import VehiclesScreen from '../screens/VehiclesScreen';
import { customRender } from '../../test-utils';

describe('VehiclesScreen Integration', () => {
  it('fetches and displays vehicles from API', async () => {
    customRender(<VehiclesScreen />);
    expect(await screen.findByText(/Truck A/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck B/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    server.use(
      rest.get('/api/vehicles', (req, res, ctx) => res(ctx.status(500)))
    );
    customRender(<VehiclesScreen />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});