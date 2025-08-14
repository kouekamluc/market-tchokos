import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Phone,
  CreditCard
} from 'lucide-react';
import { useOrder } from '@/hooks/useApi';
import { toast } from 'sonner';
import { useDeliveryTracking } from '@/contexts/DeliveryTrackingContext';
import TrackingMap from '@/components/TrackingMap';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useOrder(parseInt(orderId || '0'));
  const { 
    isConnected, 
    orderStatus, 
    locationUpdates, 
    etaUpdates, 
    connect, 
    disconnect 
  } = useDeliveryTracking();
  
  const [showTrackingMap, setShowTrackingMap] = useState(false);

  // Auto-connect to WebSocket when order is in transit
  useEffect(() => {
    if (order && order.status === 'out_for_delivery' && orderId) {
      connect(orderId);
      setShowTrackingMap(true);
    } else {
      disconnect();
      setShowTrackingMap(false);
    }

    return () => {
      disconnect();
    };
  }, [order, orderId, connect, disconnect]);

  // Get latest ETA and location data
  const latestETA = etaUpdates.length > 0 ? etaUpdates[etaUpdates.length - 1] : null;
  const latestLocation = locationUpdates.length > 0 ? locationUpdates[locationUpdates.length - 1] : null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'preparing':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'ready_for_delivery':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <Clock className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'preparing':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'ready_for_delivery':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'out_for_delivery':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'delivered':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Order not found</h3>
          <p className="text-gray-500 mb-4">The order you're looking for doesn't exist</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Order #{order.id}</h1>
            <p className="text-gray-400">Track your order status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-gray-400 text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Status:</span>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {order.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Method:</span>
                    <span className="text-white">{order.payment_method.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Tracking Map - Auto-opens when status is "out_for_delivery" */}
            {showTrackingMap && order.delivery_address && (
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    Live Delivery Tracking
                    {isConnected && (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        LIVE
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TrackingMap
                    orderId={orderId || ''}
                    pickupLocation={{
                      lat: order.delivery_address.latitude,
                      lon: order.delivery_address.longitude
                    }}
                    deliveryLocation={{
                      lat: order.delivery_address.latitude,
                      lon: order.delivery_address.longitude
                    }}
                    currentLocation={latestLocation ? {
                      lat: latestLocation.lat,
                      lon: latestLocation.lon
                    } : undefined}
                    bearing={latestLocation?.bearing}
                    speed={latestLocation?.speed}
                    eta={latestETA?.eta_minutes}
                    distance={latestETA?.distance_km}
                    isTracking={isConnected}
                    className="w-full"
                  />
                  
                  {/* Real-time Status Updates */}
                  {orderStatus && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="text-blue-400 font-medium mb-2">Delivery Agent</h4>
                      <p className="text-white text-sm">
                        {orderStatus.delivery_agent || 'Agent assigned'}
                      </p>
                      {latestETA && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-400">ETA: </span>
                          <span className="text-white font-medium">
                            {Math.round(latestETA.eta_minutes)} minutes
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const product = item.product || item.agri_product;
                    const price = item.product?.price || item.agri_product?.price_per_unit || 0;
                    
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg">
                        <img 
                          src={product?.images?.[0]?.image || '/placeholder.svg'} 
                          alt={product?.name || 'Product'}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">{product?.name}</p>
                          <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-white font-semibold">{formatPrice(price * item.quantity)}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal</span>
                    <span className="text-white">{formatPrice(order.total_amount - order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Delivery Fee</span>
                    <span className="text-white">{formatPrice(order.delivery_fee)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-white">Total</span>
                      <span className="text-white">{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Delivery Address
                  </h4>
                  <p className="text-gray-300 text-sm">{order.delivery_address.landmark}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {order.delivery_address.latitude.toFixed(6)}, {order.delivery_address.longitude.toFixed(6)}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact
                  </h4>
                  <p className="text-gray-300 text-sm">{order.delivery_address.contact_number}</p>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-700 pt-4 space-y-2">
                  <Button 
                    onClick={() => navigate('/marketplace')}
                    className="w-full"
                    variant="outline"
                  >
                    Continue Shopping
                  </Button>
                  <Button 
                    onClick={() => navigate('/cart')}
                    className="w-full"
                    variant="outline"
                  >
                    View Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;