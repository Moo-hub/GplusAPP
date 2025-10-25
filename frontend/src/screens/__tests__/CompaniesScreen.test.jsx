import { vi } from 'vitest';
import React from 'react';
// Mock services/api module to control getCompanies
vi.mock('../../services/api', () => ({
  getCompanies: vi.fn(),
}));
import { render, screen } from '../../test-utils.js';
import { waitFor } from '@testing-library/react';
import { getCompanies } from '../../services/api';
import CompaniesScreen from '../Companies/CompaniesScreen'; // path is correct, no change needed
import { MemoryRouter } from 'react-router-dom';
/** @type {any} */
const mockedGetCompanies = getCompanies;

describe('CompaniesScreen', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders companies list when API call succeeds', async () => {
    // Setup mock response (one-time)
    mockedGetCompanies.mockResolvedValueOnce([
      { id: 1, name: 'EcoCorp', icon: '\ud83c\udfe2' },
      { id: 2, name: 'GreenTech', icon: '\ud83c\udf31' }
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
  expect(emptyEl).toHaveTextContent('No companies available');
  });
});