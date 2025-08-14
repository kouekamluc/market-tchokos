import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, UserAddress } from '@/lib/api';
import { AddressDialog } from '@/components/AddressDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Package, 
  MapPin, 
  Clock, 
  Star, 
  Settings, 
  LogOut,
  ShoppingBag,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  // Fetch user's orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: () => apiClient.getOrders(),
    enabled: !!user,
  });

  // Fetch user's addresses
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => apiClient.getUserAddresses(),
    enabled: !!user,
  });

  const orders = ordersData?.results || [];

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleAddAddress = async (addressData: {
    name: string;
    landmark: string;
    latitude: number;
    longitude: number;
    contact_number: string;
    is_default?: boolean;
  }) => {
    try {
      await apiClient.createAddress(addressData);
      toast.success('Address added successfully');
      setShowAddAddress(false);
      // Refresh addresses
      window.location.reload();
    } catch (error) {
      toast.error('Failed to add address');
      console.error('Error adding address:', error);
    }
  };

  const handleEditAddress = async (addressData: Partial<UserAddress>) => {
    if (!editingAddress) return;
    
    try {
      await apiClient.updateAddress(parseInt(editingAddress.id), addressData);
      toast.success('Address updated successfully');
      setShowEditAddress(false);
      setEditingAddress(null);
      // Refresh addresses
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update address');
      console.error('Error updating address:', error);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await apiClient.deleteAddress(parseInt(addressId));
      toast.success('Address deleted successfully');
      // Refresh addresses
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete address');
      console.error('Error deleting address:', error);
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
      default:
        return 'bg-blue-500';
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="p-8 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <p className="text-white text-center">Please log in to view your dashboard</p>
          <Button className="mt-4 w-full" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Card>
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
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.first_name}!</h1>
              <p className="text-gray-300">Manage your orders, profile, and preferences</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Orders</p>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-green-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Active Orders</p>
                <p className="text-2xl font-bold text-white">
                  {orders.filter(order => !['delivered', 'cancelled'].includes(order.status)).length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-blue-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Delivery Addresses</p>
                <p className="text-2xl font-bold text-white">{addresses.length}</p>
              </div>
              <MapPin className="w-8 h-8 text-purple-400" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Member Since</p>
                <p className="text-2xl font-bold text-white">
                  {new Date(user.created_at).getFullYear()}
                </p>
              </div>
              <Star className="w-8 h-8 text-orange-400" />
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500">
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500">
              Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500">
              Addresses
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500">
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Orders</h3>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">No orders yet</p>
                  <Link to="/agri-connect">
                    <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
                        <div>
                          <p className="text-white font-medium">Order #{order.id}</p>
                          <p className="text-sm text-gray-300">
                            {order.items.length} items • {order.total_amount} CFA
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                        <Link to={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {orders.length > 3 && (
                    <div className="text-center pt-4">
                      <Link to="/orders">
                        <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                          View All Orders
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">All Orders</h3>
                <Link to="/agri-connect">
                  <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    New Order
                  </Button>
                </Link>
              </div>

              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">No orders found</p>
                  <Link to="/agri-connect">
                    <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-4 bg-gray-700/30 border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full ${getStatusColor(order.status)} flex items-center justify-center`}>
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <p className="text-white font-medium">Order #{order.id}</p>
                            <p className="text-sm text-gray-300">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-400">Items</p>
                          <p className="text-white">{order.items.length} products</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Total</p>
                          <p className="text-white font-medium">{order.total_amount} CFA</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Payment</p>
                          <p className="text-white">{order.payment_status}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4" />
                          <span>{order.delivery_address.landmark}</span>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                              View Details
                            </Button>
                          </Link>
                          {order.status === 'pending' && (
                            <Button variant="destructive" size="sm">
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
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-6">
            <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">Delivery Addresses</h3>
                        <Button 
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                          onClick={() => setShowAddAddress(true)}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Add Address
                        </Button>
                      </div>

              {addressesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">No delivery addresses found</p>
                  <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
                    Add Address
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <Card key={address.id} className="p-4 bg-gray-700/30 border-gray-600">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">{address.landmark}</span>
                          {address.is_default && (
                            <Badge className="bg-green-500 text-white text-xs">Default</Badge>
                          )}
                        </div>
                                                        <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-300 hover:text-white"
                                    onClick={() => {
                                      setEditingAddress(address);
                                      setShowEditAddress(true);
                                    }}
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    onClick={() => handleDeleteAddress(address.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{address.contact_number}</p>
                      <p className="text-xs text-gray-400">
                        {address.location.latitude}, {address.location.longitude}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Full Name</label>
                    <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Phone Number</label>
                    <p className="text-white">{user.phone_number}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">User Type</label>
                    <p className="text-white capitalize">{user.user_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Account Status</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-white">{user.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Member Since</label>
                    <p className="text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-600">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Address Dialog */}
        {showAddAddress && (
          <AddressDialog
            isOpen={showAddAddress}
            onClose={() => setShowAddAddress(false)}
            onSubmit={handleAddAddress}
            title="Add New Address"
          />
        )}

        {/* Edit Address Dialog */}
        {showEditAddress && editingAddress && (
          <AddressDialog
            isOpen={showEditAddress}
            onClose={() => {
              setShowEditAddress(false);
              setEditingAddress(null);
            }}
            onSubmit={handleEditAddress}
            title="Edit Address"
            address={editingAddress}
          />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
