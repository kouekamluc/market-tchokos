from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    Payment, MobileMoneyTransaction, PaymentWebhook, 
    CashOnDeliveryPayment, PaymentRefund
)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        'reference_number', 'user', 'amount', 'payment_method', 
        'payment_status', 'mobile_money_provider', 'created_at'
    )
    list_filter = (
        'payment_method', 'payment_status', 'mobile_money_provider', 
        'created_at', 'completed_at'
    )
    search_fields = (
        'reference_number', 'transaction_id', 'user__username', 
        'user__phone_number', 'user__email'
    )
    readonly_fields = (
        'reference_number', 'created_at', 'updated_at', 'completed_at'
    )
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'reference_number', 'amount', 'payment_method')
        }),
        ('Order References', {
            'fields': ('order', 'agri_order'),
            'classes': ('collapse',)
        }),
        ('Mobile Money Details', {
            'fields': ('mobile_money_provider', 'mobile_money_phone'),
            'classes': ('collapse',)
        }),
        ('Status & Metadata', {
            'fields': ('payment_status', 'transaction_id', 'description', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing object
            return self.readonly_fields + ('user', 'amount', 'payment_method')
        return self.readonly_fields

@admin.register(MobileMoneyTransaction)
class MobileMoneyTransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'provider', 'phone_number', 'amount', 'status', 
        'payment_reference', 'created_at'
    )
    list_filter = ('provider', 'status', 'created_at', 'processed_at')
    search_fields = (
        'provider_transaction_id', 'provider_reference', 'phone_number',
        'payment__reference_number'
    )
    readonly_fields = (
        'payment', 'created_at', 'updated_at', 'provider_response'
    )
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Transaction Details', {
            'fields': ('payment', 'provider', 'phone_number', 'status')
        }),
        ('Provider Information', {
            'fields': ('provider_transaction_id', 'provider_reference')
        }),
        ('Financial Details', {
            'fields': ('amount', 'provider_fee', 'net_amount')
        }),
        ('Response Data', {
            'fields': ('provider_response', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('initiated_at', 'processed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def payment_reference(self, obj):
        if obj.payment:
            url = reverse('admin:payments_payment_change', args=[obj.payment.id])
            return format_html('<a href="{}">{}</a>', url, obj.payment.reference_number)
        return '-'
    payment_reference.short_description = 'Payment Reference'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('payment')

@admin.register(PaymentWebhook)
class PaymentWebhookAdmin(admin.ModelAdmin):
    list_display = (
        'webhook_id', 'provider', 'event_type', 'is_processed', 
        'received_at', 'processed_at'
    )
    list_filter = ('provider', 'event_type', 'is_processed', 'received_at')
    search_fields = ('webhook_id', 'event_type', 'provider')
    readonly_fields = ('received_at', 'payload_formatted')
    ordering = ('-received_at',)
    
    fieldsets = (
        ('Webhook Information', {
            'fields': ('provider', 'webhook_id', 'event_type')
        }),
        ('Processing Status', {
            'fields': ('is_processed', 'processing_error', 'processed_at')
        }),
        ('Payload Data', {
            'fields': ('payload_formatted',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('received_at',),
            'classes': ('collapse',)
        }),
    )
    
    def payload_formatted(self, obj):
        """Format JSON payload for display"""
        if obj.payload:
            import json
            formatted = json.dumps(obj.payload, indent=2)
            return format_html('<pre>{}</pre>', formatted)
        return '-'
    payload_formatted.short_description = 'Formatted Payload'

@admin.register(CashOnDeliveryPayment)
class CashOnDeliveryPaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'payment_reference', 'delivery_agent', 'amount_collected',
        'is_settled', 'created_at'
    )
    list_filter = ('is_settled', 'created_at', 'settled_at')
    search_fields = (
        'payment__reference_number', 'delivery_agent__username',
        'delivery_agent__phone_number', 'settlement_reference'
    )
    readonly_fields = ('payment', 'delivery_agent', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('payment', 'delivery_agent')
        }),
        ('Collection Details', {
            'fields': ('amount_collected', 'collection_notes')
        }),
        ('Settlement Status', {
            'fields': ('is_settled', 'settled_at', 'settlement_reference')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def payment_reference(self, obj):
        if obj.payment:
            url = reverse('admin:payments_payment_change', args=[obj.payment.id])
            return format_html('<a href="{}">{}</a>', url, obj.payment.reference_number)
        return '-'
    payment_reference.short_description = 'Payment Reference'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('payment', 'delivery_agent')

@admin.register(PaymentRefund)
class PaymentRefundAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'payment_reference', 'amount', 'status', 'processed_by',
        'requested_at', 'completed_at'
    )
    list_filter = ('status', 'refund_method', 'requested_at', 'processed_at')
    search_fields = (
        'payment__reference_number', 'refund_reference', 'reason',
        'processed_by__username'
    )
    readonly_fields = ('payment', 'requested_at', 'refund_reference')
    ordering = ('-requested_at',)
    
    fieldsets = (
        ('Refund Information', {
            'fields': ('payment', 'amount', 'reason', 'refund_method')
        }),
        ('Status & Processing', {
            'fields': ('status', 'processed_by', 'admin_notes')
        }),
        ('Timestamps', {
            'fields': ('requested_at', 'processed_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def payment_reference(self, obj):
        if obj.payment:
            url = reverse('admin:payments_payment_change', args=[obj.payment.id])
            return format_html('<a href="{}">{}</a>', url, obj.payment.reference_number)
        return '-'
    payment_reference.short_description = 'Payment Reference'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('payment', 'processed_by')
    
    def save_model(self, request, obj, form, change):
        if not obj.refund_reference:
            import uuid
            obj.refund_reference = f"REF-{uuid.uuid4().hex[:8].upper()}"
        super().save_model(request, obj, form, change)

# Custom admin site configuration
admin.site.site_header = "ChronoConnect Payment Administration"
admin.site.site_title = "Payment Admin"
admin.site.index_title = "Payment Management Dashboard" 