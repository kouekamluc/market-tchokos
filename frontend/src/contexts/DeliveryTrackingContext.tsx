import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

interface LocationUpdate {
  lat: number;
  lon: number;
  bearing?: number;
  speed?: number;
  timestamp: string;
}

interface StatusUpdate {
  status: string;
  message: string;
  timestamp: string;
}

interface ETAUpdate {
  eta_minutes: number;
  distance_km: number;
  current_speed: number;
  timestamp: string;
}

interface OrderStatus {
  order_id: string;
  status: string;
  delivery_status?: string;
  delivery_agent?: string;
  last_known_location?: {
    lat: number;
    lon: number;
  };
  bearing?: number;
  speed?: number;
}

interface DeliveryTrackingContextType {
  isConnected: boolean;
  orderStatus: OrderStatus | null;
  locationUpdates: LocationUpdate[];
  statusUpdates: StatusUpdate[];
  etaUpdates: ETAUpdate[];
  connect: (orderId: string) => void;
  disconnect: () => void;
  sendMessage: (message: Record<string, unknown>) => void;
  clearUpdates: () => void;
}

const DeliveryTrackingContext = createContext<DeliveryTrackingContextType | undefined>(undefined);

interface DeliveryTrackingProviderProps {
  children: ReactNode;
}

export const DeliveryTrackingProvider: React.FC<DeliveryTrackingProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [locationUpdates, setLocationUpdates] = useState<LocationUpdate[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [etaUpdates, setEtaUpdates] = useState<ETAUpdate[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const connect = useCallback((orderId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }

    const wsUrl = `ws://localhost:8000/ws/delivery/${orderId}/`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected for order:', orderId);
      setIsConnected(true);
      setCurrentOrderId(orderId);
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setCurrentOrderId(null);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setSocket(newSocket);
  }, [socket, handleWebSocketMessage]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
      setCurrentOrderId(null);
    }
  }, [socket]);

  const handleWebSocketMessage = useCallback((data: { type: string; [key: string]: unknown }) => {
    switch (data.type) {
      case 'order_status':
        setOrderStatus(data.data);
        break;
      case 'location_update':
        setLocationUpdates(prev => [...prev, {
          lat: data.lat,
          lon: data.lon,
          bearing: data.bearing,
          speed: data.speed,
          timestamp: data.timestamp
        }]);
        break;
      case 'status_update':
        setStatusUpdates(prev => [...prev, {
          status: data.status,
          message: data.message,
          timestamp: data.timestamp
        }]);
        break;
      case 'eta_update':
        setEtaUpdates(prev => [...prev, {
          eta_minutes: data.eta_minutes,
          distance_km: data.distance_km,
          current_speed: data.current_speed,
          timestamp: data.timestamp
        }]);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, [socket]);

  const clearUpdates = useCallback(() => {
    setLocationUpdates([]);
    setStatusUpdates([]);
    setEtaUpdates([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const value: DeliveryTrackingContextType = {
    isConnected,
    orderStatus,
    locationUpdates,
    statusUpdates,
    etaUpdates,
    connect,
    disconnect,
    sendMessage,
    clearUpdates,
  };

  return (
    <DeliveryTrackingContext.Provider value={value}>
      {children}
    </DeliveryTrackingContext.Provider>
  );
};

export const useDeliveryTracking = (): DeliveryTrackingContextType => {
  const context = useContext(DeliveryTrackingContext);
  if (context === undefined) {
    throw new Error('useDeliveryTracking must be used within a DeliveryTrackingProvider');
  }
  return context;
};
