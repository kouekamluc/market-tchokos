import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export const useCart = () => {
  const queryClient = useQueryClient();

  // Get cart data
  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.getCart(),
    enabled: !!localStorage.getItem('access_token'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add item to cart
  const addToCart = useMutation({
    mutationFn: async ({ productId, variantId, quantity }: {
      productId: number;
      variantId?: number;
      quantity: number;
    }) => {
      return apiClient.addToCart({
        product_id: productId,
        variant_id: variantId,
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item added to cart!');
    },
    onError: (error: unknown) => {
      console.error('Error adding to cart:', error);
      toast.error((error as Record<string, unknown>)?.response?.data?.error || 'Failed to add item to cart');
    }
  });

  // Update cart item quantity
  const updateCartItem = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      return apiClient.updateCartItem(itemId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart updated!');
    },
    onError: (error: unknown) => {
      console.error('Error updating cart:', error);
      toast.error((error as Record<string, unknown>)?.response?.data?.error || 'Failed to update cart');
    }
  });

  // Remove item from cart
  const removeFromCart = useMutation({
    mutationFn: async (itemId: number) => {
      return apiClient.removeFromCart(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart!');
    },
    onError: (error: unknown) => {
      console.error('Error removing from cart:', error);
      toast.error((error as Record<string, unknown>)?.response?.data?.error || 'Failed to remove item from cart');
    }
  });

  // Clear cart
  const clearCart = useMutation({
    mutationFn: async () => {
      return apiClient.clearCart();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared!');
    },
    onError: (error: unknown) => {
      console.error('Error clearing cart:', error);
      toast.error((error as Record<string, unknown>)?.response?.data?.error || 'Failed to clear cart');
    }
  });

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };
}; 