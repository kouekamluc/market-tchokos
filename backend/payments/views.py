from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
import uuid
import json
from .models import (
    Payment, MobileMoneyTransaction, PaymentMethod, PaymentSettlement, PaymentRefund
)
from .serializers import (
    PaymentSerializer, PaymentDetailSerializer, MobileMoneyTransactionSerializer,
    PaymentMethodSerializer, PaymentSettlementSerializer, PaymentRefundSerializer,
    ProcessPaymentSerializer, MobileMoneyPaymentSerializer, CashOnDeliveryPaymentSerializer,
    PaymentStatusSerializer, CreateRefundSerializer, SettlementRequestSerializer,
    MobileMoneyCallbackSerializer
)


class PaymentListView(generics.ListAPIView):
    """List payments with filtering"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'currency']
    ordering_fields = ['created_at', 'payment_date', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return Payment.objects.filter(customer=user).select_related('merchant')
        elif user.user_type in ['merchant', 'farmer']:
            return Payment.objects.filter(merchant=user).select_related('customer')
        else:
            return Payment.objects.all().select_related('customer', 'merchant')


class PaymentDetailView(generics.RetrieveAPIView):
    """Get detailed payment information"""
    serializer_class = PaymentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return Payment.objects.filter(customer=user).select_related('merchant')
        elif user.user_type in ['merchant', 'farmer']:
            return Payment.objects.filter(merchant=user).select_related('customer')
        else:
            return Payment.objects.all().select_related('customer', 'merchant')


class PaymentMethodListView(generics.ListAPIView):
    """List available payment methods"""
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.AllowAny]


class MobileMoneyTransactionListView(generics.ListAPIView):
    """List mobile money transactions"""
    serializer_class = MobileMoneyTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['provider', 'status', 'currency']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return MobileMoneyTransaction.objects.filter(
                payment__customer=user
            ).select_related('payment')
        else:
            return MobileMoneyTransaction.objects.all().select_related('payment')


class PaymentSettlementListView(generics.ListAPIView):
    """List payment settlements"""
    serializer_class = PaymentSettlementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'beneficiary_type']
    ordering_fields = ['created_at', 'settlement_date', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type in ['merchant', 'farmer', 'delivery_agent']:
            return PaymentSettlement.objects.filter(beneficiary=user)
        else:
            return PaymentSettlement.objects.all().select_related('beneficiary')


class PaymentRefundListView(generics.ListAPIView):
    """List payment refunds"""
    serializer_class = PaymentRefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'refund_date', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return PaymentRefund.objects.filter(
                payment__customer=user
            ).select_related('payment')
        else:
            return PaymentRefund.objects.all().select_related('payment')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_payment(request):
    """Process a payment"""
    serializer = ProcessPaymentSerializer(data=request.data)
    if serializer.is_valid():
        order_id = serializer.validated_data.get('order_id')
        agri_order_id = serializer.validated_data.get('agri_order_id')
        amount = serializer.validated_data['amount']
        payment_method = serializer.validated_data['payment_method']
        description = serializer.validated_data.get('description', '')
        
        # Create payment record
        payment = Payment.objects.create(
            customer=request.user,
            order_id=order_id,
            agri_order_id=agri_order_id,
            amount=amount,
            currency='XAF',
            payment_method=payment_method,
            status='pending',
            description=description,
            transaction_id=str(uuid.uuid4())
        )
        
        # Process based on payment method
        if payment_method == 'mobile_money':
            return Response({
                'message': 'Mobile money payment initiated',
                'payment_id': payment.id,
                'transaction_id': payment.transaction_id,
                'next_step': 'Provide mobile money details'
            })
        elif payment_method == 'cash_on_delivery':
            payment.status = 'pending'
            payment.save()
            return Response({
                'message': 'Cash on delivery payment registered',
                'payment_id': payment.id,
                'transaction_id': payment.transaction_id
            })
        else:
            return Response({
                'error': 'Unsupported payment method'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_mobile_money_payment(request):
    """Process mobile money payment"""
    serializer = MobileMoneyPaymentSerializer(data=request.data)
    if serializer.is_valid():
        phone_number = serializer.validated_data['phone_number']
        provider = serializer.validated_data['provider']
        amount = serializer.validated_data['amount']
        currency = serializer.validated_data['currency']
        description = serializer.validated_data.get('description', '')
        order_id = serializer.validated_data.get('order_id')
        agri_order_id = serializer.validated_data.get('agri_order_id')
        
        # Create payment record
        payment = Payment.objects.create(
            customer=request.user,
            order_id=order_id,
            agri_order_id=agri_order_id,
            amount=amount,
            currency=currency,
            payment_method='mobile_money',
            status='pending',
            description=description,
            transaction_id=str(uuid.uuid4())
        )
        
        # Create mobile money transaction
        mobile_transaction = MobileMoneyTransaction.objects.create(
            payment=payment,
            provider=provider,
            phone_number=phone_number,
            amount=amount,
            currency=currency,
            status='pending',
            transaction_id=str(uuid.uuid4())
        )
        
        # Here you would integrate with the actual mobile money API
        # For now, we'll simulate the process
        try:
            # Simulate API call to mobile money provider
            # response = call_mobile_money_api(provider, phone_number, amount, mobile_transaction.transaction_id)
            
            # For demo purposes, we'll mark it as successful
            mobile_transaction.status = 'success'
            mobile_transaction.response_data = {
                'provider_response': 'success',
                'transaction_reference': f'MM_{mobile_transaction.transaction_id}'
            }
            mobile_transaction.save()
            
            payment.status = 'completed'
            payment.payment_date = timezone.now()
            payment.processed_at = timezone.now()
            payment.save()
            
            return Response({
                'message': 'Mobile money payment processed successfully',
                'payment_id': payment.id,
                'transaction_id': mobile_transaction.transaction_id,
                'status': 'completed'
            })
            
        except Exception as e:
            mobile_transaction.status = 'failed'
            mobile_transaction.response_data = {'error': str(e)}
            mobile_transaction.save()
            
            payment.status = 'failed'
            payment.error_message = str(e)
            payment.save()
            
            return Response({
                'error': 'Mobile money payment failed',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def process_cash_on_delivery_payment(request):
    """Process cash on delivery payment"""
    serializer = CashOnDeliveryPaymentSerializer(data=request.data)
    if serializer.is_valid():
        order_id = serializer.validated_data.get('order_id')
        agri_order_id = serializer.validated_data.get('agri_order_id')
        amount = serializer.validated_data['amount']
        delivery_agent_phone = serializer.validated_data.get('delivery_agent_phone')
        
        # Create payment record
        payment = Payment.objects.create(
            customer=request.user,
            order_id=order_id,
            agri_order_id=agri_order_id,
            amount=amount,
            currency='XAF',
            payment_method='cash_on_delivery',
            status='pending',
            description='Cash on delivery payment',
            transaction_id=str(uuid.uuid4()),
            metadata={'delivery_agent_phone': delivery_agent_phone}
        )
        
        return Response({
            'message': 'Cash on delivery payment registered',
            'payment_id': payment.id,
            'transaction_id': payment.transaction_id,
            'status': 'pending'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_payment_status(request, transaction_id):
    """Check payment status"""
    try:
        payment = Payment.objects.get(transaction_id=transaction_id)
        
        # Check if user has permission to view this payment
        if request.user != payment.customer and request.user != payment.merchant:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            'transaction_id': transaction_id,
            'status': payment.status,
            'amount': payment.amount,
            'currency': payment.currency,
            'payment_method': payment.payment_method,
            'payment_date': payment.payment_date,
            'error_message': payment.error_message
        })
        
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_refund(request):
    """Create a payment refund"""
    serializer = CreateRefundSerializer(data=request.data)
    if serializer.is_valid():
        payment_id = serializer.validated_data['payment_id']
        amount = serializer.validated_data['amount']
        reason = serializer.validated_data['reason']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            payment = Payment.objects.get(id=payment_id)
            
            # Check if user has permission to refund this payment
            if request.user != payment.merchant and request.user.user_type != 'admin':
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if refund amount is valid
            if amount > payment.amount:
                return Response(
                    {'error': 'Refund amount cannot exceed original payment amount'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create refund record
            refund = PaymentRefund.objects.create(
                payment=payment,
                amount=amount,
                currency=payment.currency,
                reason=reason,
                status='pending',
                processed_by=request.user,
                notes=notes
            )
            
            return Response({
                'message': 'Refund created successfully',
                'refund_id': refund.id,
                'amount': amount,
                'status': 'pending'
            })
            
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_settlement(request):
    """Request a payment settlement"""
    serializer = SettlementRequestSerializer(data=request.data)
    if serializer.is_valid():
        beneficiary_id = serializer.validated_data['beneficiary_id']
        amount = serializer.validated_data['amount']
        payment_method = serializer.validated_data['payment_method']
        notes = serializer.validated_data.get('notes', '')
        
        # Check if user is requesting settlement for themselves
        if str(request.user.id) != str(beneficiary_id):
            return Response(
                {'error': 'You can only request settlements for yourself'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create settlement record
        settlement = PaymentSettlement.objects.create(
            beneficiary=request.user,
            beneficiary_type=request.user.user_type,
            amount=amount,
            currency='XAF',
            payment_method=payment_method,
            status='pending',
            reference_number=str(uuid.uuid4()),
            notes=notes
        )
        
        return Response({
            'message': 'Settlement request created successfully',
            'settlement_id': settlement.id,
            'amount': amount,
            'status': 'pending'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def mobile_money_callback(request, provider):
    """Handle mobile money callbacks"""
    serializer = MobileMoneyCallbackSerializer(data=request.data)
    if serializer.is_valid():
        transaction_id = serializer.validated_data['transaction_id']
        status = serializer.validated_data['status']
        amount = serializer.validated_data['amount']
        currency = serializer.validated_data['currency']
        phone_number = serializer.validated_data['phone_number']
        timestamp = serializer.validated_data['timestamp']
        signature = serializer.validated_data.get('signature')
        metadata = serializer.validated_data.get('metadata', {})
        
        try:
            # Find the mobile money transaction
            mobile_transaction = MobileMoneyTransaction.objects.get(
                transaction_id=transaction_id,
                provider=provider
            )
            
            # Update transaction status
            mobile_transaction.status = status
            mobile_transaction.callback_data = {
                'status': status,
                'amount': amount,
                'currency': currency,
                'phone_number': phone_number,
                'timestamp': timestamp.isoformat(),
                'signature': signature,
                'metadata': metadata
            }
            mobile_transaction.save()
            
            # Update payment status
            payment = mobile_transaction.payment
            if status == 'success':
                payment.status = 'completed'
                payment.payment_date = timestamp
                payment.processed_at = timezone.now()
            elif status == 'failed':
                payment.status = 'failed'
                payment.error_message = metadata.get('error_message', 'Payment failed')
            
            payment.save()
            
            return Response({'status': 'success'})
            
        except MobileMoneyTransaction.DoesNotExist:
            return Response(
                {'error': 'Transaction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_dashboard_stats(request):
    """Get payment dashboard statistics"""
    user = request.user
    
    if user.user_type == 'customer':
        # Customer stats
        total_payments = Payment.objects.filter(customer=user).count()
        total_spent = Payment.objects.filter(
            customer=user,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        recent_payments = Payment.objects.filter(
            customer=user
        ).order_by('-created_at')[:5]
        
    elif user.user_type in ['merchant', 'farmer']:
        # Merchant/Farmer stats
        total_payments = Payment.objects.filter(merchant=user).count()
        total_received = Payment.objects.filter(
            merchant=user,
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        recent_payments = Payment.objects.filter(
            merchant=user
        ).order_by('-created_at')[:5]
        
    else:
        # Admin stats
        total_payments = Payment.objects.count()
        total_received = Payment.objects.filter(
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        recent_payments = Payment.objects.all().order_by('-created_at')[:5]
    
    payments_serializer = PaymentSerializer(recent_payments, many=True)
    
    return Response({
        'total_payments': total_payments,
        'total_amount': total_received,
        'recent_payments': payments_serializer.data
    }) 