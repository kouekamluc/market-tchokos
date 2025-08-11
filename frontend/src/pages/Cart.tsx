import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Minus, Plus, ShoppingCart, MapPin, ArrowLeft, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useCart, useUpdateCartItem, useRemoveFromCart, useClearCart } from '@/hooks/useApi';
import { Cart as CartType } from '@/lib/api';

const Cart = () => {
  const navigate = useNavigate();
  const { data: cart, isLoading, error } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      await handleRemoveItem(itemId);
      return;
    }
    
    try {
      await updateCartItem.mutateAsync({ itemId, quantity: newQuantity });
      toast.success('Cart updated');
    } catch (error) {
      toast.error('Failed to update cart');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeFromCart.mutateAsync(itemId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart.mutateAsync();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  const calculateTotals = (cart: CartType) => {
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.product?.price || item.agri_product?.price_per_unit || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    const deliveryFee = subtotal > 10000 ? 0 : 500; // Free delivery over 10,000 XAF
    const total = subtotal + deliveryFee;
    
    return { subtotal, deliveryFee, total };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">Error loading cart</h3>
          <p className="text-gray-500 mb-4">Please try again later</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
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
              <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
              <p className="text-gray-400">Manage your items</p>
            </div>
          </div>

          {/* Empty Cart */}
          <Card className="p-12 text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started!</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/marketplace')}>
                Browse Marketplace
              </Button>
              <Button variant="outline" onClick={() => navigate('/agri-connect')}>
                Browse AgriConnect
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const { subtotal, deliveryFee, total } = calculateTotals(cart);

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
            <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
            <p className="text-gray-400">{cart.item_count} items</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <ShoppingCart className="h-5 w-5" />
                    Cart Items
                    <Badge variant="secondary">{cart.item_count}</Badge>
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearCart}
                    disabled={clearCart.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {cart.items.map((item) => {
                  const product = item.product || item.agri_product;
                  const merchant = item.product?.merchant || item.agri_product?.farmer;
                  const price = item.product?.price || item.agri_product?.price_per_unit || 0;
                  
                  return (
                    <div key={item.id} className="flex gap-3 p-3 border border-gray-700 rounded-lg bg-gray-800/30">
                      <img 
                        src={product?.images?.[0]?.image || '/placeholder.svg'} 
                        alt={product?.name || 'Product'}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 text-white">
                          {product?.name}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{merchant?.business_name || `${merchant?.first_name} ${merchant?.last_name}`}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold text-sm text-white">
                            {formatPrice(price)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              disabled={updateCartItem.isPending}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                handleQuantityChange(item.id, value);
                              }}
                              className="w-12 h-6 text-center text-xs"
                              min="1"
                            />
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              disabled={updateCartItem.isPending}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeFromCart.isPending}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-right mt-1">
                          <span className="font-semibold text-sm text-white">
                            {formatPrice(price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
          
          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Subtotal ({cart.item_count} items)</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Delivery Fee</span>
                    <span className={deliveryFee === 0 ? 'text-green-400' : 'text-white'}>
                      {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  
                  {deliveryFee > 0 && (
                    <div className="text-xs text-gray-400">
                      Free delivery on orders over {formatPrice(10000)}
                    </div>
                  )}
                  
                  <div className="border-t border-gray-700 pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-white">Total</span>
                      <span className="text-white">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCheckout}
                  disabled={cart.items.length === 0}
                  className="w-full"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
                
                <div className="text-xs text-gray-400 text-center">
                  Secure checkout powered by ChronoConnect
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 