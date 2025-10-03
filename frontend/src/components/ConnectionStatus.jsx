import { useState, useEffect } from 'react';
import websocketService from '../services/websocket.service';

const ConnectionStatus = () => {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    // Check current connection
    setConnected(
      websocketService.ws && 
      websocketService.ws.readyState === WebSocket.OPEN
    );
    
    // Listen for connection open
    const onOpen = () => setConnected(true);
    websocketService.ws?.addEventListener('open', onOpen);
    
    // Listen for connection close
    const onClose = () => setConnected(false);
    websocketService.ws?.addEventListener('close', onClose);
    
    return () => {
      websocketService.ws?.removeEventListener('open', onOpen);
      websocketService.ws?.removeEventListener('close', onClose);
    };
  }, []);
  
  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      <span className="status-indicator"></span>
      {connected ? 'Online' : 'Connecting...'}
    </div>
  );
};

export default ConnectionStatus;