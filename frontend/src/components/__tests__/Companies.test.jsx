// ...existing code...
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';

import Companies from '../Companies';
import Card from '../Card';
describe('Companies', () => {
  it('renders companies list', async () => {
    renderWithProviders(<Companies />);
    expect(await screen.findByText(/Companies/i)).toBeInTheDocument();
    expect(await screen.findByText(/EcoRecycle/i)).toBeInTheDocument();
    expect(await screen.findByText(/GreenFuture/i)).toBeInTheDocument();
  });
});


