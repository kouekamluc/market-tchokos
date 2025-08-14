import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Phone,
  Eye,
  EyeOff
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { paymentService, PaymentRequest } from '@/lib/paymentService';

// Payment form validation schema
const paymentSchema = z.object({
  payment_method: z.enum(['mobile_money', 'cash_on_delivery', 'card']),
  mobile_money_provider: z.enum(['mtn', 'orange', 'moov']).optional(),
  mobile_money_phone: z.string().optional(),
  card_number: z.string().optional(),
  card_expiry: z.string().optional(),
  card_cvv: z.string().optional(),
  card_holder: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  amount: number;
  orderId?: string;
  agriOrderId?: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

export function PaymentForm({
  amount,
  orderId,
  agriOrderId,
  onPaymentSuccess,
  onPaymentError,
  className = ''
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    mode: 'onChange'
  });

  const selectedPaymentMethod = watch('payment_method');
  const selectedProvider = watch('mobile_money_provider');

  // Calculate fees and total
  const fees = paymentService.calculatePaymentFees(amount, selectedPaymentMethod || 'mobile_money');
  const totalAmount = fees.totalAmount;

  // Handle form submission
  const onSubmit = async (data: PaymentFormData) => {
    if (!isValid) return;

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Create payment request
      const paymentRequest: PaymentRequest = {
        order_id: orderId,
        agri_order_id: agriOrderId,
        amount: totalAmount,
        payment_method: data.payment_method,
        mobile_money_provider: data.mobile_money_provider,
        mobile_money_phone: data.mobile_money_phone,
        description: `Payment for order ${orderId || agriOrderId}`
      };

      // Create payment
      const payment = await paymentService.createPayment(paymentRequest);
      setCurrentPaymentId(payment.id);

      // Handle different payment methods
      if (data.payment_method === 'mobile_money' && data.mobile_money_provider && data.mobile_money_phone) {
        // Initiate mobile money payment
        const mobileMoneyRequest = {
          payment_id: payment.id,
          phone_number: data.mobile_money_phone,
          provider: data.mobile_money_provider
        };

        const mobileMoneyResponse = await paymentService.initiateMobileMoneyPayment(mobileMoneyRequest);
        
        if (mobileMoneyResponse.status === 'processing') {
          // Start polling for payment status
          await pollPaymentStatus(payment.id);
        }
      } else if (data.payment_method === 'cash_on_delivery') {
        // COD payment is automatically completed
        setPaymentStatus('success');
        onPaymentSuccess(payment.id);
      } else if (data.payment_method === 'card') {
        // For card payments, you would integrate with a payment gateway
        // For now, simulate success
        setPaymentStatus('success');
        onPaymentSuccess(payment.id);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Poll payment status for mobile money
  const pollPaymentStatus = async (paymentId: string) => {
    try {
      const status = await paymentService.pollPaymentStatus(paymentId, 20, 3000); // 20 attempts, 3 second intervals
      
      if (status.status === 'completed') {
        setPaymentStatus('success');
        onPaymentSuccess(paymentId);
        toast.success('Payment completed successfully!');
      } else if (status.status === 'failed') {
        setPaymentStatus('failed');
        onPaymentError('Payment failed');
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      setPaymentStatus('failed');
      onPaymentError('Payment verification timeout');
      toast.error('Payment verification timeout. Please check your payment status.');
    }
  };

  // Reset form when payment method changes
  useEffect(() => {
    if (selectedPaymentMethod === 'mobile_money') {
      setValue('card_number', '');
      setValue('card_expiry', '');
      setValue('card_cvv', '');
      setValue('card_holder', '');
    } else if (selectedPaymentMethod === 'card') {
      setValue('mobile_money_provider', undefined);
      setValue('mobile_money_phone', '');
    }
  }, [selectedPaymentMethod, setValue]);

  // Handle phone number input
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = paymentService.formatPhoneNumber(value);
    setValue('mobile_money_phone', formatted);
  };

  if (paymentStatus === 'success') {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-4">
            Your payment has been processed successfully. You will receive a confirmation shortly.
          </p>
          <Badge variant="outline" className="text-green-700 border-green-300">
            Payment ID: {currentPaymentId}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-700 mb-2">Payment Failed</h3>
          <p className="text-gray-600 mb-4">
            There was an issue processing your payment. Please try again or contact support.
          </p>
          <Button 
            onClick={() => {
              setPaymentStatus('idle');
              setCurrentPaymentId(null);
            }}
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payment Details</span>
          <Badge variant="outline" className="text-lg font-semibold">
            {paymentService.formatCurrency(totalAmount)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Payment Method</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mobile Money */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPaymentMethod === 'mobile_money'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('payment_method', 'mobile_money')}
              >
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="font-medium">Mobile Money</div>
                    <div className="text-sm text-gray-500">MTN, Orange, Moov</div>
                  </div>
                </div>
              </div>

              {/* Cash on Delivery */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPaymentMethod === 'cash_on_delivery'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('payment_method', 'cash_on_delivery')}
              >
                <div className="flex items-center space-x-3">
                  <Banknote className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive</div>
                  </div>
                </div>
              </div>

              {/* Card */}
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPaymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('payment_method', 'card')}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                  <div>
                    <div className="font-medium">Card</div>
                    <div className="text-sm text-gray-500">Credit/Debit card</div>
                  </div>
                </div>
              </div>
            </div>

            <input
              type="hidden"
              {...register('payment_method')}
            />
          </div>

          {/* Mobile Money Details */}
          {selectedPaymentMethod === 'mobile_money' && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <Label className="text-base font-medium">Mobile Money Details</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    onValueChange={(value) => setValue('mobile_money_provider', value as 'mtn' | 'orange' | 'moov')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                      <SelectItem value="orange">Orange Money</SelectItem>
                      <SelectItem value="moov">Moov Money</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.mobile_money_provider && (
                    <p className="text-sm text-red-600 mt-1">{errors.mobile_money_provider.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="6XXXXXXXX"
                      className="pl-10"
                      value={watch('mobile_money_phone') || ''}
                      onChange={handlePhoneNumberChange}
                      {...register('mobile_money_phone')}
                    />
                  </div>
                  {errors.mobile_money_phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.mobile_money_phone.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your mobile money phone number
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Card Details */}
          {selectedPaymentMethod === 'card' && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <Label className="text-base font-medium">Card Details</Label>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="card_holder">Cardholder Name</Label>
                  <Input
                    id="card_holder"
                    placeholder="John Doe"
                    {...register('card_holder')}
                  />
                </div>

                <div>
                  <Label htmlFor="card_number">Card Number</Label>
                  <Input
                    id="card_number"
                    placeholder="1234 5678 9012 3456"
                    {...register('card_number')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card_expiry">Expiry Date</Label>
                    <Input
                      id="card_expiry"
                      placeholder="MM/YY"
                      {...register('card_expiry')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card_cvv">CVV</Label>
                    <Input
                      id="card_cvv"
                      placeholder="123"
                      {...register('card_cvv')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{paymentService.formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fees:</span>
                <span>{paymentService.formatCurrency(fees.fees)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{paymentService.formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValid || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${paymentService.formatCurrency(totalAmount)}`
            )}
          </Button>

          {/* Payment Method Info */}
          {selectedPaymentMethod === 'mobile_money' && (
            <div className="text-sm text-gray-600 text-center">
              <p>You will receive a prompt on your phone to confirm the payment.</p>
              <p>Please enter the verification code when prompted.</p>
            </div>
          )}

          {selectedPaymentMethod === 'cash_on_delivery' && (
            <div className="text-sm text-gray-600 text-center">
              <p>Payment will be collected when your order is delivered.</p>
              <p>Please have the exact amount ready.</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

