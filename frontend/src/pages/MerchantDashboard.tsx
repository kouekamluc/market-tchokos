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
  Store, 
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
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  isActive: boolean;
  createdAt: Date;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryLocation: {
    landmark: string;
    contactNumber: string;
  };
  createdAt: Date;
  estimatedDelivery: Date;
}

interface Analytics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    sales: number;
  }>;
  recentOrders: Order[];
}

export default function MerchantDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    if (!isAuthenticated || user?.user_type !== 'merchant') {
      navigate('/login');
      return;
    }

    // Simulate loading
    setTimeout(() => {
      setProducts([
        {
          id: '1',
          name: 'Fresh Tomatoes',
          description: 'Organic red tomatoes from local farms',
          price: 2500,
          category: 'Vegetables',
          stock: 50,
          image: '/placeholder.svg',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Sweet Plantains',
          description: 'Ripe yellow plantains',
          price: 1500,
          category: 'Fruits',
          stock: 30,
          image: '/placeholder.svg',
          isActive: true,
          createdAt: new Date()
        }
      ]);

      setOrders([
        {
          id: 'ORD-001',
          customerName: 'Marie Ngozi',
          customerPhone: '+237 6XX XXX XXX',
          items: [
            { id: '1', name: 'Fresh Tomatoes', quantity: 2, price: 2500 },
            { id: '2', name: 'Sweet Plantains', quantity: 1, price: 1500 }
          ],
          totalAmount: 6500,
          status: 'pending',
          paymentStatus: 'pending',
          deliveryLocation: {
            landmark: 'In front of Eto\'o House',
            contactNumber: '+237 6XX XXX XXX'
          },
          createdAt: new Date(),
          estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000)
        }
      ]);

      setAnalytics({
        totalSales: 125000,
        totalOrders: 45,
        averageOrderValue: 2778,
        topProducts: [
          { name: 'Fresh Tomatoes', sales: 25 },
          { name: 'Sweet Plantains', sales: 18 },
          { name: 'Organic Bananas', sales: 15 }
        ],
        recentOrders: []
      });

      setIsLoading(false);
    }, 1000);
  }, [isAuthenticated, user, navigate]);

  const handleOrderStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'preparing': return 'default';
      case 'ready_for_pickup': return 'default';
      case 'picked_up': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'preparing': return Package;
      case 'ready_for_pickup': return Package;
      case 'picked_up': return Package;
      case 'delivered': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  if (!isAuthenticated || user?.user_type !== 'merchant') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your business dashboard...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Business Hub</h1>
              <p className="text-gray-300">Manage your products, orders, and business analytics</p>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.profile_picture} />
                <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-white font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-gray-400 text-sm">{user?.business_name}</p>
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
                  <p className="text-gray-400 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold text-white">{analytics?.totalSales.toLocaleString()} CFA</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{analytics?.totalOrders}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Order Value</p>
                  <p className="text-2xl font-bold text-white">{analytics?.averageOrderValue.toLocaleString()} CFA</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Products</p>
                  <p className="text-2xl font-bold text-white">{products.filter(p => p.isActive).length}</p>
                </div>
                <Store className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Products
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-blue-500/20">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">#{order.id}</p>
                          <p className="text-gray-400 text-sm">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{order.totalAmount.toLocaleString()} CFA</p>
                          <Badge variant={getStatusBadgeVariant(order.status)} className="text-xs">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">{product.name}</p>
                            <p className="text-gray-400 text-sm">{product.sales} sales</p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                          <h3 className="text-white font-semibold">#{order.id}</h3>
                          <p className="text-gray-400 text-sm">{order.customerName} • {order.customerPhone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{order.totalAmount.toLocaleString()} CFA</p>
                          <Badge variant={getStatusBadgeVariant(order.status)} className="mt-1">
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Items:</p>
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <p key={item.id} className="text-white text-sm">
                                {item.quantity}x {item.name} - {item.price.toLocaleString()} CFA
                              </p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Delivery:</p>
                          <p className="text-white text-sm">{order.deliveryLocation.landmark}</p>
                          <p className="text-gray-400 text-sm">{order.deliveryLocation.contactNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {order.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                            onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                          >
                            Confirm
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                            onClick={() => handleOrderStatusUpdate(order.id, 'preparing')}
                          >
                            Prepare
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Product Management</CardTitle>
                  <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <h3 className="text-white font-semibold mb-1">{product.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{product.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Price:</span>
                          <span className="text-white font-medium">{product.price.toLocaleString()} CFA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Stock:</span>
                          <span className="text-white">{product.stock} units</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white">{product.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Sales Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">Sales charts and analytics coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Customer Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">Customer analytics coming soon</p>
                    </div>
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