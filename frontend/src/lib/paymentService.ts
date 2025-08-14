// Payment Service for ChronoConnect Frontend
// This service handles all payment operations including mobile money integration

import { apiClient } from './api';

export interface PaymentRequest {
  order_id?: string;
  agri_order_id?: string;
  amount: number;
  payment_method: 'mobile_money' | 'cash_on_delivery' | 'card';
  mobile_money_provider?: 'mtn' | 'orange' | 'moov';
  mobile_money_phone?: string;
  description?: string;
}

export interface MobileMoneyPaymentRequest {
  payment_id: string;
  phone_number: string;
  provider: 'mtn' | 'orange' | 'moov';
}

export interface PaymentVerificationRequest {
  payment_id: string;
  verification_code?: string;
}

export interface PaymentStatus {
  payment_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  verified_at?: string;
}

export interface PaymentSummary {
  total_payments: number;
  total_amount: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  mobile_money_payments: number;
  cod_payments: number;
  mtn_payments: number;
  orange_payments: number;
  moov_payments: number;
  period_start: string;
  period_end: string;
}

class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(paymentData: PaymentRequest) {
    try {
      const response = await apiClient.post('/payments/', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Initiate mobile money payment
   */
  async initiateMobileMoneyPayment(paymentRequest: MobileMoneyPaymentRequest) {
    try {
      const response = await apiClient.post('/payments/mobile-money/initiate/', paymentRequest);
      return response.data;
    } catch (error) {
      console.error('Error initiating mobile money payment:', error);
      throw error;
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(verificationRequest: PaymentVerificationRequest): Promise<PaymentStatus> {
    try {
      const response = await apiClient.post('/payments/verify/', verificationRequest);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(days: number = 30): Promise<PaymentSummary> {
    try {
      const response = await apiClient.get(`/payments/summary/?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw error;
    }
  }

  /**
   * Get payment details by ID
   */
  async getPayment(paymentId: string) {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment:', error);
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(params?: {
    payment_method?: string;
    payment_status?: string;
    page?: number;
    page_size?: number;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/payments/?${searchParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  /**
   * Get mobile money transactions
   */
  async getMobileMoneyTransactions(params?: {
    provider?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
      }
      
      const response = await apiClient.get(`/payments/mobile-money/transactions/?${searchParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting mobile money transactions:', error);
      throw error;
    }
  }

  /**
   * Create cash on delivery payment
   */
  async createCashOnDeliveryPayment(data: {
    payment_id: string;
    amount_collected: number;
    collection_notes?: string;
  }) {
    try {
      const response = await apiClient.post('/payments/cash-on-delivery/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating COD payment:', error);
      throw error;
    }
  }

  /**
   * Create payment refund
   */
  async createRefund(data: {
    payment_id: string;
    amount: number;
    reason: string;
    refund_method: 'mobile_money' | 'cash_on_delivery' | 'card';
  }) {
    try {
      const response = await apiClient.post('/payments/refunds/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Poll payment status for mobile money payments
   */
  async pollPaymentStatus(paymentId: string, maxAttempts: number = 10, interval: number = 5000): Promise<PaymentStatus> {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const status = await this.verifyPayment({ payment_id: paymentId });
          
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            resolve(status);
            return;
          }
          
          if (attempts >= maxAttempts) {
            reject(new Error('Payment status polling timeout'));
            return;
          }
          
          // Continue polling
          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }

  /**
   * Format phone number for mobile money
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle Cameroonian phone numbers
    if (cleaned.startsWith('237')) {
      return cleaned;
    } else if (cleaned.startsWith('6') || cleaned.startsWith('2') || cleaned.startsWith('3') || cleaned.startsWith('9')) {
      return `237${cleaned}`;
    } else if (cleaned.length === 9) {
      return `237${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    // Cameroonian phone numbers should be 9 digits after country code
    return formatted.length === 12 && formatted.startsWith('237');
  }

  /**
   * Get payment method display name
   */
  getPaymentMethodDisplay(method: string): string {
    const methodNames: Record<string, string> = {
      'mobile_money': 'Mobile Money',
      'cash_on_delivery': 'Cash on Delivery',
      'card': 'Credit/Debit Card',
      'bank_transfer': 'Bank Transfer'
    };
    return methodNames[method] || method;
  }

  /**
   * Get mobile money provider display name
   */
  getProviderDisplay(provider: string): string {
    const providerNames: Record<string, string> = {
      'mtn': 'MTN Mobile Money',
      'orange': 'Orange Money',
      'moov': 'Moov Money'
    };
    return providerNames[provider] || provider;
  }

  /**
   * Get payment status display name
   */
  getPaymentStatusDisplay(status: string): string {
    const statusNames: Record<string, string> = {
      'pending': 'Pending',
      'processing': 'Processing',
      'completed': 'Completed',
      'failed': 'Failed',
      'cancelled': 'Cancelled',
      'refunded': 'Refunded'
    };
    return statusNames[status] || status;
  }

  /**
   * Get payment status color for UI
   */
  getPaymentStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'processing': 'text-blue-600 bg-blue-100',
      'completed': 'text-green-600 bg-green-100',
      'failed': 'text-red-600 bg-red-100',
      'cancelled': 'text-gray-600 bg-gray-100',
      'refunded': 'text-purple-600 bg-purple-100'
    };
    return statusColors[status] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Calculate payment fees
   */
  calculatePaymentFees(amount: number, method: string): { baseAmount: number; fees: number; totalAmount: number } {
    let fees = 0;
    
    if (method === 'mobile_money') {
      // Mobile money fees (example rates)
      if (amount <= 5000) {
        fees = 50; // 50 CFA for amounts up to 5000
      } else if (amount <= 25000) {
        fees = 100; // 100 CFA for amounts up to 25000
      } else {
        fees = 200; // 200 CFA for amounts above 25000
      }
    } else if (method === 'card') {
      // Card processing fees (example: 2.5%)
      fees = Math.round(amount * 0.025);
    }
    
    return {
      baseAmount: amount,
      fees: fees,
      totalAmount: amount + fees
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'XAF'): string {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export types
export type {
  PaymentRequest,
  MobileMoneyPaymentRequest,
  PaymentVerificationRequest,
  PaymentStatus,
  PaymentSummary
};

