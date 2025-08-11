from django.db import models
from django.utils import timezone
from users.models import User
from marketplace.models import Order as MarketplaceOrder
from agri_connect.models import AgriOrder
import uuid


class Payment(models.Model):
    """Payment transactions"""
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    
    PAYMENT_METHOD = (
        ('mobile_money', 'Mobile Money'),
        ('cash_on_delivery', 'Cash on Delivery'),
        ('bank_transfer', 'Bank Transfer'),
        ('card', 'Credit/Debit Card'),
    )
    
    MOBILE_MONEY_PROVIDER = (
        ('mtn', 'MTN Mobile Money'),
        ('orange', 'Orange Money'),
        ('moov', 'Moov Money'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_number = models.CharField(max_length=20, unique=True)
    
    # Order references
    marketplace_order = models.ForeignKey(MarketplaceOrder, on_delete=models.CASCADE, null=True, blank=True)
    agri_order = models.ForeignKey(AgriOrder, on_delete=models.CASCADE, null=True, blank=True)
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XAF')  # Central African CFA franc
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD)
    mobile_money_provider = models.CharField(max_length=20, choices=MOBILE_MONEY_PROVIDER, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    # Customer details
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    customer_phone = models.CharField(max_length=15)
    customer_email = models.EmailField(blank=True)
    
    # Transaction details
    transaction_id = models.CharField(max_length=100, blank=True)  # External payment provider transaction ID
    reference_number = models.CharField(max_length=100, blank=True)  # Internal reference
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)  # Store additional payment data
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.payment_number} - {self.amount} {self.currency}"
    
    def save(self, *args, **kwargs):
        if not self.payment_number:
            self.payment_number = self.generate_payment_number()
        super().save(*args, **kwargs)
    
    def generate_payment_number(self):
        """Generate unique payment number"""
        import random
        import string
        while True:
            payment_number = f"PAY{timezone.now().strftime('%Y%m%d')}{''.join(random.choices(string.digits, k=6))}"
            if not Payment.objects.filter(payment_number=payment_number).exists():
                return payment_number
    
    @property
    def order(self):
        """Get the associated order"""
        return self.marketplace_order or self.agri_order
    
    @property
    def is_mobile_money(self):
        return self.payment_method == 'mobile_money'
    
    @property
    def is_cash_on_delivery(self):
        return self.payment_method == 'cash_on_delivery'


class MobileMoneyTransaction(models.Model):
    """Mobile money specific transaction details"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='mobile_money_details')
    
    # Provider details
    provider = models.CharField(max_length=20, choices=Payment.MOBILE_MONEY_PROVIDER)
    provider_transaction_id = models.CharField(max_length=100, blank=True)
    provider_reference = models.CharField(max_length=100, blank=True)
    
    # Transaction details
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XAF')
    
    # Status tracking
    status = models.CharField(max_length=20, choices=Payment.PAYMENT_STATUS, default='pending')
    is_successful = models.BooleanField(default=False)
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Response data
    provider_response = models.JSONField(default=dict, blank=True)
    error_details = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'mobile_money_transactions'
        verbose_name = 'Mobile Money Transaction'
        verbose_name_plural = 'Mobile Money Transactions'
    
    def __str__(self):
        return f"{self.provider} - {self.phone_number} - {self.amount}"


class PaymentMethod(models.Model):
    """Available payment methods"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    # Configuration
    min_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    processing_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    processing_fee_type = models.CharField(max_length=20, choices=[
        ('fixed', 'Fixed Amount'),
        ('percentage', 'Percentage'),
    ], default='fixed')
    
    # Icons and display
    icon = models.CharField(max_length=100, blank=True)
    display_name = models.CharField(max_length=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_methods'
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'
    
    def __str__(self):
        return self.display_name


class PaymentSettlement(models.Model):
    """Payment settlements for merchants and delivery agents"""
    SETTLEMENT_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    settlement_number = models.CharField(max_length=20, unique=True)
    
    # Beneficiary
    beneficiary = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlements')
    beneficiary_type = models.CharField(max_length=20, choices=[
        ('merchant', 'Merchant'),
        ('farmer', 'Farmer'),
        ('delivery_agent', 'Delivery Agent'),
    ])
    
    # Settlement details
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_deducted = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Period
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Status
    status = models.CharField(max_length=20, choices=SETTLEMENT_STATUS, default='pending')
    
    # Payment details
    payment_method = models.CharField(max_length=20, choices=Payment.PAYMENT_METHOD)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'payment_settlements'
        verbose_name = 'Payment Settlement'
        verbose_name_plural = 'Payment Settlements'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Settlement {self.settlement_number} - {self.beneficiary.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if not self.settlement_number:
            self.settlement_number = self.generate_settlement_number()
        super().save(*args, **kwargs)
    
    def generate_settlement_number(self):
        """Generate unique settlement number"""
        import random
        import string
        while True:
            settlement_number = f"SET{timezone.now().strftime('%Y%m%d')}{''.join(random.choices(string.digits, k=6))}"
            if not PaymentSettlement.objects.filter(settlement_number=settlement_number).exists():
                return settlement_number


class PaymentRefund(models.Model):
    """Payment refunds"""
    REFUND_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    refund_number = models.CharField(max_length=20, unique=True)
    
    # Original payment
    original_payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    
    # Refund details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    refund_method = models.CharField(max_length=20, choices=Payment.PAYMENT_METHOD)
    
    # Status
    status = models.CharField(max_length=20, choices=REFUND_STATUS, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Admin details
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds')
    
    class Meta:
        db_table = 'payment_refunds'
        verbose_name = 'Payment Refund'
        verbose_name_plural = 'Payment Refunds'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Refund {self.refund_number} - {self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.refund_number:
            self.refund_number = self.generate_refund_number()
        super().save(*args, **kwargs)
    
    def generate_refund_number(self):
        """Generate unique refund number"""
        import random
        import string
        while True:
            refund_number = f"REF{timezone.now().strftime('%Y%m%d')}{''.join(random.choices(string.digits, k=6))}"
            if not PaymentRefund.objects.filter(refund_number=refund_number).exists():
                return refund_number 