import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RouteTracker from '../RouteTracker';
import { Analytics } from '../../services/analyticsService';

// Mock the Analytics service
vi.mock('../../services/analyticsService', () => ({
  Analytics: {
    pageView: vi.fn()
  }
}));

describe('RouteTracker Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders children without modifying them', () => {
    // Arrange
    const testContent = <div data-testid="test-content">Test Content</div>;
    
    // Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteTracker>{testContent}</RouteTracker>
      </MemoryRouter>
    );
    
    // Assert
    const content = screen.getByTestId('test-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Test Content');
  });

  it('tracks page view on initial render with root path', () => {
    // Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <RouteTracker>
          <div>Home Page</div>
        </RouteTracker>
      </MemoryRouter>
    );
    
    // Assert
    // For the root path, the page name should be 'Home'
    expect(Analytics.pageView).toHaveBeenCalledWith('Home', '/');
  });

  it('tracks page view with correct page name for non-root paths', () => {
    // Act
    render(
      <MemoryRouter initialEntries={['/companies']}>
        <RouteTracker>
          <div>Companies Page</div>
        </RouteTracker>
      </MemoryRouter>
    );
    
    // Assert
    expect(Analytics.pageView).toHaveBeenCalledWith('Companies', '/companies');
  });

  it('tracks page view for nested paths', () => {
    // Act
    render(
      <MemoryRouter initialEntries={['/pickups/scheduled']}>
        <RouteTracker>
          <div>Scheduled Pickups Page</div>
        </RouteTracker>
      </MemoryRouter>
    );
    
    // Assert
    // For nested paths, only the first segment is used for the page name
    expect(Analytics.pageView).toHaveBeenCalledWith('Pickups', '/pickups/scheduled');
  });

  it('capitalizes the first letter of the page name', () => {
    // Act
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <RouteTracker>
          <div>Settings Page</div>
        </RouteTracker>
      </MemoryRouter>
    );
    
    // Assert
    expect(Analytics.pageView).toHaveBeenCalledWith('Settings', '/settings');
  });
});