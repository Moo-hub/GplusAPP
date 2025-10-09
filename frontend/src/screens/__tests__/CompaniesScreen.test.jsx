import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CompaniesScreen from '../Companies/CompaniesScreen';
import { getCompanies } from '../../api/companies';

// Mock API module
jest.mock('../../api/companies');

describe('CompaniesScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders companies list when API call succeeds', async () => {
    // Setup mock response
    getCompanies.mockResolvedValue([
      { id: 1, name: 'EcoCorp', icon: '🏢' },
      { id: 2, name: 'GreenTech', icon: '🌱' }
    ]);

    render(<CompaniesScreen />);

    // Check loading state first
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Verify data appears
    await waitFor(() => {
      expect(screen.getByText(/EcoCorp/)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/GreenTech/)).toBeInTheDocument();
  });

  it('shows empty state when API returns empty array', async () => {
    // Setup mock to return empty array
    getCompanies.mockResolvedValue([]);

    render(<CompaniesScreen />);

    // Verify empty message appears
    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
    
    expect(screen.getByText('No companies available')).toBeInTheDocument();
  });
});