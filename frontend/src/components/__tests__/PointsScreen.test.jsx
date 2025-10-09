import PointsScreen from '../screens/PointsScreen';
import { runGenericScreenTests } from '../../test-utils';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

runGenericScreenTests(PointsScreen, {
  successKey: 'points.title',
  emptyKey: 'points.empty',
  errorKey: 'points.error',
});

// Unit tests for PointsScreen props and apiCall transformation
vi.mock('../../services/api', () => ({
  getPoints: vi.fn(),
}));
import { getPoints } from '../../services/api';

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
    getPoints.mockResolvedValueOnce({ rewards: ['Gold', 'Silver'] });
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



