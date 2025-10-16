import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EnvironmentalDashboardView } from '../EnvironmentalDashboardView';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

describe('EnvironmentalDashboardView', () => {
  it('renders Learn more button using i18n key', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <EnvironmentalDashboardView loading={false} error={null} />
      </I18nextProvider>
    );

    expect(screen.getByRole('button', { name: /Learn more|اعرف المزيد/ })).toBeInTheDocument();
  });
});
