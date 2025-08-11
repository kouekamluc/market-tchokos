import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bike, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Download,
  Upload,
  Settings,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Navigation,
  Star,
  Zap,
  Shield,
  Award,
  Route
} from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  deliveryLocation: {
    landmark: string;
    address: string;
    coordinates: { lat: number; lng: number };
    contactNumber: string;
  };
  items: Array<{
    name: string;
    quantity: number;
  }>;
  totalAmount: number;
  deliveryFee: number;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  assignedAt: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery: Date;
  specialInstructions?: string;
}

interface Earnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  pending: number;
  completedDeliveries: number;
  averagePerDelivery: number;
}

interface Performance {
  rating: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  customerSatisfaction: number;
  averageDeliveryTime: number;
  topAreas: Array<{
    area: string;
    deliveries: number;
  }>;
}

interface RouteOptimization {
  currentLocation: { lat: number; lng: number };
  optimizedRoute: Array<{
    orderId: string;
    customerName: string;
    location: { lat: number; lng: number };
    estimatedTime: number;
  }>;
  totalDistance: number;
  estimatedTime: number;
}

export default function DeliveryAgent() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    if (!isAuthenticated || user?.user_type !== 'delivery_agent') {
      navigate('/login');
      return;
    }

    // Simulate loading
    setTimeout(() => {
      setOrders([
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerName: 'Marie Ngozi',
          customerPhone: '+237 6XX XXX XXX',
          pickupLocation: {
            name: 'Fresh Farm Market',
            address: '123 Market Street, Douala',
            coordinates: { lat: 4.0511, lng: 9.7679 }
          },
          deliveryLocation: {
            landmark: 'In front of Eto\'o House',
            address: '456 Main Street, Douala',
            coordinates: { lat: 4.0520, lng: 9.7685 },
            contactNumber: '+237 6XX XXX XXX'
          },
          items: [
            { name: 'Fresh Tomatoes', quantity: 2 },
            { name: 'Sweet Plantains', quantity: 1 }
          ],
          totalAmount: 6500,
          deliveryFee: 500,
          status: 'assigned',
          assignedAt: new Date(),
          estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
          specialInstructions: 'Please call when arriving'
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          customerName: 'Jean-Pierre Mbarga',
          customerPhone: '+237 6XX XXX XXX',
          pickupLocation: {
            name: 'Green Grocer',
            address: '789 Commerce Ave, Douala',
            coordinates: { lat: 4.0515, lng: 9.7680 }
          },
          deliveryLocation: {
            landmark: 'Near the bank',
            address: '321 Business District, Douala',
            coordinates: { lat: 4.0525, lng: 9.7690 },
            contactNumber: '+237 6XX XXX XXX'
          },
          items: [
            { name: 'Organic Bananas', quantity: 3 }
          ],
          totalAmount: 4500,
          deliveryFee: 500,
          status: 'picked_up',
          assignedAt: new Date(Date.now() - 30 * 60 * 1000),
          pickedUpAt: new Date(Date.now() - 10 * 60 * 1000),
          estimatedDelivery: new Date(Date.now() + 20 * 60 * 1000)
        }
      ]);

      setEarnings({
        today: 2500,
        thisWeek: 15000,
        thisMonth: 65000,
        total: 125000,
        pending: 5000,
        completedDeliveries: 45,
        averagePerDelivery: 555
      });

      setPerformance({
        rating: 4.8,
        totalDeliveries: 1247,
        onTimeDeliveries: 1189,
        customerSatisfaction: 96,
        averageDeliveryTime: 28,
        topAreas: [
          { area: 'Akwa', deliveries: 156 },
          { area: 'Bonanjo', deliveries: 134 },
          { area: 'Deido', deliveries: 98 }
        ]
      });

      setRouteOptimization({
        currentLocation: { lat: 4.0511, lng: 9.7679 },
        optimizedRoute: [
          {
            orderId: '1',
            customerName: 'Marie Ngozi',
            location: { lat: 4.0520, lng: 9.7685 },
            estimatedTime: 15
          },
          {
            orderId: '2',
            customerName: 'Jean-Pierre Mbarga',
            location: { lat: 4.0525, lng: 9.7690 },
            estimatedTime: 25
          }
        ],
        totalDistance: 2.5,
        estimatedTime: 40
      });

      setIsLoading(false);
    }, 1000);
  }, [isAuthenticated, user, navigate]);

  const handleOrderStatusUpdate = (orderId: string, newStatus: DeliveryOrder['status']) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedOrder = { ...order, status: newStatus };
        if (newStatus === 'picked_up') {
          updatedOrder.pickedUpAt = new Date();
        } else if (newStatus === 'delivered') {
          updatedOrder.deliveredAt = new Date();
        }
        return updatedOrder;
      }
      return order;
    }));
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
  };

  const getStatusBadgeVariant = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'assigned': return 'secondary';
      case 'picked_up': return 'default';
      case 'in_transit': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'assigned': return Clock;
      case 'picked_up': return Package;
      case 'in_transit': return Navigation;
      case 'delivered': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    toast.success(`You are now ${!isOnline ? 'online' : 'offline'}`);
  };

  if (!isAuthenticated || user?.user_type !== 'delivery_agent') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your delivery dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Delivery Hub</h1>
              <p className="text-gray-300">Manage your deliveries, routes, and earnings</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-gray-300 text-sm">{isOnline ? 'Online' : 'Offline'}</span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={toggleOnlineStatus}
                  className={`border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white ${
                    isOnline ? 'border-green-500 text-green-400' : ''
                  }`}
                >
                  {isOnline ? 'Go Offline' : 'Go Online'}
                </Button>
              </div>
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.profile_picture} />
                <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-white font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-gray-400 text-sm">Delivery Agent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Today's Earnings</p>
                  <p className="text-2xl font-bold text-white">{earnings?.today.toLocaleString()} CFA</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Orders</p>
                  <p className="text-2xl font-bold text-white">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <p className="text-2xl font-bold text-white">{performance?.rating}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Deliveries</p>
                  <p className="text-2xl font-bold text-white">{performance?.totalDeliveries}</p>
                </div>
                <Bike className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Route Optimization Widget */}
        {routeOptimization && (
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Route className="w-5 h-5" />
                Optimized Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Navigation className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Total Distance</p>
                  <p className="text-2xl font-bold text-white">{routeOptimization.totalDistance} km</p>
                </div>
                <div className="text-center">
                  <Clock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Estimated Time</p>
                  <p className="text-2xl font-bold text-white">{routeOptimization.estimatedTime} min</p>
                </div>
                <div className="text-center">
                  <Package className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Orders in Route</p>
                  <p className="text-2xl font-bold text-white">{routeOptimization.optimizedRoute.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Orders
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Earnings
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Orders */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Active Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(order => order.status !== 'delivered' && order.status !== 'cancelled').map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">#{order.orderNumber}</p>
                          <p className="text-gray-400 text-sm">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{order.deliveryFee.toLocaleString()} CFA</p>
                          <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">On-Time Rate</p>
                        <p className="text-gray-400 text-sm">Deliveries on time</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{Math.round((performance?.onTimeDeliveries || 0) / (performance?.totalDeliveries || 1) * 100)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Avg Delivery Time</p>
                        <p className="text-gray-400 text-sm">Minutes per delivery</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{performance?.averageDeliveryTime} min</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Customer Satisfaction</p>
                        <p className="text-gray-400 text-sm">Happy customers</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{performance?.customerSatisfaction}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Order Management</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold">#{order.orderNumber}</h3>
                          <p className="text-gray-400 text-sm">{order.customerName} • {order.customerPhone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{order.deliveryFee.toLocaleString()} CFA</p>
                          <Badge variant={getStatusBadgeVariant(order.status)} className="mt-1">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Pickup:</p>
                          <p className="text-white text-sm">{order.pickupLocation.name}</p>
                          <p className="text-gray-400 text-xs">{order.pickupLocation.address}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Delivery:</p>
                          <p className="text-white text-sm">{order.deliveryLocation.landmark}</p>
                          <p className="text-gray-400 text-xs">{order.deliveryLocation.contactNumber}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-1">Items:</p>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <p key={index} className="text-white text-sm">
                              {item.quantity}x {item.name}
                            </p>
                          ))}
                        </div>
                      </div>

                      {order.specialInstructions && (
                        <div className="mb-4 p-2 bg-gray-700/30 rounded">
                          <p className="text-gray-300 text-sm">
                            <strong>Instructions:</strong> {order.specialInstructions}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {order.assignedAt.toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'assigned' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                              onClick={() => handleOrderStatusUpdate(order.id, 'picked_up')}
                            >
                              Pick Up
                            </Button>
                          )}
                          {order.status === 'picked_up' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                              onClick={() => handleOrderStatusUpdate(order.id, 'in_transit')}
                            >
                              Start Delivery
                            </Button>
                          )}
                          {order.status === 'in_transit' && (
                            <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                              onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                            >
                              Mark Delivered
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Earnings Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Today</p>
                        <p className="text-gray-400 text-sm">Total earnings</p>
                      </div>
                      <p className="text-white font-semibold">{earnings?.today.toLocaleString()} CFA</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">This Week</p>
                        <p className="text-gray-400 text-sm">Weekly earnings</p>
                      </div>
                      <p className="text-white font-semibold">{earnings?.thisWeek.toLocaleString()} CFA</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">This Month</p>
                        <p className="text-gray-400 text-sm">Monthly earnings</p>
                      </div>
                      <p className="text-white font-semibold">{earnings?.thisMonth.toLocaleString()} CFA</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Pending</p>
                        <p className="text-gray-400 text-sm">Awaiting payment</p>
                      </div>
                      <p className="text-white font-semibold">{earnings?.pending.toLocaleString()} CFA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Delivery Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Completed Deliveries</p>
                        <p className="text-gray-400 text-sm">Total successful</p>
                      </div>
                      <p className="text-white font-semibold">{earnings?.completedDeliveries}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Average Per Delivery</p>
                        <p className="text-gray-400 text-sm">Typical earnings</p>
                      </div>
                      <p className="text-white font-semibold">{earnings?.averagePerDelivery.toLocaleString()} CFA</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Total Earnings</p>
                        <p className="text-gray-400 text-sm">All time</p>
                      </div>
                      <p className="text-white font-semibold">{earnings?.total.toLocaleString()} CFA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Rating</p>
                        <p className="text-gray-400 text-sm">Customer feedback</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white font-semibold">{performance?.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">On-Time Rate</p>
                        <p className="text-gray-400 text-sm">Deliveries on time</p>
                      </div>
                      <p className="text-white font-semibold">{Math.round((performance?.onTimeDeliveries || 0) / (performance?.totalDeliveries || 1) * 100)}%</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Satisfaction</p>
                        <p className="text-gray-400 text-sm">Customer satisfaction</p>
                      </div>
                      <p className="text-white font-semibold">{performance?.customerSatisfaction}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Top Delivery Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performance?.topAreas.map((area, index) => (
                      <div key={area.area} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">{area.area}</p>
                            <p className="text-gray-400 text-sm">{area.deliveries} deliveries</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 