import React from 'react';
import { vi } from 'vitest';
// Mock API module - use Vitest mocking (must be before importing components)
vi.mock('../../api/companies');
import { render, screen, waitFor } from '@testing-library/react';
import CompaniesScreen from '../Companies/CompaniesScreen';
import { getCompanies } from '../../api/companies';
/** @type {any} */
const mockedGetCompanies = getCompanies;

describe('CompaniesScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders companies list when API call succeeds', async () => {
  // Setup mock response (one-time)
  mockedGetCompanies.mockResolvedValueOnce([
      { id: 1, name: 'EcoCorp', icon: '🏢' },
      { id: 2, name: 'GreenTech', icon: '🌱' }
    ]);

  render(<CompaniesScreen apiCall={mockedGetCompanies} />);
    // loading indicator should show initially
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for the API mock to be called and the loading indicator to go away
    await waitFor(() => expect(mockedGetCompanies).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

    // Now assert the rendered company cards are present and contain the names
    const cards = await screen.findAllByTestId('card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    // assert that at least one card contains EcoCorp and one contains GreenTech
    const docText = cards.map(c => c.textContent).join(' ');
    expect(docText).toMatch(/EcoCorp/);
    expect(docText).toMatch(/GreenTech/);
  });

  it('shows empty state when API returns empty array', async () => {
    // Setup mock to return empty array (one-time)
  mockedGetCompanies.mockResolvedValueOnce([]);

  render(<CompaniesScreen apiCall={mockedGetCompanies} />);
    // Wait for the API mock to be called and the loading indicator to go away
    await waitFor(() => expect(mockedGetCompanies).toHaveBeenCalled(), { timeout: 2000 });
    await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument(), { timeout: 2000 });

    // Now assert the empty state element is rendered
    const emptyEl = screen.getByTestId('empty');
    expect(emptyEl).toBeInTheDocument();
    expect(emptyEl).toHaveTextContent(/No companies available/);
  });
});