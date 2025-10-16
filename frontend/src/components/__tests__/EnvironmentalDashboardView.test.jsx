import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EnvironmentalDashboardView } from '../EnvironmentalDashboardView';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

describe('EnvironmentalDashboardView', () => {
  it('toggles aria-expanded on Learn more button and calls handler', () => {
    const handle = vi.fn();
    // Ensure the 'environmental' namespace is available in the i18n instance used by tests
    i18n.addResourceBundle('en', 'environmental', {
      cta: { learnMore: 'Learn more', learnMoreTip: 'Open details about environmental impact', learnMoreShort: 'Learn more about how recycling earns you +G points and helps the planet.' }
    }, true, true);

    render(
      <I18nextProvider i18n={i18n}>
        <EnvironmentalDashboardView
          loading={false}
          error={null}
          personalData={null}
          communityData={null}
          leaderboardData={[]}
          activeTab={'personal'}
          onTabChange={() => {}}
          timeRange={'7d'}
          onTimeRangeChange={() => {}}
          onLearnMore={handle}
        />
      </I18nextProvider>
    );

    // Query by role+name for accessibility
    const btn = screen.getByRole('button', { name: /learn more/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title');

    // Initially not expanded
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    // Click toggles expanded and calls handler
    fireEvent.click(btn);
    expect(handle).toHaveBeenCalledTimes(1);
    expect(btn).toHaveAttribute('aria-expanded', 'true');

    // The region should now be visible in the DOM
    const region = screen.getByRole('region', { hidden: true });
    expect(region).toBeInTheDocument();
    expect(region).not.toHaveAttribute('hidden');
  });
});
