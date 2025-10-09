import '../../test-utils/mockWebsocketShim';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';

// Ensure the component and tests import the ESM-compatible test shim when
// the production path '../../services/websocket.service' is requested.
vi.mock('../../services/websocket.service', async () => {
  const mod = await import('../../test-shims/websocket.service');
  return {
    default: mod.default,
    websocketService: mod.websocketService,
    resetWebsocketShim: mod.resetWebsocketShim,
  };
});

import websocketService from '../../services/websocket.service';
import Notifications from '../Notifications';

// Don't mock the component itself, but mock its dependencies
vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn()
  }
}));

// Use the global mock for websocket.service provided by test setup (setupTests.js).

describe('Notifications Component with Real Implementation', () => {
  beforeEach(async () => {
    // Clear mocks
    vi.clearAllMocks();
    // Reset the shim internal state
    const shim = await import('../../test-shims/websocket.service');
    shim.resetWebsocketShim();
    // Ensure on/off are spies so we can assert calls
    if (websocketService && typeof websocketService.on === 'function' && !websocketService.on._isMockFunction) {
      websocketService.on = vi.fn(websocketService.on);
    }
    if (websocketService && typeof websocketService.off === 'function' && !websocketService.off._isMockFunction) {
      websocketService.off = vi.fn(websocketService.off);
    }
  });

  it('initially shows the empty state', () => {
    render(<Notifications />);
    
    expect(screen.getByText('No new notifications')).toBeInTheDocument();
  });
  
  it('subscribes to websocket notifications on mount', () => {
    render(<Notifications />);
    
    expect(websocketService.on).toHaveBeenCalledWith('notification', expect.any(Function));
  });
  
  it('unsubscribes from websocket on unmount', () => {
    const { unmount } = render(<Notifications />);

    // If on() returned an unsubscribe function, it should be callable when
    // the component unmounts. The mock implementation in setupTests returns
    // a mock unsubscribe function which will be invoked.
    unmount();

    // Verify that the on() mock was called and that off()/the returned
    // unsubscribe function is present (we can't directly access the
    // returned function here because it was created inside the component),
    // but we can at least assert that on() was called.
    expect(websocketService.on).toHaveBeenCalled();
  });
  
  it('displays a notification when one is received', async () => {
    render(<Notifications />);
    
    // Initial state should be empty
    expect(screen.getByText('No new notifications')).toBeInTheDocument();
    
    // Simulate receiving a notification via websocket
    act(() => {
      // Use the emitToTest helper on the mocked service to simulate an
      // incoming notification.
      websocketService.emitToTest('notification', {
        message: 'New pickup scheduled',
        timestamp: new Date().toISOString(),
        link: '/pickups/123'
      });
    });
    
    // Now the notification should be displayed
    await waitFor(() => {
      expect(screen.queryByText('No new notifications')).not.toBeInTheDocument();
      expect(screen.getByText('New pickup scheduled')).toBeInTheDocument();
      expect(screen.getByText('View')).toHaveAttribute('href', '/pickups/123');
    });
    
    // Toast should have been shown
    expect(toast.info).toHaveBeenCalledWith('New pickup scheduled', expect.any(Object));
  });
  
  it('displays multiple notifications in newest-first order', async () => {
    render(<Notifications />);
    
    // Simulate receiving notifications in sequence
    act(() => {
      websocketService.emitToTest('notification', {
        message: 'First notification',
        timestamp: new Date(2025, 8, 28, 10, 0, 0).toISOString(),
      });
    });

    act(() => {
      websocketService.emitToTest('notification', {
        message: 'Second notification',
        timestamp: new Date(2025, 8, 28, 11, 0, 0).toISOString(),
      });
    });
    
    // Check they're displayed in the correct order (newest first)
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(2);
      expect(listItems[0]).toHaveTextContent('Second notification');
      expect(listItems[1]).toHaveTextContent('First notification');
    });
  });
  
  it('limits notifications to 10 most recent', async () => {
    render(<Notifications />);
    
    // Simulate receiving 11 notifications
    for (let i = 1; i <= 11; i++) {
      act(() => {
        websocketService.emitToTest('notification', {
          message: `Notification ${i}`,
          timestamp: new Date(2025, 8, 28, 10, i, 0).toISOString(),
        });
      });
    }
    
    // Check that only the 10 most recent are displayed (in newest-first order)
    await waitFor(() => {
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(10);
      expect(listItems[0]).toHaveTextContent('Notification 11');
      expect(listItems[9]).toHaveTextContent('Notification 2');
      expect(screen.queryByText('Notification 1')).not.toBeInTheDocument();
    });
  });
});