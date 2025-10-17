import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

describe('Vehicles', () => {
  it('renders vehicles list', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Vehicles />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Vehicles/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck 1/i)).toBeInTheDocument();
    expect(await screen.findByText(/Truck 2/i)).toBeInTheDocument();
  });
});


