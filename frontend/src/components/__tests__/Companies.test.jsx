import React from 'react';
import { screen } from '@testing-library/react';
import { vi } from 'vitest';
vi.mock('react-i18next', async () => {
  const mod = await import('react-i18next');
  return {
    ...mod,
    useTranslation: () => ({ t: (key) => key })
  };
});
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import Companies from '../../components/Companies';

describe('Companies', () => {
  it('renders companies list', async () => {
    renderWithProviders(<Companies />);
    expect(await screen.findByText(/Companies/i)).toBeInTheDocument();
    expect(await screen.findByText(/EcoRecycle/i)).toBeInTheDocument();
    expect(await screen.findByText(/GreenFuture/i)).toBeInTheDocument();
  });
});


