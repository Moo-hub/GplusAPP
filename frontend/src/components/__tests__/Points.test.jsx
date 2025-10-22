import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import Points from '../Points';

// Mock the points API so getPoints is a vi.fn()
vi.mock('../../api/points', () => ({
  getPoints: vi.fn(),
  default: vi.fn(),
}));

import * as pointsApi from '../../api/points';

describe('Points', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially', async () => {
  const inst = i18next.createInstance(); inst.init({ lng: 'en', resources: { en: { translation: {} } }, initImmediate: false });
  if (typeof globalThis !== 'undefined') globalThis.__TEST_I18N__ = inst;
  // Make getPoints return a pending promise so the Loading state remains
  let _resolve; const pending = new Promise(() => {});
  // Use the mocked module's function which is a vi.fn()
  pointsApi.getPoints.mockImplementationOnce(() => pending);
    render(
      <I18nextProvider i18n={inst}>
        <Points />
      </I18nextProvider>
    );
    // Use getByText synchronously as the loading node should be present immediately
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error if API fails', async () => {
  // Use mockRejectedValueOnce so the rejection is controlled by vi and
  // does not create a global unhandled rejection before the test attaches
  // handlers.
  pointsApi.getPoints.mockRejectedValueOnce(new Error('fail'));
    const instErr = i18next.createInstance(); instErr.init({ lng: 'en', resources: { en: { translation: {} } }, initImmediate: false });
    if (typeof globalThis !== 'undefined') globalThis.__TEST_I18N__ = instErr;
    render(
      <I18nextProvider i18n={instErr}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/failed to load points/i)).toBeInTheDocument();
  });

  it('shows total points and rewards', async () => {
  pointsApi.getPoints.mockImplementationOnce(() => Promise.resolve({ total: 100, rewards: ['Reward1'] }));
    const instOk = i18next.createInstance(); instOk.init({ lng: 'en', resources: { en: { translation: {} } }, initImmediate: false });
    if (typeof globalThis !== 'undefined') globalThis.__TEST_I18N__ = instOk;
    render(
      <I18nextProvider i18n={instOk}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/100/)).toBeInTheDocument();
    expect(await screen.findByText(/Reward1/)).toBeInTheDocument();
  });

  it('shows "No rewards found" if rewards is empty', async () => {
  pointsApi.getPoints.mockImplementationOnce(() => Promise.resolve({ total: 0, rewards: [] }));
    const instEmpty = i18next.createInstance(); instEmpty.init({ lng: 'en', resources: { en: { translation: {} } }, initImmediate: false });
    if (typeof globalThis !== 'undefined') globalThis.__TEST_I18N__ = instEmpty;
    render(
      <I18nextProvider i18n={instEmpty}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/no rewards found/i)).toBeInTheDocument();
  });

  it('shows rewards value if not array', async () => {
  pointsApi.getPoints.mockImplementationOnce(() => Promise.resolve({ total: 0, rewards: 'SpecialReward' }));
    const instSingle = i18next.createInstance(); instSingle.init({ lng: 'en', resources: { en: { translation: {} } }, initImmediate: false });
    if (typeof globalThis !== 'undefined') globalThis.__TEST_I18N__ = instSingle;
    render(
      <I18nextProvider i18n={instSingle}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/SpecialReward/)).toBeInTheDocument();
  });
});


