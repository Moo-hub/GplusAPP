import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Import the module dynamically in beforeEach using vi.importActual so the
// mocked websocket service in global test setup doesn't replace the real
// class used by these unit tests.
let WebSocketService;
import { saveGlobals, restoreGlobals } from '../../tests/test-utils/globals';

describe('WebSocketService', () => {
  // Mock dependencies
  let mockWebSocket;
  let mockLocalStorage;
  let mockRandomUUID;
  let mockSetTimeout;
  let mockSetInterval;
  let mockClearInterval;
  let originalWebSocket;
  let savedGlobals;

  beforeEach(() => {
  // Store original values using helper
  savedGlobals = saveGlobals();
    originalWebSocket = savedGlobals.WebSocket || global.WebSocket;
    
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    
    // Mock WebSocket
    mockWebSocket = {
      readyState: 1, // OPEN
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
    };
    global.WebSocket = vi.fn(() => mockWebSocket);
    global.WebSocket.OPEN = 1;
    
    // Mock crypto.randomUUID (use spy when possible)
    mockRandomUUID = vi.fn(() => 'mock-uuid');
    try {
      if (global.crypto && typeof global.crypto === 'object') {
        global.crypto.randomUUID = mockRandomUUID;
      } else {
        Object.defineProperty(global, 'crypto', { value: { randomUUID: mockRandomUUID }, configurable: true, writable: true });
      }
    } catch (e) {
      // fallback: set a test-only helper
      global.__test_crypto_fallback = { randomUUID: mockRandomUUID };
    }
    
    // Mock timers
    mockSetTimeout = vi.fn();
    mockSetInterval = vi.fn(() => 123);
    mockClearInterval = vi.fn();
    global.setTimeout = mockSetTimeout;
    global.setInterval = mockSetInterval;
    global.clearInterval = mockClearInterval;
    
    // Silence console logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values safely
    restoreGlobals(savedGlobals);
    // Clear mocks
    vi.clearAllMocks();
  });

  beforeEach(async () => {
    // Import the real implementation so tests exercise the actual class
    const mod = await vi.importActual('../websocket.service');
    // Prefer the named class export when available to allow `new WebSocketService()`
    WebSocketService = mod.WebSocketService || mod.default || mod;
  });

  it('initializes with empty listeners', () => {
    // Create a new instance
    const service = new WebSocketService();
    
    // Verify initial state
    expect(service.ws).toBeNull();
    expect(service.listeners).toEqual({
      notification: [],
      points_update: [],
      pong: []
    });
  });

  it('connects to WebSocket with token and connection ID', () => {
    // Setup
    const token = 'mock-token';
    const connectionId = 'existing-connection-id';
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return token;
      if (key === 'wsConnectionId') return connectionId;
      return null;
    });
    
    // Create instance and connect
    const service = new WebSocketService();
    service.connect();
    
    // Verify
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('wsConnectionId');
    expect(global.WebSocket).toHaveBeenCalledWith(`ws://localhost:8000/ws/${connectionId}?token=${token}`);
  });

  it('generates new connection ID if none exists', () => {
    // Setup
    const token = 'mock-token';
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return token;
      return null;
    });
    
    // Create instance and connect
    const service = new WebSocketService();
    service.connect();
    
    // Verify
    expect(mockRandomUUID).toHaveBeenCalled();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('wsConnectionId', 'mock-uuid');
    expect(global.WebSocket).toHaveBeenCalledWith(`ws://localhost:8000/ws/mock-uuid?token=${token}`);
  });

  it('sets up ping interval on connection', () => {
    // Setup
    const service = new WebSocketService();
    service.connect();
    
    // Trigger onopen handler
    mockWebSocket.onopen();
    
    // Verify
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    
    // Trigger the interval function
    const intervalFn = mockSetInterval.mock.calls[0][0];
    intervalFn();
    
    // Verify ping sent
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ping' }));
  });

  it('processes incoming messages and notifies listeners', () => {
    // Setup
    const notificationListener = vi.fn();
    const pointsUpdateListener = vi.fn();
    
    const service = new WebSocketService();
    service.on('notification', notificationListener);
    service.on('points_update', pointsUpdateListener);
    service.connect();
    
    // Mock messages
    const notificationMessage = { type: 'notification', content: 'New message' };
    const pointsMessage = { type: 'points_update', points: 100 };
    const unknownMessage = { type: 'unknown', data: 'test' };
    
    // Trigger onmessage handler with different message types
    mockWebSocket.onmessage({ data: JSON.stringify(notificationMessage) });
    mockWebSocket.onmessage({ data: JSON.stringify(pointsMessage) });
    mockWebSocket.onmessage({ data: JSON.stringify(unknownMessage) });
    
    // Verify
    expect(notificationListener).toHaveBeenCalledWith(notificationMessage);
    expect(pointsUpdateListener).toHaveBeenCalledWith(pointsMessage);
    // No error for unknown message type
  });

  it('handles connection close and attempts reconnection', () => {
    // Setup
    const service = new WebSocketService();
    service.connect();
    service.pingInterval = 456; // Mock the interval ID
    
    // Trigger onclose handler
    mockWebSocket.onclose({ code: 1000, reason: 'Normal closure' });
    
    // Verify
    expect(mockClearInterval).toHaveBeenCalledWith(456);
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
  });

  it('disconnects and cleans up properly', () => {
    // Setup
    const service = new WebSocketService();
    service.connect();
    service.pingInterval = 789; // Mock the interval ID
    
    // Disconnect
    service.disconnect();
    
    // Verify
    expect(mockClearInterval).toHaveBeenCalledWith(789);
    expect(mockWebSocket.close).toHaveBeenCalled();
    expect(service.ws).toBeNull();
  });

  it('provides unsubscribe function when registering listeners', () => {
    // Setup
    const service = new WebSocketService();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    
    // Register listeners
    const unsubscribe = service.on('notification', listener1);
    service.on('notification', listener2);
    
    // Verify both listeners are registered
    expect(service.listeners.notification).toHaveLength(2);
    expect(service.listeners.notification).toContain(listener1);
    expect(service.listeners.notification).toContain(listener2);
    
    // Unsubscribe first listener
    unsubscribe();
    
    // Verify only second listener remains
    expect(service.listeners.notification).toHaveLength(1);
    expect(service.listeners.notification).not.toContain(listener1);
    expect(service.listeners.notification).toContain(listener2);
  });
});