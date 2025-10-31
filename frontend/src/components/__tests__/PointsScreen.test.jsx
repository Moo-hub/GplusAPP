import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Mock services BEFORE importing component under test
vi.mock('../../services/api', () => ({
  getPoints: vi.fn(),
}));
import React from 'react';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/react';
import PointsScreen from '../screens/PointsScreen';
import { runGenericScreenTests } from '../../test-utils';
import { getPoints } from '../../services/api';

describe('PointsScreen DOM', () => {
  it('shows points data when API succeeds', async () => {
    getPoints.mockResolvedValue({
      data: [
        { id: 1, name: 'Gold', balance: 500, rewards: ['Gold', 'Silver'], price: 100 },
        { id: 2, name: 'Silver', balance: 250, rewards: ['Silver'], price: 50 }
      ]
    });
    render(<PointsScreen />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
  const items = screen.getAllByTestId('item');
  expect(items.length).toBe(2);
  // Check each field separately for first item
  expect(within(items[0]).getByTestId('item-name').textContent).toBe('Gold');
  expect(within(items[0]).getByTestId('item-balance').textContent).toBe('500');
  expect(within(items[0]).getByTestId('item-rewards').textContent).toBe('Gold, Silver');
  expect(within(items[0]).getByTestId('item-price').textContent).toBe('100');
  // Check each field separately for second item
  expect(within(items[1]).getByTestId('item-name').textContent).toBe('Silver');
  expect(within(items[1]).getByTestId('item-balance').textContent).toBe('250');
  expect(within(items[1]).getByTestId('item-rewards').textContent).toBe('Silver');
  expect(within(items[1]).getByTestId('item-price').textContent).toBe('50');
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('shows loading indicator', () => {
    getPoints.mockImplementation(() => new Promise(() => {}));
    render(<PointsScreen />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toHaveTextContent(/loading/i);
  });

  it('shows empty state when data is empty', async () => {
    getPoints.mockResolvedValue({ data: [] });
    render(<PointsScreen />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
    const emptyNode = screen.getByTestId('empty');
    expect(emptyNode).toBeInTheDocument();
  expect(emptyNode).toHaveTextContent(/no\s*points\s*found|no\s*data|No Items Found|no_points_found/i);
  });

  it('shows error state when API fails', async () => {
    getPoints.mockRejectedValue(new Error('API Error'));
    render(<PointsScreen />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
    const errorNode = screen.getByTestId('error');
    expect(errorNode).toBeInTheDocument();
    expect(errorNode).toHaveTextContent(/API Error|Something went wrong|error/i);
  });
  it('shows points data when API succeeds (single object)', async () => {
    getPoints.mockResolvedValue({ data: [ { id: 1, name: 'Gold', balance: 500, rewards: ['Gold', 'Silver'], price: 100 } ] });
    render(<PointsScreen />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
  const items = screen.getAllByTestId('item');
  expect(items.length).toBe(1);
  expect(within(items[0]).getByTestId('item-name').textContent).toBe('Gold');
  expect(within(items[0]).getByTestId('item-balance').textContent).toBe('500');
  expect(within(items[0]).getByTestId('item-rewards').textContent).toBe('Gold, Silver');
  expect(within(items[0]).getByTestId('item-price').textContent).toBe('100');
  });
});

// runGenericScreenTests(PointsScreen, {});

// Unit tests for PointsScreen props and apiCall transformation

describe('PointsScreen', () => {
  let capturedProps;

  beforeEach(() => {
    capturedProps = undefined;
    vi.stubGlobal('GenericScreen', (props) => {
      capturedProps = props;
      return null;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('passes correct titleKey and emptyKey to GenericScreen', () => {
    render(<PointsScreen someProp="x" />);
    expect(capturedProps).toBeTruthy();
    expect(capturedProps.titleKey).toBe('points');
    expect(capturedProps.emptyKey).toBe('no_points_found');
    expect(capturedProps.someProp).toBe('x');
    expect(typeof capturedProps.apiCall).toBe('function');
  });

  it('transforms rewards array into [{id, name}] via apiCall', async () => {
    getPoints.mockResolvedValue({ rewards: ['Gold', 'Silver'] });
    render(<PointsScreen />);
    const rows = await capturedProps.apiCall();
    expect(rows).toEqual([
      { id: 0, name: 'Gold' },
      { id: 1, name: 'Silver' },
    ]);
    expect(getPoints).toHaveBeenCalledTimes(1);
  });

  it('returns [] when rewards is not an array', async () => {
    getPoints.mockResolvedValue({ rewards: null });
    render(<PointsScreen />);
    const rows = await capturedProps.apiCall();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0);
  });

  it('handles empty rewards array', async () => {
    getPoints.mockResolvedValue({ rewards: [] });
    render(<PointsScreen />);
    const rows = await capturedProps.apiCall();
    expect(rows).toEqual([]);
  });

  it('forwards extra props to GenericScreen', () => {
    const onRowClick = vi.fn();
    render(<PointsScreen pageSize={20} onRowClick={onRowClick} />);
    expect(capturedProps.pageSize).toBe(20);
    expect(capturedProps.onRowClick).toBe(onRowClick);
  });
});



