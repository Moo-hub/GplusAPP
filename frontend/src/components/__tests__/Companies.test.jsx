import { vi } from 'vitest';
// Ensure react-i18next is mocked early for this suite to avoid import-time
// failures where modules call i18n.getFixedT during initialization.
try { vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => (typeof k === 'string' ? k : k), i18n: { getFixedT: () => (kk) => (typeof kk === 'string' ? kk : kk) } }), I18nextProvider: ({ children }) => children })); } catch (e) {}
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';

describe('Companies', () => {
  it('renders companies list', async () => {
    renderWithProviders(<Companies />);
    expect(await screen.findByText(/Companies/i)).toBeInTheDocument();
    expect(await screen.findByText(/EcoRecycle/i)).toBeInTheDocument();
    expect(await screen.findByText(/GreenFuture/i)).toBeInTheDocument();
  });
});


