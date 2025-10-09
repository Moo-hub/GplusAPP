import { renderHook, act } from '@testing-library/react-hooks';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

// Mock the useToast hook
jest.mock('../contexts/ToastContext', () => ({
  useToast: jest.fn(() => ({
    addToast: jest.fn(),
  })),
}));

describe('useOfflineStatus Hook', () => {
  const originalNavigatorOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine');
  let mockFetch;
  
  beforeEach(() => {
    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    
    // Reset online status between tests
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    
    // Restore original navigator.onLine property
    if (originalNavigatorOnLine) {
      Object.defineProperty(navigator, 'onLine', originalNavigatorOnLine);
    }
  });

  it('should initially detect online status from navigator', () => {
    // Set navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should initially detect offline status from navigator', () => {
    // Set navigator.onLine to false
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('should respond to online event', () => {
    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current.isOffline).toBe(true);

    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    // Dispatch online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current.isOffline).toBe(false);
    expect(result.current.isOnline).toBe(true);
  });

  it('should respond to offline event', () => {
    // Start online
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useOfflineStatus());
    
    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    // Dispatch offline event
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOffline).toBe(true);
    expect(result.current.isOnline).toBe(false);
  });

  it('should perform active connection check', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useOfflineStatus({ checkInterval: 1000 })
    );
    
    // Call check connection manually
    act(() => {
      result.current.checkConnection();
    });
    
    await waitForNextUpdate();
    
    expect(mockFetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
    expect(result.current.isOnline).toBe(true);
  });

  it('should handle failed connection checks', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useOfflineStatus()
    );
    
    // Call check connection manually
    act(() => {
      result.current.checkConnection();
    });
    
    await waitForNextUpdate();
    
    expect(mockFetch).toHaveBeenCalled();
    expect(result.current.isOffline).toBe(true);
  });

  it('should handle fetch errors during connection checks', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useOfflineStatus()
    );
    
    // Call check connection manually
    act(() => {
      result.current.checkConnection();
    });
    
    await waitForNextUpdate();
    
    expect(mockFetch).toHaveBeenCalled();
    expect(result.current.isOffline).toBe(true);
  });
});