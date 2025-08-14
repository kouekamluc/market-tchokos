// API Configuration and Types for ChronoConnect Frontend
// This file handles all communication with the Django backend

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Common API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  user_type: 'customer' | 'merchant' | 'farmer' | 'delivery_agent' | 'admin';
  is_verified: boolean;
  is_active: boolean;
  profile_picture?: string;
  business_name?: string;
  business_description?: string;
  rating?: number;
  total_deliveries?: number;
  total_earnings?: number;
  is_available?: boolean;
  created_at: string;
}

export interface UserAddress {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  landmark: string;
  contact_number: string;
  is_default: boolean;
  created_at: string;
}



// AgriConnect Types
export interface AgriCategory {
  id: number;
  name: string;
  description: string;
  image?: string;
  parent?: number;
  children?: AgriCategory[];
}

export interface AgriProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  category: AgriCategory;
  farmer: User;
  farm: Farm;
  images: AgriProductImage[];
  average_rating: number;
  review_count: number;
  stock_quantity: number;
  unit: string;
  harvest_date: string;
  is_organic: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgriProductImage {
  id: number;
  product: number;
  image: string;
  is_primary: boolean;
  alt_text: string;
}

export interface AgriProductReview {
  id: string;
  product: string;
  user: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product: string;
  user: number;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface Farm {
  id: number;
  farmer: User;
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  size_hectares: number;
  created_at: string;
}

// Cart and Order Types
export interface CartItem {
  id: number;
  cart: number;
  agri_product: AgriProduct;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Cart {
  id: number;
  user: User;
  items: CartItem[];
  total_amount: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order: number;
  agri_product: AgriProduct;
  quantity: number;
  price: number;
  total_price: number;
}

export interface Order {
  id: number;
  user: User;
  farmer: User;
  items: OrderItem[];
  total_amount: number;
  delivery_fee: number;
  commission_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'mobile_money' | 'cash_on_delivery' | 'card';
  delivery_address: UserAddress;
  delivery_agent?: User;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  created_at: string;
  updated_at: string;
}

// Logistics Types
export interface DeliveryTask {
  id: number;
  order: Order;
  delivery_agent?: User;
  pickup_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  delivery_location: {
    latitude: number;
    longitude: number;
    address: string;
    landmark: string;
  };
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  estimated_pickup_time?: string;
  actual_pickup_time?: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAgentLocation {
  id: number;
  agent: User;
  latitude: number;
  longitude: number;
  is_online: boolean;
  last_updated: string;
}

// Payment Types
export interface Payment {
  id: number;
  order: Order;
  amount: number;
  payment_method: 'mobile_money' | 'cash_on_delivery' | 'card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  mobile_money_transaction?: MobileMoneyTransaction;
  created_at: string;
  updated_at: string;
}

export interface MobileMoneyTransaction {
  id: number;
  payment: Payment;
  provider: 'mtn' | 'orange' | 'moov';
  phone_number: string;
  transaction_id: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
}

// Notification Types
export interface Notification {
  id: number;
  user: User;
  title: string;
  message: string;
  notification_type: 'order_update' | 'delivery_update' | 'payment_update' | 'system';
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await this.refreshToken();
          // Retry the request
          headers.Authorization = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, { ...config, headers });
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          return await retryResponse.json();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.access;
        localStorage.setItem('access_token', data.access);
      } else {
        // Refresh failed, redirect to login
        this.logout();
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Authentication
  async login(phoneNumber: string, password: string): Promise<{ access: string; refresh: string; user: User }> {
    const response = await this.request<{ 
      message: string;
      user: User;
      tokens: { access: string; refresh: string; }
    }>('/users/login/', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, password }),
    });
    
