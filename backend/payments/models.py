import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone

User = get_user_model()

class Payment(models.Model):
    """Payment model for all payment types"""
    PAYMENT_METHODS = [
        ('mobile_money', 'Mobile Money'),
        ('cash_on_delivery', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    agri_order = models.ForeignKey('agri_connect.AgriOrder', on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Transaction details
    transaction_id = models.CharField(max_length=100, unique=True, blank=True)
    reference_number = models.CharField(max_length=100, unique=True, blank=True)
    
    # Mobile money specific fields
    mobile_money_provider = models.CharField(max_length=20, blank=True, choices=[
        ('mtn', 'MTN Mobile Money'),
        ('orange', 'Orange Money'),
        ('moov', 'Moov Money'),
    ])
    mobile_money_phone = models.CharField(max_length=15, blank=True)
    
    # Payment metadata
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.reference_number} - {self.user.username} - {self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.reference_number:
            self.reference_number = self.generate_reference_number()
        super().save(*args, **kwargs)
    
    def generate_reference_number(self):
        """Generate unique reference number for payment"""
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        random_suffix = str(uuid.uuid4())[:8]
        return f"PAY-{timestamp}-{random_suffix}"
    
    @property
    def is_mobile_money(self):
        return self.payment_method == 'mobile_money'
    
    @property
    def is_cash_on_delivery(self):
        return self.payment_method == 'cash_on_delivery'
    
    @property
    def can_refund(self):
        return self.payment_status == 'completed' and not self.is_cash_on_delivery

class MobileMoneyTransaction(models.Model):
    """Mobile money transaction details"""
    PROVIDERS = [
        ('mtn', 'MTN Mobile Money'),
        ('orange', 'Orange Money'),
        ('moov', 'Moov Money'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('initiated', 'Initiated'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='mobile_money_transaction')
    
    # Provider details
    provider = models.CharField(max_length=20, choices=PROVIDERS)
    phone_number = models.CharField(max_length=15)
    
    # Transaction details
    provider_transaction_id = models.CharField(max_length=100, blank=True)
    provider_reference = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Amount and fees
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    provider_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Provider response data
    provider_response = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    initiated_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mobile_money_transactions'
        verbose_name = 'Mobile Money Transaction'
        verbose_name_plural = 'Mobile Money Transactions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.provider} - {self.phone_number} - {self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.net_amount:
            self.net_amount = self.amount - self.provider_fee
        super().save(*args, **kwargs)

class PaymentWebhook(models.Model):
    """Webhook records for payment providers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=20, choices=MobileMoneyTransaction.PROVIDERS)
    
    # Webhook data
    webhook_id = models.CharField(max_length=100, unique=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    
    # Processing status
    is_processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True)
    
    # Timestamps
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_webhooks'
        verbose_name = 'Payment Webhook'
        verbose_name_plural = 'Payment Webhooks'
        ordering = ['-received_at']
    
    def __str__(self):
        return f"Webhook {self.webhook_id} - {self.provider} - {self.event_type}"

class CashOnDeliveryPayment(models.Model):
    """Cash on delivery payment details"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='cod_payment')
    
    # Delivery details
    delivery_agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cod_collections')
    
    # Collection details
    amount_collected = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    collection_notes = models.TextField(blank=True)
    
    # Settlement status
    is_settled = models.BooleanField(default=False)
    settled_at = models.DateTimeField(null=True, blank=True)
    settlement_reference = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cash_on_delivery_payments'
        verbose_name = 'Cash on Delivery Payment'
        verbose_name_plural = 'Cash on Delivery Payments'
    
    def __str__(self):
        return f"COD Payment {self.payment.reference_number} - {self.amount_collected}"

class PaymentRefund(models.Model):
    """Payment refund records"""
    REFUND_STATUS = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    
    # Refund details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=REFUND_STATUS, default='pending')
    
    # Processing details
    refund_method = models.CharField(max_length=20, choices=Payment.PAYMENT_METHODS)
    refund_reference = models.CharField(max_length=100, blank=True)
    
    # Admin details
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds')
    admin_notes = models.TextField(blank=True)
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_refunds'
        verbose_name = 'Payment Refund'
        verbose_name_plural = 'Payment Refunds'
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Refund {self.refund_reference} - {self.payment.reference_number}" 