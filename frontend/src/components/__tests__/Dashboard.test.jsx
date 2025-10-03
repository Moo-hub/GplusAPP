import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import renderWithProviders, { makeAuthMocks } from '../../../../tests/test-utils.jsx';
import Dashboard from '../Dashboard';

// Mock the useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'dashboard.welcome': 'Welcome',
        'dashboard.pointsBalance': 'Points Balance',
        'dashboard.viewPoints': 'View Points',
        'dashboard.pickupRequests': 'Pickup Requests',
        'dashboard.schedulePickup': 'Schedule a pickup for your recyclables',
        'dashboard.scheduleNow': 'Schedule Now',
        'dashboard.environmentalImpact': 'Environmental Impact',
        'dashboard.checkImpact': 'Check your environmental impact',
        'dashboard.viewImpact': 'View Impact'
      };
      return translations[key] || key;
    }
  })
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with user information when user is logged in', () => {
    // Mock a logged-in user
    const auth = makeAuthMocks({ currentUser: { name: 'Test User', points: 150 } });

    renderWithProviders(<Dashboard />, { auth });
    
    // Check that the dashboard container is rendered
    expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
    
    // Check welcome message with user name
    expect(screen.getByTestId('dashboard-welcome')).toHaveTextContent('Welcome, Test User!');
    
    // Check that the points balance is displayed correctly
    expect(screen.getByTestId('points-value')).toHaveTextContent('150');
    
    // Check that cards are rendered
    expect(screen.getByTestId('points-card')).toBeInTheDocument();
    expect(screen.getByTestId('pickups-card')).toBeInTheDocument();
    expect(screen.getByTestId('impact-card')).toBeInTheDocument();
    
    // Check that links are rendered with correct hrefs
    expect(screen.getByTestId('view-points-link')).toHaveAttribute('href', '/points');
    expect(screen.getByTestId('schedule-pickup-link')).toHaveAttribute('href', '/pickups/new');
    expect(screen.getByTestId('view-impact-link')).toHaveAttribute('href', '/impact');
  });

  it('renders the dashboard with default values when user is not logged in', () => {
    // Mock no logged-in user
    const auth = makeAuthMocks({ currentUser: null });

    renderWithProviders(<Dashboard />, { auth });
    
    // Check welcome message with default name
    expect(screen.getByTestId('dashboard-welcome')).toHaveTextContent('Welcome, User!');
    
    // Check that the points balance is displayed as 0
    expect(screen.getByTestId('points-value')).toHaveTextContent('0');
  });

  it('renders all dashboard cards with correct information', () => {
    // Mock a logged-in user
    const auth = makeAuthMocks({ currentUser: { name: 'Test User', points: 150 } });

    renderWithProviders(<Dashboard />, { auth });
    
    // Check dashboard summary container
    expect(screen.getByTestId('dashboard-summary')).toBeInTheDocument();
    
    // Check points card content
    const pointsCard = screen.getByTestId('points-card');
    expect(pointsCard).toHaveTextContent('Points Balance');
    expect(pointsCard).toHaveTextContent('View Points');
    
    // Check pickups card content
    const pickupsCard = screen.getByTestId('pickups-card');
    expect(pickupsCard).toHaveTextContent('Pickup Requests');
    expect(pickupsCard).toHaveTextContent('Schedule a pickup for your recyclables');
    expect(pickupsCard).toHaveTextContent('Schedule Now');
    
    // Check environmental impact card content
    const impactCard = screen.getByTestId('impact-card');
    expect(impactCard).toHaveTextContent('Environmental Impact');
    expect(impactCard).toHaveTextContent('Check your environmental impact');
    expect(impactCard).toHaveTextContent('View Impact');
  });
});