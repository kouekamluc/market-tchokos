// React Query hooks for ChronoConnect API
// This file provides custom hooks that wrap the API client with React Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import type {
  User,
  Category,
  Product,
  AgriCategory,
  AgriProduct,
  Cart,
  Order,
  DeliveryTask,
  Notification,
  UserAddress,
} from '@/lib/api'

// Authentication hooks
export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export const useRegister = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: {
      email: string
      password: string
      first_name: string
      last_name: string
      phone_number: string
      role: 'customer' | 'merchant' | 'farmer' | 'delivery_agent'
    }) => apiClient.register(userData),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: apiClient.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Marketplace hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: apiClient.getCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useProducts = (params?: {
  search?: string
  category?: number
  min_price?: number
  max_price?: number
  in_stock?: boolean
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiClient.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.getProduct(id),
    enabled: !!id,
  })
}

export const useProductReviews = (productId: number) => {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: () => apiClient.getProductReviews(productId),
    enabled: !!productId,
  })
}

// AgriConnect hooks
export const useAgriCategories = () => {
  return useQuery({
    queryKey: ['agri-categories'],
    queryFn: apiClient.getAgriCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useAgriProducts = (params?: {
  search?: string
  category?: number
  min_price?: number
  max_price?: number
  organic?: boolean
  harvested_today?: boolean
  within_5km?: boolean
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: ['agri-products', params],
    queryFn: () => apiClient.getAgriProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAgriProduct = (id: number) => {
  return useQuery({
    queryKey: ['agri-product', id],
    queryFn: () => apiClient.getAgriProduct(id),
    enabled: !!id,
  })
}

// Cart hooks
export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: apiClient.getCart,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useAddToCart = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      product_id?: number
      agri_product_id?: number
      quantity: number
    }) => apiClient.addToCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      apiClient.updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (itemId: number) => apiClient.removeFromCart(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useClearCart = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => apiClient.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

// Order hooks
export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      delivery_address_id: number
      payment_method: 'mobile_money' | 'cash_on_delivery' | 'card'
      mobile_money_provider?: 'mtn' | 'orange' | 'moov'
      mobile_money_phone?: string
    }) => apiClient.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}

export const useOrders = (params?: {
  status?: string
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => apiClient.getOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useOrder = (id: number) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => apiClient.getOrder(id),
    enabled: !!id,
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiClient.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

// User address hooks
export const useUserAddresses = () => {
  return useQuery({
    queryKey: ['user-addresses'],
    queryFn: apiClient.getUserAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateAddress = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      landmark: string
      latitude: number
      longitude: number
      contact_number: string
      is_default?: boolean
    }) => apiClient.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] })
    },
  })
}

export const useUpdateAddress = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserAddress> }) =>
      apiClient.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] })
    },
  })
}

export const useDeleteAddress = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] })
    },
  })
}

// Delivery agent hooks
export const useAvailableTasks = () => {
  return useQuery({
    queryKey: ['available-tasks'],
    queryFn: apiClient.getAvailableTasks,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}

export const useMyTasks = () => {
  return useQuery({
    queryKey: ['my-tasks'],
    queryFn: apiClient.getMyTasks,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useAcceptTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: number) => apiClient.acceptTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: DeliveryTask['status'] }) =>
      apiClient.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
    },
  })
}

export const useUpdateLocation = () => {
  return useMutation({
    mutationFn: ({ latitude, longitude }: { latitude: number; longitude: number }) =>
      apiClient.updateLocation(latitude, longitude),
  })
}

// Merchant/Farmer hooks
export const useMyProducts = (params?: {
  marketplace?: boolean
  agri_connect?: boolean
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: ['my-products', params],
    queryFn: () => apiClient.getMyProducts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: {
      name: string
      description: string
      price: number
      category_id: number
      stock_quantity: number
      images?: File[]
    }) => apiClient.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
    },
  })
}

export const useMyOrders = (params?: {
  status?: string
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: ['my-orders', params],
    queryFn: () => apiClient.getMyOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: Order['status'] }) =>
      apiClient.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })
}

export const useRequestDelivery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (orderId: number) => apiClient.requestDelivery(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })
}

// Notification hooks
export const useNotifications = (params?: {
  unread_only?: boolean
  page?: number
  page_size?: number
}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => apiClient.getNotifications(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (notificationId: number) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: apiClient.markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
} 