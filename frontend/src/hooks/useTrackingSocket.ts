import { useEffect, useRef, useCallback } from 'react';
import { useState } from 'react';

interface TrackingSocketOptions {
  orderId: string;
  onLocationUpdate?: (data: Record<string, unknown>) => void;
  onStatusUpdate?: (data: Record<string, unknown>) => void;
  onETAUpdate?: (data: Record<string, unknown>) => void;
  onOrderStatus?: (data: Record<string, unknown>) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface TrackingSocketReturn {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: Record<string, unknown>) => void;
  lastMessage: Record<string, unknown> | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useTrackingSocket = (options: TrackingSocketOptions): TrackingSocketReturn => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<Record<string, unknown> | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      setConnectionStatus('connecting');
      const wsUrl = `ws://localhost:8000/ws/delivery/${options.orderId}/`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('Tracking WebSocket connected for order:', options.orderId);
        setIsConnected(true);
        setConnectionStatus('connected');
        options.onConnect?.();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          
          // Route messages to appropriate handlers
          switch (data.type) {
            case 'location_update':
              options.onLocationUpdate?.(data);
              break;
            case 'status_update':
              options.onStatusUpdate?.(data);
              break;
            case 'eta_update':
              options.onETAUpdate?.(data);
              break;
            case 'order_status':
              options.onOrderStatus?.(data);
              break;
            default:
              console.log('Unknown tracking message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing tracking WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        console.log('Tracking WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        options.onDisconnect?.();
      };

      socket.onerror = (error) => {
        console.error('Tracking WebSocket error:', error);
        setConnectionStatus('error');
        options.onError?.(error);
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('Error creating tracking WebSocket:', error);
      setConnectionStatus('error');
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('Tracking WebSocket is not connected');
    }
  }, []);

  // Auto-connect when orderId changes
  useEffect(() => {
    if (options.orderId) {
      connect();
    }

    // Cleanup on unmount or orderId change
    return () => {
      disconnect();
    };
  }, [options.orderId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    lastMessage,
    connectionStatus,
  };
};
