import React from 'react';
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OfflineNotification from '../src/components/OfflineNotification';
import renderWithProviders from './test-utils.jsx';
import { useOffline } from '../src/contexts/OfflineContext';

vi.mock('../src/contexts/OfflineContext', () => ({
  useOffline: vi.fn()
}));

describe('OfflineNotification Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders when offline', () => {
    useOffline.mockReturnValue({ isOffline: true });

  const { getByTestId } = renderWithProviders(<OfflineNotification />);

    expect(getByTestId('offline-notification')).toBeInTheDocument();
  });

  it('does not render when online', () => {
    useOffline.mockReturnValue({ isOffline: false });

  const { queryByTestId } = renderWithProviders(<OfflineNotification />);

    expect(queryByTestId('offline-notification')).toBeNull();
  });

  it('should not render when online and no pending requests', async () => {
    // Mock the useOffline hook to return online status and no pending requests
    const offlineModule = await import('../src/contexts/OfflineContext');
    const { useOffline } = offlineModule;
    useOffline.mockReturnValue({
      isAppOffline: false,
      pendingRequests: []
    });

  renderWithProviders(<OfflineNotification />);
    
    // Notification should not be in the document
    const notification = screen.queryByTestId('offline-notification');
    expect(notification).not.toBeInTheDocument();
  });

  it('should show offline notification when offline', async () => {
    // Mock the useOffline hook to return offline status
    const offlineModule = await import('../src/contexts/OfflineContext');
    const { useOffline } = offlineModule;
    useOffline.mockReturnValue({
      isAppOffline: true,
      pendingRequests: []
    });

  renderWithProviders(<OfflineNotification />);
    
    // Offline notification should be in the document with correct class and message
    const notification = screen.getByText(/You are currently offline/i);
    expect(notification).toBeInTheDocument();
    
    const notificationContainer = screen.getByTestId('offline-notification');
    expect(notificationContainer).toHaveClass('offline');
  });

  it('should show pending requests notification when there are pending requests', async () => {
    // Mock the useOffline hook to return online status with pending requests
    const mockSyncPendingRequests = vi.fn();
    const offlineModule = await import('../src/contexts/OfflineContext');
    const { useOffline } = offlineModule;
    useOffline.mockReturnValue({
      isAppOffline: false,
      pendingRequests: [{ id: 1 }, { id: 2 }],
      syncPendingRequests: mockSyncPendingRequests
    });

  renderWithProviders(<OfflineNotification />);
    
    // Pending requests notification should be in the document with correct count
    const notification = screen.getByText(/2 requests waiting to sync/i);
    expect(notification).toBeInTheDocument();
    
    const notificationContainer = screen.getByTestId('offline-notification');
    expect(notificationContainer).toHaveClass('pending');
    
    // Sync button should be in the document
    const syncButton = screen.getByText(/sync now/i);
    expect(syncButton).toBeInTheDocument();
  });

  it('should call syncPendingRequests when sync button is clicked', async () => {
    // Mock the useOffline hook to return online status with pending requests and sync function
    const mockSyncPendingRequests = vi.fn();
    const offlineModule = await import('../src/contexts/OfflineContext');
    const { useOffline } = offlineModule;
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