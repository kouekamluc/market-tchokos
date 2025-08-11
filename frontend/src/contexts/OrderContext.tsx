import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DeliveryLocation } from './LocationContext';

export interface DeliveryAgent {
  id: string;
  name: string;
  photo: string;
  phoneNumber: string;
  rating: number;
  totalDeliveries: number;
  vehicleType: 'motorcycle' | 'car' | 'bicycle';
  vehicleInfo: string;
  isOnline: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  merchantId: string;
  merchantName: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  deliveryAgent?: DeliveryAgent;
  trackingHistory: TrackingEvent[];
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  timestamp: Date;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  deliveryLocation: DeliveryLocation;
  paymentMethod: 'cash' | 'mobile_money' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery: Date;
  specialInstructions?: string;
  tracking?: OrderTracking;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderStatus' | 'tracking'>) => Promise<Order>;
  getOrder: (orderId: string) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  assignDeliveryAgent: (orderId: string, agent: DeliveryAgent) => void;
  updateTrackingLocation: (orderId: string, location: { latitude: number; longitude: number }) => void;
  addTrackingEvent: (orderId: string, event: Omit<TrackingEvent, 'id'>) => void;
  cancelOrder: (orderId: string) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  getActiveOrders: () => Order[];
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load orders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chronoconnect_orders');
    if (saved) {
      try {
        const parsedOrders = JSON.parse(saved).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          estimatedDelivery: new Date(order.estimatedDelivery),
          actualDelivery: order.actualDelivery ? new Date(order.actualDelivery) : undefined,
          tracking: order.tracking ? {
            ...order.tracking,
            estimatedDelivery: new Date(order.tracking.estimatedDelivery),
            actualDelivery: order.tracking.actualDelivery ? new Date(order.tracking.actualDelivery) : undefined,
            trackingHistory: order.tracking.trackingHistory.map((event: any) => ({
              ...event,
              timestamp: new Date(event.timestamp)
            }))
          } : undefined
        }));
        setOrders(parsedOrders);
      } catch (err) {
        console.error('Error loading orders:', err);
      }
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chronoconnect_orders', JSON.stringify(orders));
  }, [orders]);

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderStatus' | 'tracking'>): Promise<Order> => {
    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const estimatedDelivery = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes from now

      const newOrder: Order = {
        ...orderData,
        id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
        orderStatus: 'pending',
        estimatedDelivery,
        tracking: {
          orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          estimatedDelivery,
          trackingHistory: [
            {
              id: `EVT-${Date.now()}`,
              status: 'pending',
              timestamp: now,
              description: 'Order placed successfully'
            }
          ]
        }
      };

      setOrders(prev => [newOrder, ...prev]);
      setCurrentOrder(newOrder);

      // Simulate order confirmation after 2 seconds
      setTimeout(() => {
        updateOrderStatus(newOrder.id, 'confirmed');
      }, 2000);

      return newOrder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrder = (orderId: string): Order | null => {
    return orders.find(order => order.id === orderId) || null;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedOrder = {
          ...order,
          orderStatus: status,
          updatedAt: new Date()
        };

        // Update tracking if it exists
        if (updatedOrder.tracking) {
          updatedOrder.tracking = {
            ...updatedOrder.tracking,
            status,
            trackingHistory: [
              ...updatedOrder.tracking.trackingHistory,
              {
                id: `EVT-${Date.now()}`,
                status,
                timestamp: new Date(),
                description: getStatusDescription(status)
              }
            ]
          };
        }

        return updatedOrder;
      }
      return order;
    }));

    // Update current order if it's the one being updated
    if (currentOrder?.id === orderId) {
      setCurrentOrder(prev => prev ? {
        ...prev,
        orderStatus: status,
        updatedAt: new Date()
      } : null);
    }
  };

  const assignDeliveryAgent = (orderId: string, agent: DeliveryAgent) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId && order.tracking) {
        return {
          ...order,
          tracking: {
            ...order.tracking,
            deliveryAgent: agent,
            trackingHistory: [
              ...order.tracking.trackingHistory,
              {
                id: `EVT-${Date.now()}`,
                status: order.orderStatus,
                timestamp: new Date(),
                description: `Delivery agent ${agent.name} assigned to your order`
              }
            ]
          }
        };
      }
      return order;
    }));
  };

  const updateTrackingLocation = (orderId: string, location: { latitude: number; longitude: number }) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId && order.tracking) {
        return {
          ...order,
          tracking: {
            ...order.tracking,
            currentLocation: location
          }
        };
      }
      return order;
    }));
  };

  const addTrackingEvent = (orderId: string, event: Omit<TrackingEvent, 'id'>) => {
    const newEvent: TrackingEvent = {
      ...event,
      id: `EVT-${Date.now()}`
    };

    setOrders(prev => prev.map(order => {
      if (order.id === orderId && order.tracking) {
        return {
          ...order,
          tracking: {
            ...order.tracking,
            trackingHistory: [...order.tracking.trackingHistory, newEvent]
          }
        };
      }
      return order;
    }));
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  const getOrdersByStatus = (status: OrderStatus): Order[] => {
    return orders.filter(order => order.orderStatus === status);
  };

  const getActiveOrders = (): Order[] => {
    const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'in_transit'];
    return orders.filter(order => activeStatuses.includes(order.orderStatus));
  };

  const getStatusDescription = (status: OrderStatus): string => {
    const descriptions = {
      pending: 'Order placed and waiting for confirmation',
      confirmed: 'Order confirmed by merchant',
      preparing: 'Merchant is preparing your order',
      ready_for_pickup: 'Order is ready for pickup',
      picked_up: 'Delivery agent has picked up your order',
      in_transit: 'Your order is on the way',
      delivered: 'Order delivered successfully',
      cancelled: 'Order has been cancelled'
    };
    return descriptions[status];
  };

  const value: OrderContextType = {
    orders,
    currentOrder,
    isLoading,
    error,
    createOrder,
    getOrder,
    updateOrderStatus,
    assignDeliveryAgent,
    updateTrackingLocation,
    addTrackingEvent,
    cancelOrder,
    getOrdersByStatus,
    getActiveOrders
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}; 