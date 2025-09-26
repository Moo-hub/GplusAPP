import { render, screen } from '@testing-library/react';
import Companies from '../Companies';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

describe('Companies', () => {
  it('renders companies list', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Companies />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Companies/i)).toBeInTheDocument();
    expect(await screen.findByText(/EcoRecycle/i)).toBeInTheDocument();
    expect(await screen.findByText(/GreenFuture/i)).toBeInTheDocument();
  });
});
