import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Trash2, Minus, Plus, ShoppingCart, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    merchant: {
      name: string;
    };
  };
  quantity: number;
  total_price: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  isLoading?: boolean;
  className?: string;
}

export function Cart({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  onCheckout,
  isLoading = false,
  className = '' 
}: CartProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const deliveryFee = subtotal > 10000 ? 0 : 500; // Free delivery over 10,000 XAF
  const total = subtotal + deliveryFee;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      onRemoveItem(itemId);
      return;
    }
    onUpdateQuantity(itemId, newQuantity);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    onCheckout();
  };

  if (items.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
          <p className="text-gray-500">Add some products to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart
            <Badge variant="secondary">{totalItems} items</Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearCart}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
              <img 
                src={item.product.image || '/placeholder.svg'} 
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2">
                  {item.product.name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{item.product.merchant.name}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-sm">
                    {formatPrice(item.product.price)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
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
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-right mt-1">
                  <span className="font-semibold text-sm">
                    {formatPrice(item.total_price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Cart Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal ({totalItems} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Delivery Fee</span>
            <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
              {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
            </span>
          </div>
          
          {deliveryFee > 0 && (
            <div className="text-xs text-gray-500">
              Free delivery on orders over {formatPrice(10000)}
            </div>
          )}
          
          <div className="border-t pt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
        
        {/* Checkout Button */}
        <Button 
          onClick={handleCheckout}
          disabled={isLoading || items.length === 0}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Processing...' : `Proceed to Checkout (${formatPrice(total)})`}
        </Button>
      </CardContent>
    </Card>
  );
} 