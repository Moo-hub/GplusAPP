import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EnvironmentalDashboardView } from '../EnvironmentalDashboardView';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

describe('EnvironmentalDashboardView', () => {
  it('renders Learn more button using i18n key', () => {
    const handle = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <EnvironmentalDashboardView loading={false} error={null} onLearnMore={handle} />
      </I18nextProvider>
    );

    // The component sets aria-label="learn-more" for the button; assert by label
    const btn = screen.getByLabelText(/learn-more/);
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title');

    // simulate click and expect handler invoked
    btn.click();
    expect(handle).toHaveBeenCalledOnce();
  });
});
