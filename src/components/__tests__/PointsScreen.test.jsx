import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Mock services BEFORE importing the component under test
vi.mock('../../services/api', () => ({
  getPoints: vi.fn(),
}));
import React from 'react';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PointsScreen from '../screens/PointsScreen';
import { runGenericScreenTests } from '../../test-utils';
import { getPoints } from '../../services/api';


describe('PointsScreen DOM scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator', () => {
    render(<PointsScreen />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('shows points data when API succeeds', async () => {
    getPoints.mockResolvedValueOnce({ rewards: ['Gold', 'Silver'] });
    render(<PointsScreen />);
    await waitFor(() => expect(screen.getByText('Gold')).toBeInTheDocument());
    expect(screen.getByText('Silver')).toBeInTheDocument();
  });

  it('shows empty state when rewards is empty', async () => {
    getPoints.mockResolvedValueOnce({ rewards: [] });
    render(<PointsScreen />);
    await waitFor(() => expect(screen.getByTestId('empty')).toBeInTheDocument());
  });

  it('shows error state when API fails', async () => {
    getPoints.mockRejectedValueOnce(new Error('Server error'));
    render(<PointsScreen />);
    await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});

runGenericScreenTests(PointsScreen, {
  successKey: 'points.title',
  emptyKey: 'points.empty',
  errorKey: 'points.error',
});

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
    getPoints.mockResolvedValueOnce({ rewards: null });
    render(<PointsScreen />);
    const rows = await capturedProps.apiCall();
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0);
  });

  it('handles empty rewards array', async () => {
    getPoints.mockResolvedValueOnce({ rewards: [] });
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



