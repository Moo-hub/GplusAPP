import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import Points from '../Points';
import i18n from '../../i18n';

// Mock the getPoints API
vi.mock('../../api/points', () => ({
  getPoints: vi.fn(),
}));
import { getPoints } from '../../api/points';

describe('Points', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading initially', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error if API fails', async () => {
    getPoints.mockRejectedValueOnce(new Error('fail'));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/failed to load points/i)).toBeInTheDocument();
  });

  it('shows total points and rewards', async () => {
    getPoints.mockResolvedValueOnce({ total: 100, rewards: ['Reward1'] });
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/100/)).toBeInTheDocument();
    expect(await screen.findByText(/Reward1/)).toBeInTheDocument();
  });

  it('shows "No rewards found" if rewards is empty', async () => {
    getPoints.mockResolvedValueOnce({ total: 0, rewards: [] });
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/no rewards found/i)).toBeInTheDocument();
  });

  it('shows rewards value if not array', async () => {
    getPoints.mockResolvedValueOnce({ total: 0, rewards: 'SpecialReward' });
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/SpecialReward/)).toBeInTheDocument();
  });
});
describe('Points component', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows loading state initially', () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => new Promise(() => {})
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.reject(new Error('fail'))
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Failed to load points/i)).toBeInTheDocument();
  });

  it('renders total points and rewards when API succeeds', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.resolve({ total: 42, rewards: ['Reward1', 'Reward2'] })
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/42/)).toBeInTheDocument();
    expect(screen.getByText(/Reward1, Reward2/)).toBeInTheDocument();
  });

  it('shows "No rewards found" if rewards array is empty', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.resolve({ total: 10, rewards: [] })
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/No rewards found/)).toBeInTheDocument();
  });

  it('renders rewards if rewards is not an array', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.resolve({ total: 5, rewards: 'Special Reward' })
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Special Reward/)).toBeInTheDocument();
  });
});
describe('Points UI rendering', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows loading state', () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => new Promise(() => {})
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('shows error state', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.reject(new Error('fail'))
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/Failed to load points/i)).toBeInTheDocument();
  });

  it('renders total points', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.resolve({ total: 123, rewards: [] })
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText('123')).toBeInTheDocument();
  });

  it('renders rewards as joined string', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.resolve({ total: 1, rewards: ['A', 'B'] })
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText('A, B')).toBeInTheDocument();
  });

  it('renders "No rewards found" if rewards is empty array', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.resolve({ total: 1, rewards: [] })
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/No rewards found/i)).toBeInTheDocument();
  });

  it('renders rewards if not array', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.resolve({ total: 1, rewards: 'Special' })
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText('Special')).toBeInTheDocument();
  });

  it('renders translated headings', async () => {
    vi.mock('../../api/points', () => ({
      getPoints: () => Promise.resolve({ total: 1, rewards: [] })
    }));
    render(
      <I18nextProvider i18n={i18n}>
        <Points />
      </I18nextProvider>
    );
    expect(await screen.findByText(/my_points/i)).toBeInTheDocument();
    expect(await screen.findByText(/rewards/i)).toBeInTheDocument();
  });
});
