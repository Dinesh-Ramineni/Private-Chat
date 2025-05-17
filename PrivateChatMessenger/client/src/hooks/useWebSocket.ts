import { useState, useEffect, useCallback, useRef } from 'react';

type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

const useWebSocket = (userId?: number) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
      setError(null);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };

    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      setError('Failed to connect to server');
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Call all registered handlers for this message type
        const handler = messageHandlersRef.current.get(data.type);
        if (handler) {
          handler(data);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    // Clean up WebSocket on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Register a message handler
  const registerHandler = useCallback((messageType: string, handler: (data: any) => void) => {
    console.log(`Registering handler for ${messageType}`);
    messageHandlersRef.current.set(messageType, handler);
    
    // Return a function to unregister the handler
    return () => {
      console.log(`Unregistering handler for ${messageType}`);
      messageHandlersRef.current.delete(messageType);
    };
  }, []);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Join a room
  const joinRoom = useCallback((roomId: string) => {
    return sendMessage({
      type: 'join_room',
      roomId,
      userId
    });
  }, [sendMessage, userId]);

  // Send WebRTC signaling data
  const sendSignal = useCallback((roomId: string, signal: any) => {
    return sendMessage({
      type: 'webrtc_signal',
      roomId,
      signal
    });
  }, [sendMessage]);

  // Send a chat message
  const sendChatMessage = useCallback((roomId: string, message: any, senderId: number) => {
    return sendMessage({
      type: 'chat_message',
      roomId,
      message,
      senderId
    });
  }, [sendMessage]);

  return {
    connected,
    error,
    registerHandler,
    sendMessage,
    joinRoom,
    sendSignal,
    sendChatMessage
  };
};

export default useWebSocket;