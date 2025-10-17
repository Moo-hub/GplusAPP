import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OfflineNotification from '../src/components/OfflineNotification';
import { OfflineProvider } from '../src/contexts/OfflineContext';

// Mock the offline context
vi.mock('../src/contexts/OfflineContext', () => ({
  useOffline: vi.fn(),
  OfflineProvider: ({ children }) => <div data-testid="offline-provider">{children}</div>
}));

describe('OfflineNotification Component', () => {
  // Reset mocks between tests
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should not render when online and no pending requests', () => {
    // Mock the useOffline hook to return online status and no pending requests
    const { useOffline } = require('../src/contexts/OfflineContext');
    useOffline.mockReturnValue({
      isAppOffline: false,
      pendingRequests: []
    });

    render(<OfflineNotification />);
    
    // Notification should not be in the document
    const notification = screen.queryByTestId('offline-notification');
    expect(notification).not.toBeInTheDocument();
  });

  it('should show offline notification when offline', () => {
    // Mock the useOffline hook to return offline status
    const { useOffline } = require('../src/contexts/OfflineContext');
    useOffline.mockReturnValue({
      isAppOffline: true,
      pendingRequests: []
    });

    render(<OfflineNotification />);
    
    // Offline notification should be in the document with correct class and message
    const notification = screen.getByText(/You are currently offline/i);
    expect(notification).toBeInTheDocument();
    
    const notificationContainer = screen.getByTestId('offline-notification');
    expect(notificationContainer).toHaveClass('offline');
  });

  it('should show pending requests notification when there are pending requests', () => {
    // Mock the useOffline hook to return online status with pending requests
    const mockSyncPendingRequests = vi.fn();
    const { useOffline } = require('../src/contexts/OfflineContext');
    useOffline.mockReturnValue({
      isAppOffline: false,
      pendingRequests: [{ id: 1 }, { id: 2 }],
      syncPendingRequests: mockSyncPendingRequests
    });

    render(<OfflineNotification />);
    
    // Pending requests notification should be in the document with correct count
    const notification = screen.getByText(/2 requests waiting to sync/i);
    expect(notification).toBeInTheDocument();
    
    const notificationContainer = screen.getByTestId('offline-notification');
    expect(notificationContainer).toHaveClass('pending');
    
    // Sync button should be in the document
    const syncButton = screen.getByText(/sync now/i);
    expect(syncButton).toBeInTheDocument();
  });

  it('should call syncPendingRequests when sync button is clicked', () => {
    // Mock the useOffline hook to return online status with pending requests and sync function
    const mockSyncPendingRequests = vi.fn();
    const { useOffline } = require('../src/contexts/OfflineContext');
    useOffline.mockReturnValue({
      isAppOffline: false,
      pendingRequests: [{ id: 1 }],
      syncPendingRequests: mockSyncPendingRequests
    });

    render(<OfflineNotification />);
    
    // Click sync button
    const syncButton = screen.getByText(/sync now/i);
    fireEvent.click(syncButton);
    
    // Sync function should have been called
    expect(mockSyncPendingRequests).toHaveBeenCalledTimes(1);
  });
});