    this.setToken(response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);
    return {
      access: response.tokens.access,
      refresh: response.tokens.refresh,
      user: response.user
    };
  }

  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    role: 'customer' | 'merchant' | 'farmer' | 'delivery_agent';
  }): Promise<{ access: string; refresh: string; user: User }> {
    const response = await this.request<{ 
      message: string;
      user: User;
      tokens: { access: string; refresh: string; }
    }>('/users/register/', {
      method: 'POST',
      body: JSON.stringify({
        username: userData.email,
        email: userData.email,
        password: userData.password,
        password_confirm: userData.password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        user_type: userData.role
      }),
    });
    
    this.setToken(response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);
    return {
      access: response.tokens.access,
      refresh: response.tokens.refresh,
      user: response.user
    };
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/profile/');
  }



  // AgriConnect API
  async getAgriCategories(): Promise<AgriCategory[]> {
    return this.request<AgriCategory[]>('/agri-connect/categories/');
  }

  async getAgriProducts(params?: {
    search?: string;
    category?: number;
    min_price?: number;
    max_price?: number;
    organic?: boolean;
    harvested_today?: boolean;
    within_5km?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AgriProduct>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<AgriProduct>>(`/agri-connect/products/?${searchParams.toString()}`);
  }

  async getAgriProduct(id: number): Promise<AgriProduct> {
    return this.request<AgriProduct>(`/agri-connect/products/${id}/`);
  }

  async getAgriProductReviews(productId: number): Promise<ProductReview[]> {
    return this.request<ProductReview[]>(`/agri-connect/products/${productId}/reviews/`);
  }

  // Cart API
  async getCart(): Promise<Cart> {
    try {
      return this.request<Cart>('/agri-connect/cart/');
    } catch (error) {
      // If cart doesn't exist, create one by making a POST request
      if (error instanceof Error && error.message.includes('404')) {
        return this.request<Cart>('/agri-connect/cart/', {
          method: 'POST',
          body: JSON.stringify({}),
        });
      }
      throw error;
    }
  }

  async addToCart(data: {
    agri_product_id: number;
    quantity: number;
  }): Promise<Cart> {
    try {
      // First get the user's cart
      const cart = await this.getCart();
      
      // Check if cart has an ID
      if (!cart || !cart.id) {
        throw new Error('Cart not found or invalid');
      }
      
      return this.request<Cart>(`/agri-connect/cart/${cart.id}/add_item/`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async updateCartItem(itemId: number, quantity: number): Promise<Cart> {
    try {
      // First get the user's cart
      const cart = await this.getCart();
      
      // Check if cart has an ID
      if (!cart || !cart.id) {
        throw new Error('Cart not found or invalid');
      }
      
      return this.request<Cart>(`/agri-connect/cart/${cart.id}/update_item/`, {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId, quantity }),
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  }

  async removeFromCart(itemId: number): Promise<Cart> {
    try {
      // First get the user's cart
      const cart = await this.getCart();
      
      // Check if cart has an ID
      if (!cart || !cart.id) {
        throw new Error('Cart not found or invalid');
      }
      
      return this.request<Cart>(`/agri-connect/cart/${cart.id}/remove_item/`, {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId }),
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  async clearCart(): Promise<Cart> {
    try {
      // First get the user's cart
      const cart = await this.getCart();
      
      // Check if cart has an ID
      if (!cart || !cart.id) {
        throw new Error('Cart not found or invalid');
      }
      
      return this.request<Cart>(`/agri-connect/cart/${cart.id}/clear/`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }

  // Order API
  async createOrder(data: {
    delivery_address_id: number;
    payment_method: 'mobile_money' | 'cash_on_delivery' | 'card';
    mobile_money_provider?: 'mtn' | 'orange' | 'moov';
    mobile_money_phone?: string;
  }): Promise<Order> {
    return this.request<Order>('/agri-connect/orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<Order>>(`/agri-connect/orders/?${searchParams.toString()}`);
  }

  async getOrder(id: number): Promise<Order> {
    return this.request<Order>(`/agri-connect/orders/${id}/`);
  }

  async cancelOrder(id: number): Promise<Order> {
    return this.request<Order>(`/agri-connect/orders/${id}/cancel/`, {
      method: 'POST',
    });
  }

  // User Address API
  async getUserAddresses(): Promise<UserAddress[]> {
    return this.request<UserAddress[]>('/users/addresses/');
  }

  async createAddress(data: {
    landmark: string;
    latitude: number;
    longitude: number;
    contact_number: string;
    is_default?: boolean;
  }): Promise<UserAddress> {
    return this.request<UserAddress>('/users/addresses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAddress(id: number, data: Partial<UserAddress>): Promise<UserAddress> {
    return this.request<UserAddress>(`/users/addresses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAddress(id: number): Promise<void> {
    return this.request<void>(`/users/addresses/${id}/`, {
      method: 'DELETE',
    });
  }

  // Delivery Agent API
  async getAvailableTasks(): Promise<DeliveryTask[]> {
    return this.request<DeliveryTask[]>('/logistics/tasks/available/');
  }

  async getMyTasks(): Promise<DeliveryTask[]> {
    return this.request<DeliveryTask[]>('/logistics/tasks/my-tasks/');
  }

  async acceptTask(taskId: number): Promise<DeliveryTask> {
    return this.request<DeliveryTask>(`/logistics/tasks/${taskId}/accept/`, {
      method: 'POST',
    });
  }

  async updateTaskStatus(taskId: number, status: DeliveryTask['status']): Promise<DeliveryTask> {
    return this.request<DeliveryTask>(`/logistics/tasks/${taskId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateLocation(latitude: number, longitude: number): Promise<DeliveryAgentLocation> {
    return this.request<DeliveryAgentLocation>('/logistics/location/', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  // Merchant/Farmer API
  async getMyProducts(params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AgriProduct>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<AgriProduct>>(`/agri-connect/farmer/products/?${searchParams.toString()}`);
  }

  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    category_id: number;
    stock_quantity: number;
    images?: File[];
  }): Promise<AgriProduct> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach((file, index) => {
          formData.append(`images`, file);
        });
      } else {
        formData.append(key, value.toString());
      }
    });

    return this.request<AgriProduct>('/agri-connect/farmer/products/', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async getMyOrders(params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<Order>>(`/agri-connect/farmer/orders/?${searchParams.toString()}`);
  }

  async updateOrderStatus(orderId: number, status: Order['status']): Promise<Order> {
    return this.request<Order>(`/agri-connect/farmer/orders/${orderId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async requestDelivery(orderId: number): Promise<DeliveryTask> {
    return this.request<DeliveryTask>(`/agri-connect/farmer/orders/${orderId}/request-delivery/`, {
      method: 'POST',
    });
  }

  // Notifications API
  async getNotifications(params?: {
    unread_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Notification>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<Notification>>(`/notifications/?${searchParams.toString()}`);
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    return this.request<Notification>(`/notifications/${notificationId}/mark-read/`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.request<void>('/notifications/mark-all-read/', {
      method: 'POST',
    });
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Simple axios-like API client for components that expect api.post, api.get, etc.
const api = {
  defaults: {
    headers: {
      common: {
        Authorization: localStorage.getItem('access_token') ? `Bearer ${localStorage.getItem('access_token')}` : ''
      }
    }
  },
  
  get: async (url: string) => {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, { headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as Record<string, unknown>).response = { data: errorData, status: response.status };
      throw error;
    }
    
    return {
      data: await response.json()
    };
  },
  
  post: async (url: string, data?: Record<string, unknown>) => {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as Record<string, unknown>).response = { data: errorData, status: response.status };
      throw error;
    }
    
    return {
      data: await response.json()
    };
  },
  
  put: async (url: string, data?: Record<string, unknown>) => {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as Record<string, unknown>).response = { data: errorData, status: response.status };
      throw error;
    }
    
    return {
      data: await response.json()
    };
  },
  
  delete: async (url: string) => {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as Record<string, unknown>).response = { data: errorData, status: response.status };
      throw error;
    }
    
    return {
      data: await response.json()
    };
  }
};

// Export the simple API client
export { api };

// Export types for use in components
export type {
  User,
  UserAddress,
  ProductReview,
  AgriCategory,
  AgriProduct,
  AgriProductImage,
  AgriProductReview,
  Farm,
  Cart,
  CartItem,
  Order,
  OrderItem,
  DeliveryTask,
  DeliveryAgentLocation,
  Payment,
  MobileMoneyTransaction,
  Notification,
}; 