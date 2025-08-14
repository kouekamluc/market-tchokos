from rest_framework import serializers
from .models import Payment, MobileMoneyTransaction, PaymentWebhook, CashOnDeliveryPayment, PaymentRefund
from users.serializers import UserSerializer

class MobileMoneyTransactionSerializer(serializers.ModelSerializer):
    """Serializer for MobileMoneyTransaction model"""
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = MobileMoneyTransaction
        fields = [
            'id', 'payment', 'provider', 'provider_display', 'phone_number',
            'provider_transaction_id', 'provider_reference', 'status', 'status_display',
            'amount', 'provider_fee', 'net_amount', 'provider_response', 'error_message',
            'initiated_at', 'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    user = UserSerializer(read_only=True)
    mobile_money_transaction = MobileMoneyTransactionSerializer(read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'order', 'agri_order', 'amount', 'payment_method',
            'payment_method_display', 'payment_status', 'payment_status_display',
            'transaction_id', 'reference_number', 'mobile_money_provider',
            'mobile_money_phone', 'description', 'metadata', 'mobile_money_transaction',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'user', 'reference_number', 'created_at', 'updated_at']

class PaymentDetailSerializer(PaymentSerializer):
    """Detailed payment serializer with additional fields"""
    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + ['metadata']

class CreatePaymentSerializer(serializers.ModelSerializer):
    """Serializer for creating payments"""
    mobile_money_phone = serializers.CharField(required=False, allow_blank=True)
    mobile_money_provider = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Payment
        fields = [
            'order', 'agri_order', 'amount', 'payment_method',
            'mobile_money_provider', 'mobile_money_phone', 'description'
        ]
    
    def validate(self, data):
        """Validate payment data"""
        # Ensure either order or agri_order is provided
        if not data.get('order') and not data.get('agri_order'):
            raise serializers.ValidationError("Either 'order' or 'agri_order' must be provided")
        
        # Validate mobile money fields
        if data.get('payment_method') == 'mobile_money':
            if not data.get('mobile_money_provider'):
                raise serializers.ValidationError("Mobile money provider is required for mobile money payments")
            if not data.get('mobile_money_phone'):
                raise serializers.ValidationError("Mobile money phone number is required for mobile money payments")
        
        return data

class InitiateMobileMoneyPaymentSerializer(serializers.Serializer):
    """Serializer for initiating mobile money payments"""
    payment_id = serializers.UUIDField()
    phone_number = serializers.CharField(max_length=15)
    provider = serializers.ChoiceField(choices=MobileMoneyTransaction.PROVIDERS)
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        # Basic validation for Cameroonian phone numbers
        if not value.startswith(('+237', '237', '6', '2', '3', '9')):
            raise serializers.ValidationError("Invalid phone number format")
        return value

class MobileMoneyCallbackSerializer(serializers.Serializer):
    """Serializer for mobile money provider callbacks"""
    transaction_id = serializers.CharField()
    reference = serializers.CharField()
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    phone_number = serializers.CharField(max_length=15)
    provider = serializers.CharField()
    timestamp = serializers.DateTimeField()
    signature = serializers.CharField(required=False, allow_blank=True)
    
    def validate_provider(self, value):
        """Validate provider"""
        if value not in dict(MobileMoneyTransaction.PROVIDERS):
            raise serializers.ValidationError("Invalid provider")
        return value

class PaymentWebhookSerializer(serializers.ModelSerializer):
    """Serializer for PaymentWebhook model"""
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    
    class Meta:
        model = PaymentWebhook
        fields = [
            'id', 'provider', 'provider_display', 'webhook_id', 'event_type',
            'payload', 'is_processed', 'processing_error', 'received_at', 'processed_at'
        ]
        read_only_fields = ['id', 'received_at']

class CashOnDeliveryPaymentSerializer(serializers.ModelSerializer):
    """Serializer for CashOnDeliveryPayment model"""
    payment = PaymentSerializer(read_only=True)
    delivery_agent = UserSerializer(read_only=True)
    
    class Meta:
        model = CashOnDeliveryPayment
        fields = [
            'id', 'payment', 'delivery_agent', 'amount_collected', 'collection_notes',
            'is_settled', 'settled_at', 'settlement_reference', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class CreateCashOnDeliveryPaymentSerializer(serializers.ModelSerializer):
    """Serializer for creating cash on delivery payments"""
    class Meta:
        model = CashOnDeliveryPayment
        fields = ['payment', 'amount_collected', 'collection_notes']

class UpdateCashOnDeliveryPaymentSerializer(serializers.ModelSerializer):
    """Serializer for updating cash on delivery payments"""
    class Meta:
        model = CashOnDeliveryPayment
        fields = ['amount_collected', 'collection_notes', 'is_settled', 'settlement_reference']
        read_only_fields = ['is_settled', 'settlement_reference']

class PaymentRefundSerializer(serializers.ModelSerializer):
    """Serializer for PaymentRefund model"""
    payment = PaymentSerializer(read_only=True)
    processed_by = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    refund_method_display = serializers.CharField(source='get_refund_method_display', read_only=True)
    
    class Meta:
        model = PaymentRefund
        fields = [
            'id', 'payment', 'amount', 'reason', 'status', 'status_display',
            'refund_method', 'refund_method_display', 'refund_reference',
            'processed_by', 'admin_notes', 'requested_at', 'processed_at', 'completed_at'
        ]
        read_only_fields = ['id', 'requested_at', 'refund_reference']

class CreateRefundSerializer(serializers.Serializer):
    """Serializer for creating refunds"""
    payment_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    reason = serializers.CharField(max_length=500)
    refund_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHODS)
    
    def validate_amount(self, value):
        """Validate refund amount"""
        payment_id = self.initial_data.get('payment_id')
        if payment_id:
            try:
                payment = Payment.objects.get(id=payment_id)
                if value > payment.amount:
                    raise serializers.ValidationError("Refund amount cannot exceed payment amount")
            except Payment.DoesNotExist:
                pass
        return value

class UpdateRefundStatusSerializer(serializers.Serializer):
    """Serializer for updating refund status"""
    status = serializers.ChoiceField(choices=PaymentRefund.REFUND_STATUS)
    admin_notes = serializers.CharField(required=False, allow_blank=True)

class PaymentStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating payment status"""
    status = serializers.ChoiceField(choices=Payment.PAYMENT_STATUS)
    transaction_id = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False)

class PaymentVerificationSerializer(serializers.Serializer):
    """Serializer for payment verification"""
    payment_id = serializers.UUIDField()
    verification_code = serializers.CharField(max_length=10, required=False, allow_blank=True)
    
    def validate_verification_code(self, value):
        """Validate verification code format"""
        if value and len(value) != 6:
            raise serializers.ValidationError("Verification code must be 6 digits")
        return value

class PaymentSummarySerializer(serializers.Serializer):
    """Serializer for payment summary statistics"""
    total_payments = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    successful_payments = serializers.IntegerField()
    failed_payments = serializers.IntegerField()
    pending_payments = serializers.IntegerField()
    mobile_money_payments = serializers.IntegerField()
    cod_payments = serializers.IntegerField()
    
    # Provider breakdown
    mtn_payments = serializers.IntegerField()
    orange_payments = serializers.IntegerField()
    moov_payments = serializers.IntegerField()
    
    # Time period
    period_start = serializers.DateField()
    period_end = serializers.DateField() 