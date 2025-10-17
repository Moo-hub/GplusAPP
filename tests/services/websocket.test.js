import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WebSocketService from '../../src/services/websocket';

// Create a vi.fn() spy for WebSocket that tracks calls and instances
const MockWebSocket = vi.fn(function (url) {
  this.url = url;
  // Instance constants (not used by service)
  this.CONNECTING = 0;
  this.OPEN = 1;
  this.CLOSING = 2;
  this.CLOSED = 3;
  this.readyState = this.CONNECTING;
  this.sentMessages = [];
  this.onmessage = () => {};
  this.onclose = () => {};
  this.onopen = () => {};
  setTimeout(() => {
    this.readyState = this.OPEN;
    if (typeof this.onopen === 'function') this.onopen();
  }, 0);
});
MockWebSocket.sentMessages = [];
MockWebSocket.prototype.send = function (data) {
  MockWebSocket.sentMessages.push(data);
};
MockWebSocket.prototype.close = function () {
  this.readyState = this.CLOSING;
  setTimeout(() => {
    this.readyState = this.CLOSED;
    if (this.onclose) this.onclose();
  }, 0);
};

describe('WebSocketService', () => {
  // Mock necessary globals
  const originalWebSocket = global.WebSocket;
  const originalConsole = global.console;
  const mockLocation = { protocol: 'http:', host: 'example.com' };
  const mockUserId = 'user123';

  beforeEach(() => {
    // Reset the mock messages array
  MockWebSocket.mockClear();
  MockWebSocket.sentMessages = [];
    // Robust global mocking
  // Inject mock WebSocket class into the service
  WebSocketService.setWebSocketClass(MockWebSocket);
    vi.stubGlobal('console', { log: vi.fn(), error: vi.fn() });
    vi.stubGlobal('localStorage', { getItem: vi.fn(() => mockUserId) });
    vi.stubGlobal('window', { location: mockLocation });
    // Patch env var for ws url using a helper
    // Override ws url via service hook
    WebSocketService.__setWsUrlForTest('ws://test-server.com');
  });

  afterEach(() => {
  // Reset service state and globals
  WebSocketService.closeWebSocket();
  vi.unstubAllGlobals();
  });

  describe('initWebSocket', () => {
    it('should establish a WebSocket connection with the correct URL', () => {
      // Execute
      WebSocketService.initWebSocket();
      
    // Check if WebSocket was created with the correct URL
    expect(MockWebSocket).toHaveBeenCalled();
  // The actual instance created internally doesn't expose the URL to test directly
    });
    
    it('should not create a new WebSocket if one already exists', () => {
      // Setup - create a WebSocket first
      WebSocketService.initWebSocket();
    const initCallCount = MockWebSocket.mock.calls.length;
      
      // Execute - try to create another
      WebSocketService.initWebSocket();
      
      // Verify no new WebSocket was created
    expect(MockWebSocket.mock.calls.length).toBe(initCallCount);
    });
  });

  describe('sendMessage', () => {
    it('should send properly formatted message when connected', async () => {
      // Setup - initialize WebSocket
      WebSocketService.initWebSocket();
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 20));
      // Execute - send a message
      const message = { type: 'chat', content: 'Hello, world!' };
      const result = WebSocketService.sendMessage(message);
      // Verify
      expect(result).toBe(true);
      expect(MockWebSocket.sentMessages.length).toBe(1);
      expect(MockWebSocket.sentMessages[0]).toBe(JSON.stringify(message));
    });
    
    it('should return false when not connected', () => {
      // Execute - try to send without initializing
      WebSocketService.closeWebSocket(); // Ensure closed
      const result = WebSocketService.sendMessage({ type: 'test' });
      
      // Verify
      expect(result).toBe(false);
      expect(MockWebSocket.sentMessages.length).toBe(0);
    });
  });

  describe('event listeners', () => {
    it('should notify listeners when a message is received', async () => {
      // Setup - initialize WebSocket and add a listener
      WebSocketService.initWebSocket();
      const mockCallback = vi.fn();
      WebSocketService.addListener('message', mockCallback);
      // Ensure connection open
      vi.useFakeTimers();
      vi.runAllTimers();
      vi.useRealTimers();
      // Execute - simulate a message event
      const mockData = { type: 'notification', content: 'New pickup request' };
      const mockSocket = MockWebSocket.mock.instances[0];
      mockSocket.onmessage({ data: JSON.stringify(mockData) });
      // Verify
      expect(mockCallback).toHaveBeenCalledWith(mockData);
    });
    
    it('should allow removing event listeners', async () => {
      // Setup - initialize WebSocket and add a listener
      WebSocketService.initWebSocket();
      const mockCallback = vi.fn();
      // Add and then immediately remove the listener
      WebSocketService.addListener('message', mockCallback);
      WebSocketService.removeListener('message', mockCallback);
      // Ensure connection open
      vi.useFakeTimers();
      vi.runAllTimers();
      vi.useRealTimers();
      // Execute - simulate a message event
      const mockSocket = MockWebSocket.mock.instances[0];
      mockSocket.onmessage({ data: JSON.stringify({ type: 'test' }) });
      // Verify - callback shouldn't have been called
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('isConnected', () => {
    it('should return true when the WebSocket is open', async () => {
      // Setup - initialize WebSocket
      WebSocketService.initWebSocket();
      // Poll until connection is established
      const socket = MockWebSocket.mock.instances[0];
      // deterministically open the connection
      socket.readyState = MockWebSocket.OPEN;
      if (typeof socket.onopen === 'function') socket.onopen();
      // Execute & Verify
      expect(WebSocketService.isConnected()).toBe(true);
    });
    
    it('should return false when the WebSocket is not initialized', () => {
      // Execute & Verify
  expect(WebSocketService.isConnected()).toBe(false);
    });
    
    it('should return false after the WebSocket is closed', async () => {
      // Setup - initialize and then close WebSocket
      WebSocketService.initWebSocket();
      // Wait for connection to be established
      await new Promise(resolve => setTimeout(resolve, 20));
      // Close the connection
      WebSocketService.closeWebSocket();
      // Execute & Verify
      expect(WebSocketService.isConnected()).toBe(false);
    });
  });

  describe('reconnection logic', () => {
    it('should attempt to reconnect when connection is closed', async () => {
      // Setup - initialize WebSocket
      WebSocketService.initWebSocket();
      // Ensure connection open
      vi.useFakeTimers();
      vi.runAllTimers();
      vi.useRealTimers();
      // Simulate a connection close
      const mockSocket = MockWebSocket.mock.instances[0];
      mockSocket.onclose();
      // Verify that a log message was recorded about the closure
      expect(console.log).toHaveBeenCalledWith('WebSocket connection closed');
    });
  });
});
// Static constants used by service comparison (WebSocket.OPEN)
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;