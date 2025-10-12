/**
 * @file websocket.service.test.js - اختبارات وحدة لخدمة WebSocket
 * @module tests/websocket-service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from '../websocket.service';

/**
 * اختبارات وحدة لخدمة WebSocket
 * 
 * هذه الاختبارات تتحقق من:
 * - الاتصال والفصل الصحيح بالخادم
 * - التعامل مع الرسائل الواردة
 * - التعامل مع إعادة الاتصال عند الانقطاع
 * - تسجيل وإلغاء تسجيل المستمعين
 */
describe('WebSocketService', () => {
  // وهميات للاعتماديات
  let mockWebSocket;
  let mockLocalStorage;
  let mockRandomUUID;
  let mockSetTimeout;
  let mockSetInterval;
  let mockClearInterval;
  // تخزين الإشارة الأصلية للـ WebSocket على مستوى الوصف
  const originalWSRef = { current: null };

  beforeEach(() => {
    // Store original values
    originalWSRef.current = global.WebSocket;
    
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
    
    // Mock WebSocket with proper event handler properties
    mockWebSocket = {
      readyState: 1, // OPEN
      send: vi.fn(),
      close: vi.fn(),
      // Define event handlers as functions (needed for test to call them)
      onopen: vi.fn(),
      onmessage: vi.fn(),
      onclose: vi.fn(),
      onerror: vi.fn(),
      url: ''
    };
    
    // Simple WebSocket factory function that returns our mock
    const webSocketFactory = vi.fn((url) => {
      mockWebSocket.url = url;
      return mockWebSocket;
    });
    
    // Create an object that looks enough like the WebSocket constructor for our tests
    const MockWebSocket = Object.assign(webSocketFactory, {
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    });
    
    // Replace the global WebSocket with our mock
    // @ts-ignore - Type mismatch is expected but won't affect our tests
    global.WebSocket = MockWebSocket;
    // Create a spy on the constructor itself
    vi.spyOn(global, 'WebSocket');
    
    // Mock crypto.randomUUID
  // Provide a v4-like UUID to satisfy environments with template type expectations
  mockRandomUUID = vi.fn(() => '123e4567-e89b-12d3-a456-426614174000');
    // Use existing global crypto and override method when possible
    if (global.crypto && typeof global.crypto === 'object') {
      try {
        // @ts-ignore - override for test
        global.crypto.randomUUID = mockRandomUUID;
      } catch {
        // Fallback: defineProperty in case it's non-writable
        Object.defineProperty(global, 'crypto', {
          value: { ...(global.crypto || {}), randomUUID: mockRandomUUID },
          configurable: true,
          writable: true,
        });
      }
    } else {
      Object.defineProperty(global, 'crypto', {
        value: { randomUUID: mockRandomUUID },
        configurable: true,
        writable: true,
      });
    }
    
  // Mock timers via spies without overriding global types
  // @ts-ignore - simplify timer typing in tests
  mockSetTimeout = vi.spyOn(global, 'setTimeout').mockImplementation(() => 0);
  // @ts-ignore - return a dummy id for interval
  mockSetInterval = vi.spyOn(global, 'setInterval').mockImplementation(() => 123);
  mockClearInterval = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
    
    // Silence console logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values
    global.WebSocket = originalWSRef.current;
    // Do not delete localStorage; reset its spies instead
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
    
    // Clear mocks
    vi.clearAllMocks();
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
  // Use the spy to check constructor call
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
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('wsConnectionId', '123e4567-e89b-12d3-a456-426614174000');
    expect(global.WebSocket).toHaveBeenCalledWith(`ws://localhost:8000/ws/123e4567-e89b-12d3-a456-426614174000?token=${token}`);
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
  // @ts-ignore - mock interval id
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
  // @ts-ignore - mock interval id
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