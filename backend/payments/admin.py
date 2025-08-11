from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Payment, MobileMoneyTransaction, PaymentMethod, PaymentSettlement, PaymentRefund
)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'amount', 'payment_method', 'status', 'created_at')
    list_filter = ('payment_method', 'status', 'created_at')
    search_fields = ('id', 'customer__username')
    ordering = ('-created_at',)
    readonly_fields = ('amount',)
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('customer', 'amount')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'status')
        }),
        ('Timing Information', {
            'fields': ('created_at', 'processed_at', 'completed_at')
        }),
        ('Additional Information', {
            'fields': ('notes', 'metadata'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer')


@admin.register(MobileMoneyTransaction)
class MobileMoneyTransactionAdmin(admin.ModelAdmin):
    list_display = ('payment', 'provider', 'phone_number', 'amount', 'status')
    list_filter = ('provider', 'status')
    search_fields = ('payment__id', 'phone_number', 'customer_reference')
    ordering = ('-id',)
    readonly_fields = ('amount',)
    
    fieldsets = (
        ('Transaction Information', {
            'fields': ('payment', 'provider', 'phone_number', 'amount')
        }),
        ('Status Information', {
            'fields': ('status', 'customer_reference', 'provider_reference', 'failure_reason')
        }),
        ('Timing Information', {
            'fields': ('created_at', 'processed_at', 'completed_at')
        }),
        ('Callback Information', {
            'fields': ('callback_data', 'callback_received_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    fieldsets = (
        ('Method Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Configuration', {
            'fields': ('api_config', 'webhook_url'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PaymentSettlement)
class PaymentSettlementAdmin(admin.ModelAdmin):
    list_display = ('beneficiary', 'beneficiary_type', 'total_amount', 'status', 'created_at')
    list_filter = ('beneficiary_type', 'status', 'payment_method', 'created_at')
    search_fields = ('beneficiary__username', 'beneficiary__business_name')
    ordering = ('-created_at',)
    readonly_fields = ('total_amount',)
    
    fieldsets = (
        ('Settlement Information', {
            'fields': ('beneficiary', 'beneficiary_type', 'total_amount')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'status')
        }),
        ('Period Information', {
            'fields': ('period_start', 'period_end', 'total_transactions')
        }),
        ('Timing Information', {
            'fields': ('created_at', 'processed_at', 'completed_at')
        }),
        ('Additional Information', {
            'fields': ('notes', 'metadata'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('beneficiary')


@admin.register(PaymentRefund)
class PaymentRefundAdmin(admin.ModelAdmin):
    list_display = ('original_payment', 'amount', 'reason', 'status', 'created_at')
    list_filter = ('reason', 'status', 'created_at')
    search_fields = ('original_payment__id', 'customer__username')
    ordering = ('-created_at',)
    readonly_fields = ('amount',)
    
    fieldsets = (
        ('Refund Information', {
            'fields': ('original_payment', 'customer', 'amount', 'reason', 'status')
        }),
        ('Processing Information', {
            'fields': ('processed_by', 'processed_at', 'refund_reference', 'transaction_id')
        }),
        ('Timing Information', {
            'fields': ('created_at', 'completed_at')
        }),
        ('Additional Information', {
            'fields': ('notes', 'metadata'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('original_payment', 'customer') 