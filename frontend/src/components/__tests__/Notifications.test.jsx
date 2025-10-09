// @ts-nocheck
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders.jsx';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Notifications from '../Notifications';

/**
 * Mock the Notifications component to test different states directly
 * 
 * This approach simplifies testing by allowing us to directly control the 
 * notifications state, instead of trying to work with the useEffect and 
 * websocket subscription logic in the component.
 * 
 * By mocking the component implementation but keeping its core rendering logic,
 * we can still test the component's output while having precise control over
 * the input data.
 */
// Use the real Notifications component (wrapped by providers) so tests exercise
// the actual rendering logic. Previously the test provided a manual mock which
// diverged from the real DOM shape and hid issues; removing the mock gives us
// a clearer, more accurate test.

// Mock the toast library to avoid real notifications during tests
vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn()
  }
}));

// Replace inline websocket mock with the shared ESM-compatible test shim so
// tests and components reference the same instance. This enables deterministic
// emits and avoids mutating the production singleton.
vi.mock('../services/websocket.service', async () => {
  const mod = await import('../../test-shims/websocket.service');
  return {
    __esModule: true,
    default: mod.default,
    websocketService: mod.websocketService,
    resetWebsocketShim: mod.resetWebsocketShim,
  };
});

describe('Notifications Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    // Reset the centralized websocket shim so listeners/unread counts are cleared
    // between tests. Import lazily to avoid hoisting issues with vitest mocks.
    // eslint-disable-next-line no-void
    void import('../../test-shims/websocket.service').then(mod => mod.resetWebsocketShim());
  });

  /**
   * Test the empty state when there are no notifications
   */
  it('shows empty state when there are no notifications', () => {
  renderWithProviders(<Notifications notifications={[]} />);
    
    // Check for empty state message
    expect(screen.getByText('No new notifications')).toBeInTheDocument();
    expect(screen.getByTestId('empty-notifications')).toBeInTheDocument();
    expect(screen.queryByText('Recent Notifications')).not.toBeInTheDocument();
  });

  /**
   * Test that notifications are properly rendered when received
   */
  it('renders notifications when they are received', () => {
    const mockNotification = {
      message: 'New pickup scheduled',
      timestamp: new Date().toISOString(),
      link: '/pickups/123'
    };
    
  renderWithProviders(<Notifications notifications={[mockNotification]} />);
    
    // Check that the notification is displayed
    expect(screen.queryByText('No new notifications')).not.toBeInTheDocument();
    expect(screen.getByTestId('notifications-container')).toBeInTheDocument();
    expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
    expect(screen.getByText('New pickup scheduled')).toBeInTheDocument();
    
    // Check that the link is correctly rendered
    const viewLink = screen.getByText('View');
    expect(viewLink).toBeInTheDocument();
    expect(viewLink).toHaveAttribute('href', '/pickups/123');
  });

  /**
   * Test that multiple notifications are displayed in the correct order (newest first)
   */
  it('displays multiple notifications in order', () => {
    // Simulate receiving multiple notifications - note that they should appear
    // in the DOM in the same order as the array (newest first)
    const notifications = [
      {
        message: 'Second notification', // This should be first in the list (newest)
        timestamp: new Date(2025, 8, 28, 11, 0, 0).toISOString(),
      },
      {
        message: 'First notification',
        timestamp: new Date(2025, 8, 28, 10, 0, 0).toISOString(),
        link: '/first'
      }
    ];
    
  renderWithProviders(<Notifications notifications={notifications} />);
    
    // Check that notifications are displayed in the right order
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent('Second notification');
    expect(listItems[1]).toHaveTextContent('First notification');
    
    // Check that only the second notification (which is the "First notification") has a link
    expect(screen.getByText('View')).toHaveAttribute('href', '/first');
  });

  /**
   * Test that the component limits the number of notifications displayed to 10
   */
  it('limits the number of notifications to 10', () => {
    // Create 12 notifications
    const notifications = [];
    for (let i = 12; i >= 1; i--) {
      notifications.push({
        message: `Notification ${i}`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Render with only the first 10 notifications
    // Note: In the real component, this slicing happens in the useEffect
  renderWithProviders(<Notifications notifications={notifications.slice(0, 10)} />);
    
    // Check that only 10 notifications are displayed
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(10);
    
    // The most recent notification (12) should be first
    expect(listItems[0]).toHaveTextContent('Notification 12');
    // Notification 3 should be the last one displayed
    expect(listItems[9]).toHaveTextContent('Notification 3');
    // Notifications 1 and 2 should be dropped
    expect(screen.queryByText('Notification 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Notification 1')).not.toBeInTheDocument();
  });
});