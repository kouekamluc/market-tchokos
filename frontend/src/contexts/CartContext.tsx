import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { Cart, CartItem, AgriProduct } from '@/lib/api';
import { toast } from 'sonner';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addToCart: (product: AgriProduct, quantity: number) => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getCartItemCount: () => number;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const cartData = await apiClient.getCart();
      setCart(cartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
      console.error('Error loading cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (product: AgriProduct, quantity: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cartData = await apiClient.addToCart({
        agri_product_id: product.id,
        quantity: quantity
      });
      
      setCart(cartData);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error adding to cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (itemId: number, quantity: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cartData = await apiClient.updateCartItem(itemId, quantity);
      setCart(cartData);
      
      if (quantity === 0) {
        toast.success('Item removed from cart');
      } else {
        toast.success('Cart updated successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart item';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating cart item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cartData = await apiClient.removeFromCart(itemId);
      setCart(cartData);
      toast.success('Item removed from cart');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error removing from cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cartData = await apiClient.clearCart();
      setCart(cartData);
      toast.success('Cart cleared successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error clearing cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCartItemCount = (): number => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = (): number => {
    if (!cart) return 0;
    return cart.total_amount || 0;
  };

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    getCartItemCount,
    getCartTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};


