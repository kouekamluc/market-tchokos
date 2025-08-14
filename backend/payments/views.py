import logging
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    Payment, MobileMoneyTransaction, PaymentWebhook, 
    CashOnDeliveryPayment, PaymentRefund
)
from .serializers import (
    PaymentSerializer, PaymentDetailSerializer, CreatePaymentSerializer,
    MobileMoneyTransactionSerializer, InitiateMobileMoneyPaymentSerializer,
    MobileMoneyCallbackSerializer, PaymentWebhookSerializer,
    CashOnDeliveryPaymentSerializer, CreateCashOnDeliveryPaymentSerializer,
    UpdateCashOnDeliveryPaymentSerializer, PaymentRefundSerializer,
    CreateRefundSerializer, UpdateRefundStatusSerializer,
    PaymentStatusUpdateSerializer, PaymentVerificationSerializer,
    PaymentSummarySerializer
)
from users.models import User

from agri_connect.models import AgriOrder

logger = logging.getLogger(__name__)

class PaymentListView(generics.ListCreateAPIView):
    """List and create payments"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['payment_method', 'payment_status', 'mobile_money_provider']
    search_fields = ['reference_number', 'transaction_id']
    ordering_fields = ['amount', 'created_at', 'completed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter payments by user role"""
        user = self.request.user
        if user.user_type in ['admin', 'staff']:
            return Payment.objects.all()
        return Payment.objects.filter(user=user)
    
    def perform_create(self, serializer):
        """Create payment with user"""
        serializer.save(user=self.request.user)

class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete payment"""
    serializer_class = PaymentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments by user role"""
        user = self.request.user
        if user.user_type in ['admin', 'staff']:
            return Payment.objects.all()
        return Payment.objects.filter(user=user)

