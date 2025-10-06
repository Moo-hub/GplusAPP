import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { vi } from 'vitest';
import i18n from '../../i18n';
import Points from '../Points';

// Mock the points API so getPoints is a vi.fn()
vi.mock('../../api/points', () => ({
  getPoints: vi.fn(),
  default: vi.fn(),
}));

import { getPoints } from '../../api/points';

describe('Points', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error if API fails', async () => {
  getPoints.mockImplementationOnce(() => Promise.reject(new Error('fail')));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/failed to load points/i)).toBeInTheDocument();
  });

  it('shows total points and rewards', async () => {
  getPoints.mockImplementationOnce(() => Promise.resolve({ total: 100, rewards: ['Reward1'] }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/100/)).toBeInTheDocument();
    expect(await screen.findByText(/Reward1/)).toBeInTheDocument();
  });

  it('shows "No rewards found" if rewards is empty', async () => {
  getPoints.mockImplementationOnce(() => Promise.resolve({ total: 0, rewards: [] }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/no rewards found/i)).toBeInTheDocument();
  });

  it('shows rewards value if not array', async () => {
  getPoints.mockImplementationOnce(() => Promise.resolve({ total: 0, rewards: 'SpecialReward' }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/SpecialReward/)).toBeInTheDocument();
  });
});


