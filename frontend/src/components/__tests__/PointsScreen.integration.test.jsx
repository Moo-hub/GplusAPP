import { screen, waitFor } from '@testing-library/react';
import { server } from '../../mocks/server';
import { rest } from 'msw';
import PointsScreen from '../screens/PointsScreen';
import { customRender } from '../../test-utils';

describe('PointsScreen Integration', () => {
  it('fetches and displays points balance', async () => {
    customRender(<PointsScreen />);
    expect(await screen.findByText(/200/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    server.use(
      rest.get('/api/points', (req, res, ctx) => res(ctx.status(500)))
    );
    customRender(<PointsScreen />);
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});