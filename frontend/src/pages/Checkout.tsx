import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  CreditCard, 
  Phone, 
  Clock, 
  Truck, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { LocationPicker } from '@/components/LocationPicker';
import { useCart, useCreateOrder, useUserAddresses, useCreateAddress } from '@/hooks/useApi';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  merchantId: string;
  merchantName: string;
}

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { selectedLocation, savedLocations } = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams();

  // API hooks
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses } = useUserAddresses();
  const createOrder = useCreateOrder();
  const createAddress = useCreateAddress();

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<{
    latitude: number;
    longitude: number;
    landmark?: string;
    contactNumber?: string;
  } | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'cash_on_delivery' | 'card'>('mobile_money');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'mtn' | 'orange' | 'moov'>('mtn');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Calculate totals
  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, deliveryFee: 0, total: 0 };
    
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.product?.price || item.agri_product?.price_per_unit || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    const deliveryFee = subtotal > 10000 ? 0 : 500; // Free delivery over 10,000 XAF
    const total = subtotal + deliveryFee;
    
    return { subtotal, deliveryFee, total };
  };

  const { subtotal, deliveryFee, total } = calculateTotals();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to complete checkout');
      navigate('/login');
      return;
    }

    // If user has a default location, use it
    if (selectedLocation) {
      setDeliveryLocation({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        landmark: selectedLocation.landmark,
        contactNumber: selectedLocation.contactNumber
      });
    }

    // Set default address if available
    if (addresses && addresses.length > 0) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [isAuthenticated, selectedLocation, navigate, addresses]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cart && cart.items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleLocationSelected = (location: {
    latitude: number;
    longitude: number;
    landmark?: string;
    contactNumber?: string;
  }) => {
    setDeliveryLocation(location);
    setShowLocationPicker(false);
    toast.success('Delivery location selected!');
  };

  const handlePlaceOrder = async () => {
    if (!deliveryLocation && !selectedAddressId) {
      toast.error('Please select a delivery location');
      return;
    }

    if (paymentMethod === 'mobile_money' && !mobileMoneyPhone) {
      toast.error('Please enter your mobile money phone number');
      return;
    }

    try {
      // Create delivery address if needed
      let addressId = selectedAddressId;
      if (!addressId && deliveryLocation) {
        const newAddress = await createAddress.mutateAsync({
          landmark: deliveryLocation.landmark || 'Delivery Location',
          latitude: deliveryLocation.latitude,
          longitude: deliveryLocation.longitude,
          contact_number: deliveryLocation.contactNumber || user?.phone_number || '',
          is_default: true
        });
        addressId = newAddress.id;
      }

      if (!addressId) {
        throw new Error('No delivery address available');
      }

      // Create order
      const orderData = {
        delivery_address_id: addressId,
        payment_method: paymentMethod,
        ...(paymentMethod === 'mobile_money' && {
          mobile_money_provider: mobileMoneyProvider,
          mobile_money_phone: mobileMoneyPhone
        })
      };

      const order = await createOrder.mutateAsync(orderData);

      toast.success('Order placed successfully!', {
        description: `Order #${order.id} has been created`,
        action: {
          label: 'Track Order',
          onClick: () => navigate(`/order/${order.id}`)
        }
      });

      // Redirect to order tracking
      navigate(`/order/${order.id}`);
    } catch (error) {
      console.error('Order placement failed:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  const getLocationDisplay = () => {
    if (!deliveryLocation) return 'No location selected';
    
    const coords = `${deliveryLocation.latitude.toFixed(6)}, ${deliveryLocation.longitude.toFixed(6)}`;
    if (deliveryLocation.landmark) {
      return `${deliveryLocation.landmark} (${coords})`;
    }
    return coords;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
            <p className="text-gray-300 mb-4">Please log in to complete your checkout.</p>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
          <p className="text-gray-300">Complete your order and select delivery location</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Location */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveryLocation ? (
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{getLocationDisplay()}</p>
                        {deliveryLocation.contactNumber && (
                          <p className="text-gray-300 text-sm mt-1">
                            Contact: {deliveryLocation.contactNumber}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLocationPicker(true)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-4">Select your delivery location</p>
                    <Button
                      onClick={() => setShowLocationPicker(true)}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                    >
                      Drop a Pin
                    </Button>
                  </div>
                )}

                {/* Saved Locations */}
                {savedLocations.length > 0 && (
                  <div>
                    <Label className="text-gray-200 mb-2 block">Quick Select</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {savedLocations.slice(0, 4).map((location) => (
                        <Button
                          key={location.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleLocationSelected({
                            latitude: location.latitude,
                            longitude: location.longitude,
                            landmark: location.landmark,
                            contactNumber: location.contactNumber
                          })}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white justify-start"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">{location.name}</div>
                            <div className="text-xs opacity-70">{location.landmark}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value)}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-green-500 focus:ring-green-500">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="mobile_money" className="text-gray-200 hover:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Mobile Money
                      </div>
                    </SelectItem>
                    <SelectItem value="cash_on_delivery" className="text-gray-200 hover:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Cash on Delivery
                      </div>
                    </SelectItem>
                    <SelectItem value="card" className="text-gray-200 hover:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Credit/Debit Card
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Mobile Money Fields */}
                {paymentMethod === 'mobile_money' && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <Label htmlFor="mobile-provider" className="text-gray-300">Mobile Money Provider</Label>
                      <Select value={mobileMoneyProvider} onValueChange={(value: string) => setMobileMoneyProvider(value)}>
                        <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-green-500 focus:ring-green-500">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="mtn" className="text-gray-200 hover:bg-gray-700">MTN Mobile Money</SelectItem>
                          <SelectItem value="orange" className="text-gray-200 hover:bg-gray-700">Orange Money</SelectItem>
                          <SelectItem value="moov" className="text-gray-200 hover:bg-gray-700">Moov Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="mobile-phone" className="text-gray-300">Phone Number</Label>
                      <Input
                        id="mobile-phone"
                        type="tel"
                        value={mobileMoneyPhone}
                        onChange={(e) => setMobileMoneyPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Instructions */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special delivery instructions (optional)"
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
                  rows={3}
                />
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
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                      <p className="text-gray-400 text-sm mt-2">Loading cart...</p>
                    </div>
                  ) : cart && cart.items.length > 0 ? (
                    cart.items.map((item) => {
                      const product = item.product || item.agri_product;
                      const merchant = item.product?.merchant || item.agri_product?.farmer;
                      const price = item.product?.price || item.agri_product?.price_per_unit || 0;
                      
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <img 
                              src={product?.images?.[0]?.image || '/placeholder.svg'} 
                              alt={product?.name || 'Product'} 
                              className="w-8 h-8 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm line-clamp-2">{product?.name}</p>
                            <p className="text-gray-400 text-xs">{merchant?.business_name || `${merchant?.first_name} ${merchant?.last_name}`}</p>
                            <p className="text-gray-300 text-xs">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-white font-semibold text-sm">{(price * item.quantity).toLocaleString()} CFA</p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">No items in cart</p>
                    </div>
                  )}
                </div>

                <Separator className="bg-gray-700" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal ({cart?.item_count || 0} items)</span>
                    <span>{subtotal.toLocaleString()} CFA</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? 'text-green-400' : ''}>
                      {deliveryFee === 0 ? 'Free' : `${deliveryFee.toLocaleString()} CFA`}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="text-xs text-gray-500">
                      Free delivery on orders over 10,000 CFA
                    </div>
                  )}
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total</span>
                    <span>{total.toLocaleString()} CFA</span>
                  </div>
                </div>

                {/* Estimated Delivery */}
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Estimated Delivery</span>
                  </div>
                  <p className="text-white font-medium mt-1">45 minutes</p>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  disabled={!deliveryLocation && !selectedAddressId || createOrder.isPending || cartLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-3 shadow-lg"
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Place Order ({total.toLocaleString()} CFA)
                    </>
                  )}
                </Button>

                {!deliveryLocation && (
                  <p className="text-red-400 text-sm text-center">
                    Please select a delivery location
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelected={handleLocationSelected}
          onCancel={() => setShowLocationPicker(false)}
          initialLocation={deliveryLocation || undefined}
        />
      )}
    </div>
  );
}