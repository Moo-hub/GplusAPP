import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock services BEFORE importing component
vi.mock('../../services/api', () => ({
  getVehicles: vi.fn(),
}));
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import VehiclesScreen from '../screens/VehiclesScreen';
import { getVehicles } from '../../services/api';

describe('VehiclesScreen DOM scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading indicator', () => {
  getVehicles.mockImplementation(() => new Promise(() => {}));
    render(<VehiclesScreen />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByTestId('loading')).toHaveTextContent(/loading/i);
  });

  it('shows vehicles data when API succeeds', async () => {
  getVehicles.mockResolvedValueOnce({
      data: [
        { id: 1, name: 'Truck A', location: 'Cairo', price: 10000, balance: 500, rewards: ['Gold'] },
        { id: 2, name: 'Truck B', location: 'Giza', price: 12000, balance: 250, rewards: ['Silver'] }
      ]
    });
    render(<VehiclesScreen />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
  const items = screen.getAllByTestId('item');
  expect(items.length).toBe(2);
  // Check each field separately for first item
  expect(within(items[0]).getByTestId('item-name').textContent).toBe('Truck A');
  expect(within(items[0]).getByTestId('item-location').textContent).toBe('Cairo');
  expect(within(items[0]).getByTestId('item-price').textContent).toBe('10000');
  expect(within(items[0]).getByTestId('item-balance').textContent).toBe('500');
  expect(within(items[0]).getByTestId('item-rewards').textContent).toBe('Gold');
  // Check each field separately for second item
  expect(within(items[1]).getByTestId('item-name').textContent).toBe('Truck B');
  expect(within(items[1]).getByTestId('item-location').textContent).toBe('Giza');
  expect(within(items[1]).getByTestId('item-price').textContent).toBe('12000');
  expect(within(items[1]).getByTestId('item-balance').textContent).toBe('250');
  expect(within(items[1]).getByTestId('item-rewards').textContent).toBe('Silver');
  });

  it('shows empty state when vehicles is empty', async () => {
  getVehicles.mockResolvedValueOnce({ data: [] });
    render(<VehiclesScreen />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
    const emptyNode = screen.getByTestId('empty');
  expect(emptyNode).toBeInTheDocument();
  expect(emptyNode.textContent).toMatch(/no_vehicles_found|vehicles.empty|empty/i);
  });

  it('shows error state when API fails', async () => {
  getVehicles.mockRejectedValueOnce(new Error('API Error'));
    render(<VehiclesScreen />);
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });
    const errorNode = screen.getByTestId('error');
  expect(errorNode).toBeInTheDocument();
  expect(errorNode.textContent).toMatch(/error|something went wrong|vehicles.error|api error/i);
  });
});



