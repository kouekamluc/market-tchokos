import React, { useState, useEffect, useRef } from 'react';
import { useOrder, OrderStatus, DeliveryAgent } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  Navigation,
  Star,
  Bike,
  Car
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderTrackingProps {
  orderId: string;
  onClose?: () => void;
}

const statusConfig = {
  pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-blue-500', icon: CheckCircle, label: 'Confirmed' },
  preparing: { color: 'bg-orange-500', icon: Clock, label: 'Preparing' },
  ready_for_pickup: { color: 'bg-purple-500', icon: Truck, label: 'Ready for Pickup' },
  picked_up: { color: 'bg-indigo-500', icon: Truck, label: 'Picked Up' },
  in_transit: { color: 'bg-green-500', icon: Navigation, label: 'In Transit' },
  delivered: { color: 'bg-green-600', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-500', icon: AlertCircle, label: 'Cancelled' }
};

const mockDeliveryAgent: DeliveryAgent = {
  id: 'agent-1',
  name: 'Jean-Pierre Mbarga',
  photo: '/placeholder.svg',
  phoneNumber: '+237 6XX XXX XXX',
  rating: 4.8,
  totalDeliveries: 1247,
  vehicleType: 'motorcycle',
  vehicleInfo: 'Honda CG125 - Red',
  isOnline: true,
  currentLocation: {
    latitude: 4.0511,
    longitude: 9.7679
  }
};

export default function OrderTracking({ orderId, onClose }: OrderTrackingProps) {
  const { getOrder, updateOrderStatus, assignDeliveryAgent, updateTrackingLocation } = useOrder();
  const [order, setOrder] = useState(getOrder(orderId));
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!order) return;

    // Simulate delivery process
    if (order.orderStatus === 'pending') {
      simulateDeliveryProcess();
    }

    // Update current step based on order status
    const statusOrder: OrderStatus[] = [
      'pending', 'confirmed', 'preparing', 'ready_for_pickup', 
      'picked_up', 'in_transit', 'delivered'
    ];
    const currentIndex = statusOrder.indexOf(order.orderStatus);
    setCurrentStep(currentIndex >= 0 ? currentIndex : 0);
  }, [order]);

  const simulateDeliveryProcess = async () => {
    setIsSimulating(true);

    // Assign delivery agent after 3 seconds
    setTimeout(() => {
      assignDeliveryAgent(orderId, mockDeliveryAgent);
      updateOrderStatus(orderId, 'confirmed');
    }, 3000);

    // Start preparing after 8 seconds
    setTimeout(() => {
      updateOrderStatus(orderId, 'preparing');
    }, 8000);

    // Ready for pickup after 15 seconds
    setTimeout(() => {
      updateOrderStatus(orderId, 'ready_for_pickup');
    }, 15000);

    // Picked up after 20 seconds
    setTimeout(() => {
      updateOrderStatus(orderId, 'picked_up');
    }, 20000);

    // In transit after 25 seconds
    setTimeout(() => {
      updateOrderStatus(orderId, 'in_transit');
      startLocationUpdates();
    }, 25000);

    // Delivered after 45 seconds
    setTimeout(() => {
      updateOrderStatus(orderId, 'delivered');
      setIsSimulating(false);
    }, 45000);
  };

  const startLocationUpdates = () => {
    const interval = setInterval(() => {
      if (order?.orderStatus === 'in_transit') {
        // Simulate movement towards delivery location
        const newLat = mockDeliveryAgent.currentLocation.latitude + (Math.random() - 0.5) * 0.001;
        const newLng = mockDeliveryAgent.currentLocation.longitude + (Math.random() - 0.5) * 0.001;
        
        mockDeliveryAgent.currentLocation = { latitude: newLat, longitude: newLng };
        updateTrackingLocation(orderId, { latitude: newLat, longitude: newLng });
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const handleCallAgent = () => {
    if (order?.tracking?.deliveryAgent) {
      window.open(`tel:${order.tracking.deliveryAgent.phoneNumber}`);
    }
  };

  const handleMessageAgent = () => {
    if (order?.tracking?.deliveryAgent) {
      // In a real app, this would open a chat interface
      toast.info('Chat feature coming soon!');
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'motorcycle': return Bike; // Using Bike icon for motorcycle
      case 'car': return Car;
      case 'bicycle': return Bike;
      default: return Truck;
    }
  };

  const getEstimatedTime = () => {
    if (!order) return '';
    
    const now = new Date();
    const estimated = new Date(order.estimatedDelivery);
    const diff = estimated.getTime() - now.getTime();
    const minutes = Math.max(0, Math.floor(diff / 60000));
    
    if (minutes === 0) return 'Arriving now';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!order) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Order Not Found</h3>
            <p className="text-gray-300 mb-4">The order you're looking for doesn't exist.</p>
            <Button onClick={onClose} className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusSteps = [
    { status: 'pending', label: 'Order Placed', description: 'Your order has been received' },
    { status: 'confirmed', label: 'Confirmed', description: 'Order confirmed by merchant' },
    { status: 'preparing', label: 'Preparing', description: 'Your order is being prepared' },
    { status: 'ready_for_pickup', label: 'Ready', description: 'Order ready for pickup' },
    { status: 'picked_up', label: 'Picked Up', description: 'Delivery agent has your order' },
    { status: 'in_transit', label: 'On the Way', description: 'Your order is being delivered' },
    { status: 'delivered', label: 'Delivered', description: 'Order delivered successfully' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] bg-gray-800/50 border-gray-700 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Order Tracking
              </CardTitle>
              <p className="text-gray-300 text-sm">Order #{order.id}</p>
            </div>
            {onClose && (
              <Button variant="ghost" onClick={onClose} className="text-gray-300 hover:text-white">
                Close
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Map Section */}
            <div className="lg:w-2/3 p-4">
              <div className="h-full relative">
                <div 
                  ref={mapRef}
                  className="w-full h-full bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-lg border border-gray-700 relative overflow-hidden"
                  style={{ minHeight: '300px' }}
                >
                  {/* Map Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-300">
                      <Navigation className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Live tracking map</p>
                      <p className="text-xs opacity-70">Delivery agent location updates</p>
                    </div>
                  </div>

                  {/* Delivery Agent Location */}
                  {order.tracking?.deliveryAgent && order.orderStatus === 'in_transit' && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Agent Location</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {order.tracking.deliveryAgent.currentLocation.latitude.toFixed(6)}, 
                        {order.tracking.deliveryAgent.currentLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {/* Estimated Time */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-3 shadow-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold">{getEstimatedTime()}</div>
                      <div className="text-xs opacity-90">Estimated arrival</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Details */}
            <div className="lg:w-1/3 p-4 border-l border-gray-700">
              {/* Delivery Agent Info */}
              {order.tracking?.deliveryAgent && (
                <Card className="mb-4 bg-gray-700/30 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={order.tracking.deliveryAgent.photo} />
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                          {order.tracking.deliveryAgent.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{order.tracking.deliveryAgent.name}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-300">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{order.tracking.deliveryAgent.rating}</span>
                          <span>•</span>
                          <span>{order.tracking.deliveryAgent.totalDeliveries} deliveries</span>
                        </div>
                      </div>
                      <Badge className={`${order.tracking.deliveryAgent.isOnline ? 'bg-green-500' : 'bg-gray-500'} text-white text-xs`}>
                        {order.tracking.deliveryAgent.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                      {React.createElement(getVehicleIcon(order.tracking.deliveryAgent.vehicleType), { className: 'w-4 h-4' })}
                      <span>{order.tracking.deliveryAgent.vehicleInfo}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCallAgent}
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                      <Button 
                        onClick={handleMessageAgent}
                        size="sm" 
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Status Timeline */}
              <Card className="bg-gray-700/30 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Order Status</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStep;
                      const isCurrent = index === currentStep;
                      const config = statusConfig[step.status as OrderStatus];
                      
                      return (
                        <div key={step.status} className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                              : 'bg-gray-600'
                          }`}>
                            {React.createElement(config.icon, { 
                              className: `w-4 h-4 ${isCompleted ? 'text-white' : 'text-gray-400'}` 
                            })}
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-400'}`}>
                              {step.label}
                            </div>
                            <div className="text-sm text-gray-500">{step.description}</div>
                            {isCurrent && (
                              <div className="text-xs text-green-400 mt-1">
                                {isSimulating ? 'Processing...' : 'Current step'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card className="mt-4 bg-gray-700/30 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Items:</span>
                    <span className="text-white">{order.items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-white">{order.grandTotal.toLocaleString()} CFA</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Payment:</span>
                    <Badge className={`${
                      order.paymentStatus === 'paid' ? 'bg-green-500' : 
                      order.paymentStatus === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    } text-white text-xs`}>
                      {order.paymentStatus.toUpperCase()}
                    </Badge>
                  </div>
                  {order.specialInstructions && (
                    <div className="text-sm">
                      <span className="text-gray-300">Instructions:</span>
                      <p className="text-white mt-1">{order.specialInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 