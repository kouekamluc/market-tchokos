from rest_framework import serializers
from .models import (
    Payment, MobileMoneyTransaction, PaymentMethod, PaymentSettlement, PaymentRefund
)


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    merchant_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'customer', 'customer_name', 'amount', 'currency', 'payment_method',
            'mobile_money_provider', 'status', 'transaction_id', 'reference_number',
            'marketplace_order', 'agri_order', 'customer_phone', 'customer_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentDetailSerializer(PaymentSerializer):
    """Detailed serializer for Payment with full information"""
    
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + [
            'metadata', 'error_message', 'retry_count', 'processed_at', 'completed_at'
        ]


class MobileMoneyTransactionSerializer(serializers.ModelSerializer):
    """Serializer for MobileMoneyTransaction model"""
    payment = PaymentSerializer(read_only=True)
    
    class Meta:
        model = MobileMoneyTransaction
        fields = [
            'id', 'payment', 'provider', 'provider_transaction_id', 'provider_reference',
            'phone_number', 'amount', 'currency', 'status', 'is_successful',
            'provider_response', 'error_details', 'initiated_at', 'processed_at', 'completed_at'
        ]
        read_only_fields = ['id', 'initiated_at', 'processed_at', 'completed_at']


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for PaymentMethod model"""
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'name', 'code', 'description', 'is_active', 'is_default',
            'min_amount', 'max_amount', 'processing_fee', 'processing_fee_type',
            'icon', 'display_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentSettlementSerializer(serializers.ModelSerializer):
    """Serializer for PaymentSettlement model"""
    beneficiary_name = serializers.CharField(source='beneficiary.get_full_name', read_only=True)
    
    class Meta:
        model = PaymentSettlement
        fields = [
            'id', 'beneficiary', 'beneficiary_name', 'beneficiary_type',
            'total_amount', 'commission_deducted', 'net_amount', 'start_date', 'end_date',
            'status', 'payment_method', 'payment_reference', 'notes',
            'created_at', 'processed_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'processed_at', 'completed_at']


class PaymentRefundSerializer(serializers.ModelSerializer):
    """Serializer for PaymentRefund model"""
    payment = PaymentSerializer(read_only=True)
    
    class Meta:
        model = PaymentRefund
        fields = [
            'id', 'original_payment', 'amount', 'reason', 'refund_method', 'status',
            'processed_by', 'created_at', 'processed_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'processed_at', 'completed_at']


class ProcessPaymentSerializer(serializers.Serializer):
    """Serializer for processing payments"""
    order_id = serializers.UUIDField(required=False)
    agri_order_id = serializers.UUIDField(required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD)
    description = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        order_id = attrs.get('order_id')
        agri_order_id = attrs.get('agri_order_id')
        
        if not order_id and not agri_order_id:
            raise serializers.ValidationError(
                "Either order_id or agri_order_id must be provided"
            )
        
        if order_id and agri_order_id:
            raise serializers.ValidationError(
                "Only one of order_id or agri_order_id can be provided"
            )
        
        return attrs


class MobileMoneyPaymentSerializer(serializers.Serializer):
    """Serializer for mobile money payments"""
    phone_number = serializers.CharField(max_length=15)
    provider = serializers.ChoiceField(choices=Payment.MOBILE_MONEY_PROVIDER)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3, default='XAF')
    description = serializers.CharField(required=False, allow_blank=True)
    order_id = serializers.UUIDField(required=False)
    agri_order_id = serializers.UUIDField(required=False)
    
    def validate_phone_number(self, value):
        # Basic phone number validation for Cameroon
        if not value.startswith('+237') and not value.startswith('237'):
            raise serializers.ValidationError(
                "Phone number must be a valid Cameroonian number"
            )
        return value


class CashOnDeliveryPaymentSerializer(serializers.Serializer):
    """Serializer for cash on delivery payments"""
    order_id = serializers.UUIDField(required=False)
    agri_order_id = serializers.UUIDField(required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    delivery_agent_phone = serializers.CharField(max_length=15, required=False)
    
    def validate(self, attrs):
        order_id = attrs.get('order_id')
        agri_order_id = attrs.get('agri_order_id')
        
        if not order_id and not agri_order_id:
            raise serializers.ValidationError(
                "Either order_id or agri_order_id must be provided"
            )
        
        if order_id and agri_order_id:
            raise serializers.ValidationError(
                "Only one of order_id or agri_order_id can be provided"
            )
        
        return attrs


class PaymentStatusSerializer(serializers.Serializer):
    """Serializer for checking payment status"""
    transaction_id = serializers.CharField()


class CreateRefundSerializer(serializers.Serializer):
    """Serializer for creating refunds"""
    payment_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    reason = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)


class SettlementRequestSerializer(serializers.Serializer):
    """Serializer for requesting settlements"""
    beneficiary_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHOD)
    notes = serializers.CharField(required=False, allow_blank=True)


class MobileMoneyCallbackSerializer(serializers.Serializer):
    """Serializer for mobile money callbacks"""
    transaction_id = serializers.CharField()
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    phone_number = serializers.CharField(max_length=15)
    provider = serializers.CharField()
    timestamp = serializers.DateTimeField()
    signature = serializers.CharField(required=False)
    metadata = serializers.JSONField(required=False) 