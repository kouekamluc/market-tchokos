import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Clock, 
  Phone, 
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

const Orders = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch orders list
  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => apiClient.getOrders(),
  });

  // Fetch specific order if orderId is provided
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiClient.getOrder(parseInt(orderId!)),
    enabled: !!orderId,
  });

  const orders = ordersData?.results || [];

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      setIsCancelling(true);
      await apiClient.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      refetchOrders();
    } catch (error) {
      toast.error('Failed to cancel order');
      console.error('Error cancelling order:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'preparing':
        return 'bg-purple-500';
      case 'ready_for_delivery':
        return 'bg-indigo-500';
      case 'out_for_delivery':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your order has been placed and is awaiting confirmation';
      case 'confirmed':
        return 'Your order has been confirmed and is being prepared';
      case 'preparing':
        return 'Your order is being prepared by the farmer';
      case 'ready_for_delivery':
        return 'Your order is ready and waiting for pickup';
      case 'out_for_delivery':
        return 'Your order is on its way to you';
      case 'delivered':
        return 'Your order has been delivered successfully';
      case 'cancelled':
        return 'Your order has been cancelled';
      default:
        return 'Order status unknown';
    }
  };

  // If orderId is provided, show single order view
  if (orderId && order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link to="/orders" className="inline-flex items-center text-gray-300 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Order #{order.id}</h1>
                <p className="text-gray-300">{getStatusDescription(order.status)}</p>
              </div>
              <Badge className={`${getStatusColor(order.status)} text-white px-4 py-2 text-lg`}>
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">Order Items</h3>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
                      <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{item.agri_product.name}</h4>
                        <p className="text-sm text-gray-300">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-400">Price: {item.price} CFA</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{item.total_price} CFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Order Timeline */}
              <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">Order Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-white font-medium">Order Placed</p>
                      <p className="text-sm text-gray-300">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {order.status !== 'pending' && (
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-white font-medium">Order Confirmed</p>
                        <p className="text-sm text-gray-300">Confirmed by farmer</p>
                      </div>
                    </div>
                  )}
                  {['preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered'].includes(order.status) && (
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="text-white font-medium">Order Prepared</p>
                        <p className="text-sm text-gray-300">Ready for delivery</p>
                      </div>
                    </div>
                  )}
                  {['out_for_delivery', 'delivered'].includes(order.status) && (
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="text-white font-medium">Out for Delivery</p>
                        <p className="text-sm text-gray-300">On the way to you</p>
                      </div>
                    </div>
                  )}
                  {order.status === 'delivered' && (
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-white font-medium">Delivered</p>
                        <p className="text-sm text-gray-300">Order completed successfully</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Subtotal</span>
                    <span className="text-white">{order.total_amount - order.delivery_fee} CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Delivery Fee</span>
                    <span className="text-white">{order.delivery_fee} CFA</span>
                  </div>
                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex justify-between">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-white font-bold text-lg">{order.total_amount} CFA</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">Delivery Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-white">{order.delivery_address.landmark}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span className="text-white">{order.delivery_address.contact_number}</span>
                  </div>
                  {order.estimated_delivery_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">
                        Estimated: {new Date(order.estimated_delivery_time).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-white capitalize">{order.payment_method.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white capitalize">{order.payment_status}</span>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              {order.status === 'pending' && (
                <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={isCancelling}
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show orders list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-gray-300 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Orders</h1>
              <p className="text-gray-300">Track your orders and view order history</p>
            </div>
            <Link to="/agri-connect">
              <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                <ShoppingBag className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Orders List */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          {ordersLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No orders yet</h3>
              <p className="text-gray-300 mb-6">Start shopping to see your orders here</p>
              <Link to="/agri-connect">
                <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="p-6 bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(order.status)} flex items-center justify-center`}>
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-lg">Order #{order.id}</h3>
                        <p className="text-sm text-gray-300">
                          {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Items</p>
                      <p className="text-white font-medium">{order.items.length} products</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Amount</p>
                      <p className="text-white font-medium">{order.total_amount} CFA</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Payment Status</p>
                      <p className="text-white capitalize">{order.payment_status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Payment Method</p>
                      <p className="text-white capitalize">{order.payment_method.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{order.delivery_address.landmark}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                          View Details
                        </Button>
                      </Link>
                      {order.status === 'pending' && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={isCancelling}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Orders;


