class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {
      notification: [],
      points_update: [],
      pong: []
    };
  }

  connect() {
    // تم تعطيل WebSocket لتجنب التداخل مع MSW
    console.log('🔶 WebSocket service disabled to prevent MSW conflicts');
    return;
    
    const token = localStorage.getItem('token');
    const connectionId = localStorage.getItem('wsConnectionId') || crypto.randomUUID();
    
    // Store connection ID for reconnection
    localStorage.setItem('wsConnectionId', connectionId);
    
    this.ws = new WebSocket(`ws://localhost:8000/ws/${connectionId}?token=${token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected!');
      // Send ping every 30 seconds to keep connection alive
      this.pingInterval = setInterval(() => {
        // Use numeric readyState check to avoid reliance on WebSocket static constants in tests
        if (this.ws && this.ws.readyState === 1) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      
      // Notify all registered listeners for this message type
      if (data.type && this.listeners[data.type]) {
        this.listeners[data.type].forEach(callback => callback(data));
      }
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      clearInterval(this.pingInterval);
      // Reconnect after a delay
      setTimeout(() => this.connect(), 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    if (this.ws) {
      clearInterval(this.pingInterval);
      this.ws.close();
      this.ws = null;
    }
  }

  // Add a listener for a specific message type
  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService;
export { WebSocketService };