class MobileMoneyTransactionListView(generics.ListAPIView):
    """List mobile money transactions"""
    serializer_class = MobileMoneyTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['provider', 'status']
    ordering_fields = ['amount', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter transactions by user role"""
        user = self.request.user
        if user.user_type in ['admin', 'staff']:
            return MobileMoneyTransaction.objects.all()
        return MobileMoneyTransaction.objects.filter(payment__user=user)

class InitiateMobileMoneyPaymentView(APIView):
    """Initiate mobile money payment"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Initiate mobile money payment"""
        serializer = InitiateMobileMoneyPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Get payment
                payment = Payment.objects.get(
                    id=serializer.validated_data['payment_id'],
                    user=request.user
                )
                
                # Validate payment can be processed
                if payment.payment_status != 'pending':
                    return Response(
                        {'error': 'Payment cannot be initiated'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create mobile money transaction
                mobile_transaction = MobileMoneyTransaction.objects.create(
                    payment=payment,
                    provider=serializer.validated_data['provider'],
                    phone_number=serializer.validated_data['phone_number'],
                    amount=payment.amount,
                    status='initiated'
                )
                
                # Update payment
                payment.mobile_money_provider = serializer.validated_data['provider']
                payment.mobile_money_phone = serializer.validated_data['phone_number']
                payment.payment_status = 'processing'
                payment.save()
                
                # Initiate payment with provider
                provider_response = self._initiate_with_provider(mobile_transaction)
                
                if provider_response.get('success'):
                    mobile_transaction.provider_transaction_id = provider_response.get('transaction_id')
                    mobile_transaction.provider_reference = provider_response.get('reference')
                    mobile_transaction.status = 'processing'
                    mobile_transaction.provider_response = provider_response
                    mobile_transaction.initiated_at = timezone.now()
                    mobile_transaction.save()
                    
                    return Response({
                        'message': 'Payment initiated successfully',
                        'transaction_id': mobile_transaction.provider_transaction_id,
                        'status': mobile_transaction.status
                    })
                else:
                    # Revert payment status
                    payment.payment_status = 'failed'
                    payment.save()
                    
                    mobile_transaction.status = 'failed'
                    mobile_transaction.error_message = provider_response.get('error', 'Provider error')
                    mobile_transaction.save()
                    
                    return Response({
                        'error': 'Failed to initiate payment',
                        'details': provider_response.get('error')
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error initiating mobile money payment: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _initiate_with_provider(self, mobile_transaction):
        """Initiate payment with mobile money provider"""
        provider = mobile_transaction.provider
        amount = mobile_transaction.amount
        phone = mobile_transaction.phone_number
        
        try:
            if provider == 'mtn':
                return self._initiate_mtn_payment(amount, phone)
            elif provider == 'orange':
                return self._initiate_orange_payment(amount, phone)
            elif provider == 'moov':
                return self._initiate_moov_payment(amount, phone)
            else:
                return {'success': False, 'error': 'Unsupported provider'}
        except Exception as e:
            logger.error(f"Provider API error for {provider}: {str(e)}")
            return {'success': False, 'error': f'Provider API error: {str(e)}'}
    
    def _initiate_mtn_payment(self, amount, phone):
        """Initiate MTN Mobile Money payment"""
        # This would integrate with MTN Mobile Money API
        # For now, return mock response
        return {
            'success': True,
            'transaction_id': f'MTN_{int(timezone.now().timestamp())}',
            'reference': f'REF_{int(timezone.now().timestamp())}',
            'status': 'initiated'
        }
    
    def _initiate_orange_payment(self, amount, phone):
        """Initiate Orange Money payment"""
        # This would integrate with Orange Money API
        return {
            'success': True,
            'transaction_id': f'ORANGE_{int(timezone.now().timestamp())}',
            'reference': f'REF_{int(timezone.now().timestamp())}',
            'status': 'initiated'
        }
    
    def _initiate_moov_payment(self, amount, phone):
        """Initiate Moov Money payment"""
        # This would integrate with Moov Money API
        return {
            'success': True,
            'transaction_id': f'MOOV_{int(timezone.now().timestamp())}',
            'reference': f'REF_{int(timezone.now().timestamp())}',
            'status': 'initiated'
        }

@csrf_exempt
@require_http_methods(["POST"])
def mobile_money_webhook(request, provider):
    """Handle mobile money provider webhooks"""
    try:
        # Verify webhook signature (implement based on provider)
        if not _verify_webhook_signature(request, provider):
            logger.warning(f"Invalid webhook signature for {provider}")
            return HttpResponse(status=400)
        
        # Parse webhook data
        webhook_data = json.loads(request.body)
        
        # Create webhook record
        webhook = PaymentWebhook.objects.create(
            provider=provider,
            webhook_id=webhook_data.get('id', ''),
            event_type=webhook_data.get('event_type', ''),
            payload=webhook_data
        )
        
        # Process webhook based on event type
        if webhook_data.get('event_type') == 'payment.success':
            _process_successful_payment(webhook_data, provider)
        elif webhook_data.get('event_type') == 'payment.failed':
            _process_failed_payment(webhook_data, provider)
        elif webhook_data.get('event_type') == 'payment.cancelled':
            _process_cancelled_payment(webhook_data, provider)
        
        # Mark webhook as processed
        webhook.is_processed = True
        webhook.processed_at = timezone.now()
        webhook.save()
        
        return HttpResponse(status=200)
        
    except Exception as e:
        logger.error(f"Error processing {provider} webhook: {str(e)}")
        if 'webhook' in locals():
            webhook.processing_error = str(e)
            webhook.save()
        return HttpResponse(status=500)

def _verify_webhook_signature(request, provider):
    """Verify webhook signature from provider"""
    # Implement signature verification based on provider
    # For now, return True (implement proper verification)
    return True

def _process_successful_payment(webhook_data, provider):
    """Process successful payment webhook"""
    try:
        transaction_id = webhook_data.get('transaction_id')
        reference = webhook_data.get('reference')
        
        # Find mobile money transaction
        mobile_transaction = MobileMoneyTransaction.objects.filter(
            provider_transaction_id=transaction_id,
            provider=provider
        ).first()
        
        if mobile_transaction:
            # Update transaction status
            mobile_transaction.status = 'success'
            mobile_transaction.processed_at = timezone.now()
            mobile_transaction.provider_response = webhook_data
            mobile_transaction.save()
            
            # Update payment status
            payment = mobile_transaction.payment
            payment.payment_status = 'completed'
            payment.transaction_id = transaction_id
            payment.completed_at = timezone.now()
            payment.save()
            
            # Update order status
            if payment.order:
                payment.order.payment_status = 'paid'
                payment.order.save()
            elif payment.agri_order:
                payment.agri_order.payment_status = 'paid'
                payment.agri_order.save()
            
            logger.info(f"Payment {payment.reference_number} completed successfully")
            
    except Exception as e:
        logger.error(f"Error processing successful payment: {str(e)}")

def _process_failed_payment(webhook_data, provider):
    """Process failed payment webhook"""
    try:
        transaction_id = webhook_data.get('transaction_id')
        
        mobile_transaction = MobileMoneyTransaction.objects.filter(
            provider_transaction_id=transaction_id,
            provider=provider
        ).first()
        
        if mobile_transaction:
            mobile_transaction.status = 'failed'
            mobile_transaction.error_message = webhook_data.get('error_message', 'Payment failed')
            mobile_transaction.provider_response = webhook_data
            mobile_transaction.save()
            
            payment = mobile_transaction.payment
            payment.payment_status = 'failed'
            payment.save()
            
            logger.info(f"Payment {payment.reference_number} failed")
            
    except Exception as e:
        logger.error(f"Error processing failed payment: {str(e)}")

def _process_cancelled_payment(webhook_data, provider):
    """Process cancelled payment webhook"""
    try:
        transaction_id = webhook_data.get('transaction_id')
        
        mobile_transaction = MobileMoneyTransaction.objects.filter(
            provider_transaction_id=transaction_id,
            provider=provider
        ).first()
        
        if mobile_transaction:
            mobile_transaction.status = 'cancelled'
            mobile_transaction.provider_response = webhook_data
            mobile_transaction.save()
            
            payment = mobile_transaction.payment
            payment.payment_status = 'cancelled'
            payment.save()
            
            logger.info(f"Payment {payment.reference_number} cancelled")
            
    except Exception as e:
        logger.error(f"Error processing cancelled payment: {str(e)}")

class CashOnDeliveryPaymentView(APIView):
    """Handle cash on delivery payments"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Create cash on delivery payment"""
        serializer = CreateCashOnDeliveryPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Create COD payment
                cod_payment = serializer.save(delivery_agent=request.user)
                
                # Update payment status
                payment = cod_payment.payment
                payment.payment_status = 'completed'
                payment.completed_at = timezone.now()
                payment.save()
                
                # Update order status
                if payment.order:
                    payment.order.payment_status = 'paid'
                    payment.order.save()
                elif payment.agri_order:
                    payment.agri_order.payment_status = 'paid'
                    payment.agri_order.save()
                
                return Response({
                    'message': 'Cash on delivery payment recorded successfully',
                    'payment_id': payment.id
                })
                
        except Exception as e:
            logger.error(f"Error creating COD payment: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PaymentRefundView(APIView):
    """Handle payment refunds"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Create payment refund"""
        serializer = CreateRefundSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Get payment
                payment = Payment.objects.get(id=serializer.validated_data['payment_id'])
                
                # Validate refund can be processed
                if not payment.can_refund:
                    return Response(
                        {'error': 'Payment cannot be refunded'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create refund
                refund = PaymentRefund.objects.create(
                    payment=payment,
                    amount=serializer.validated_data['amount'],
                    reason=serializer.validated_data['reason'],
                    refund_method=serializer.validated_data['refund_method'],
                    processed_by=request.user
                )
                
                # Update payment status
                payment.payment_status = 'refunded'
                payment.save()
                
                return Response({
                    'message': 'Refund created successfully',
                    'refund_id': refund.id
                })
                
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error creating refund: {str(e)}")
            return Response(
                {'error': 'Internal server error'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_summary(request):
    """Get payment summary statistics"""
    try:
        # Get date range from query params
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Get payments in date range
        payments = Payment.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        
        # Calculate statistics
        total_payments = payments.count()
        total_amount = sum(p.amount for p in payments)
        successful_payments = payments.filter(payment_status='completed').count()
        failed_payments = payments.filter(payment_status='failed').count()
        pending_payments = payments.filter(payment_status='pending').count()
        
        mobile_money_payments = payments.filter(payment_method='mobile_money').count()
        cod_payments = payments.filter(payment_method='cash_on_delivery').count()
        
        # Provider breakdown
        mtn_payments = payments.filter(mobile_money_provider='mtn').count()
        orange_payments = payments.filter(mobile_money_provider='orange').count()
        moov_payments = payments.filter(mobile_money_provider='moov').count()
        
        summary = PaymentSummarySerializer({
            'total_payments': total_payments,
            'total_amount': total_amount,
            'successful_payments': successful_payments,
            'failed_payments': failed_payments,
            'pending_payments': pending_payments,
            'mobile_money_payments': mobile_money_payments,
            'cod_payments': cod_payments,
            'mtn_payments': mtn_payments,
            'orange_payments': orange_payments,
            'moov_payments': moov_payments,
            'period_start': start_date,
            'period_end': end_date
        })
        
        return Response(summary.data)
        
    except Exception as e:
        logger.error(f"Error getting payment summary: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    """Verify payment status"""
    serializer = PaymentVerificationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        payment = Payment.objects.get(
            id=serializer.validated_data['payment_id'],
            user=request.user
        )
        
        # For mobile money, check with provider
        if payment.payment_method == 'mobile_money' and payment.mobile_money_transaction:
            mobile_transaction = payment.mobile_money_transaction
            verification_result = _verify_with_provider(mobile_transaction)
            
            if verification_result.get('status_changed'):
                # Update payment status
                payment.payment_status = verification_result['new_status']
                if verification_result['new_status'] == 'completed':
                    payment.completed_at = timezone.now()
                payment.save()
                
                # Update order status
                if payment.order:
                    payment.order.payment_status = verification_result['new_status']
                    payment.order.save()
                elif payment.agri_order:
                    payment.agri_order.payment_status = verification_result['new_status']
                    payment.agri_order.save()
        
        return Response({
            'payment_id': payment.id,
            'status': payment.payment_status,
            'verified_at': timezone.now()
        })
        
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        return Response(
            {'error': 'Internal server error'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def _verify_with_provider(mobile_transaction):
    """Verify payment status with provider"""
    try:
        provider = mobile_transaction.provider
        transaction_id = mobile_transaction.provider_transaction_id
        
        if provider == 'mtn':
            return _verify_mtn_payment(transaction_id)
        elif provider == 'orange':
            return _verify_orange_payment(transaction_id)
        elif provider == 'moov':
            return _verify_moov_payment(transaction_id)
        else:
            return {'status_changed': False}
            
    except Exception as e:
        logger.error(f"Error verifying with provider: {str(e)}")
        return {'status_changed': False}

def _verify_mtn_payment(transaction_id):
    """Verify MTN payment status"""
    # This would call MTN API to verify payment
    # For now, return mock response
    return {'status_changed': False}

def _verify_orange_payment(transaction_id):
    """Verify Orange payment status"""
    # This would call Orange API to verify payment
    return {'status_changed': False}

def _verify_moov_payment(transaction_id):
    """Verify Moov payment status"""
    # This would call Moov API to verify payment
    return {'status_changed': False} 