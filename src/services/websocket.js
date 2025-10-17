// WebSocket Service
let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let listeners = [];
let WebSocketClass = null; // injectable WebSocket class for testability
let overrideWsUrl = null; // test override for ws url

// Get WebSocket URL from environment variables or use default
const getWebSocketUrl = () => {
  const baseUrl = import.meta.env.VITE_WS_URL || 
    (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + 
    window.location.host;
  const effectiveBase = overrideWsUrl || baseUrl;
  return `${effectiveBase}/ws/${localStorage.getItem('userId') || 'anonymous'}`;
};

// Initialize WebSocket connection
const initWebSocket = () => {
  if (socket) return;

  try {
    const WS = WebSocketClass || WebSocket;
    socket = new WS(getWebSocketUrl());
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
      reconnectAttempts = 0;
      notifyListeners('connection', { status: 'connected' });
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        notifyListeners('message', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
      notifyListeners('connection', { status: 'disconnected' });
      
      // Attempt to reconnect
      socket = null;
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(initWebSocket, 2000 * reconnectAttempts); // Exponential backoff
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      notifyListeners('error', { error });
    };
  } catch (error) {
    console.error('Failed to establish WebSocket connection:', error);
  }
};

// Close WebSocket connection
const closeWebSocket = () => {
  const WS = WebSocketClass || WebSocket;
  if (socket) {
    if (socket.readyState === WS.OPEN) {
      socket.close();
    }
    // Ensure cleanup for tests
    socket = null;
  }
};

// Send message through WebSocket
const sendMessage = (message) => {
  const WS = WebSocketClass || WebSocket;
  if (socket && socket.readyState === WS.OPEN) {
    socket.send(JSON.stringify(message));
    return true;
  } else {
    console.error('WebSocket is not connected');
    initWebSocket(); // Try to reconnect
    return false;
  }
};

// Add event listener
const addListener = (eventType, callback) => {
  listeners.push({ eventType, callback });
  return () => removeListener(eventType, callback);
};

// Remove event listener
const removeListener = (eventType, callback) => {
  listeners = listeners.filter(
    listener => listener.eventType !== eventType || listener.callback !== callback
  );
};

// Notify all listeners of a specific event type
const notifyListeners = (eventType, data) => {
  listeners
    .filter(listener => listener.eventType === eventType)
    .forEach(listener => listener.callback(data));
};

// Check WebSocket connection status
const isConnected = () => {
  const WS = WebSocketClass || WebSocket;
  return !!(socket && socket.readyState === WS.OPEN);
};

// Test helpers (non-production): allow injecting WS class and overriding URL
const setWebSocketClass = (WS) => {
  WebSocketClass = WS;
};
const __setWsUrlForTest = (url) => {
  overrideWsUrl = url;
};
const __getSocketForTest = () => socket;

export default {
  initWebSocket,
  closeWebSocket,
  sendMessage,
  addListener,
  removeListener,
  isConnected,
  // test hooks
  setWebSocketClass,
  __setWsUrlForTest,
  __getSocketForTest
};