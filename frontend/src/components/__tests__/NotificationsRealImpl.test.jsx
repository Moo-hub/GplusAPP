import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import websocketService from '../services/websocket.service';
import Notifications from '../Notifications';

// Don't mock the component itself, but mock its dependencies
vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn()
  }
}));

vi.mock('../services/websocket.service', () => ({
  default: {
    on: vi.fn()
  }
}));

describe('Notifications Component with Real Implementation', () => {
  let mockWebsocketCallback;
  let mockUnsubscribe;
  
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    
    // Setup mock for websocketService.on
    mockUnsubscribe = vi.fn();
    websocketService.on.mockImplementation((eventType, callback) => {
      // Store the callback so we can trigger it in tests
      mockWebsocketCallback = callback;
      return mockUnsubscribe;
    });
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
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
  
  it('displays a notification when one is received', async () => {
    render(<Notifications />);
    
    // Initial state should be empty
    expect(screen.getByText('No new notifications')).toBeInTheDocument();
    
    // Simulate receiving a notification via websocket
    act(() => {
      mockWebsocketCallback({
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
      mockWebsocketCallback({
        message: 'First notification',
        timestamp: new Date(2025, 8, 28, 10, 0, 0).toISOString(),
      });
    });
    
    act(() => {
      mockWebsocketCallback({
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
        mockWebsocketCallback({
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