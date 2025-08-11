from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Notification, NotificationTemplate, PushNotification, EmailNotification,
    SMSNotification, NotificationPreference
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'notification_type', 'title', 'is_read', 'is_sent', 'created_at')
    list_filter = ('notification_type', 'priority', 'is_read', 'is_sent', 'created_at')
    search_fields = ('user__username', 'user__phone_number', 'title', 'message')
    ordering = ('-created_at',)
    readonly_fields = ('is_read', 'is_sent', 'sent_at')
    
    fieldsets = (
        ('Notification Information', {
            'fields': ('user', 'notification_type', 'priority', 'title', 'message')
        }),
        ('Delivery Information', {
            'fields': ('delivery_methods', 'is_read', 'is_sent', 'sent_at', 'action_url')
        }),
        ('Additional Information', {
            'fields': ('metadata', 'scheduled_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'notification_type', 'send_email', 'send_sms', 'send_push', 'is_active', 'created_at')
    list_filter = ('notification_type', 'is_active', 'created_at')
    search_fields = ('name', 'title_template', 'message_template')
    ordering = ('name',)
    
    fieldsets = (
        ('Template Information', {
            'fields': ('name', 'notification_type', 'title_template', 'message_template', 'send_email', 'send_sms', 'send_push', 'is_active')
        }),
        ('Variables', {
            'fields': ('variables',),
            'classes': ('collapse',)
        }),
    )


@admin.register(PushNotification)
class PushNotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_token', 'device_type', 'is_active', 'allow_notifications', 'created_at')
    list_filter = ('device_type', 'is_active', 'allow_notifications', 'created_at')
    search_fields = ('device_token', 'user__username')
    ordering = ('-created_at',)
    readonly_fields = ('last_used',)
    
    fieldsets = (
        ('Push Notification Information', {
            'fields': ('user', 'device_token', 'device_type', 'device_id', 'app_version', 'os_version')
        }),
        ('Status', {
            'fields': ('is_active', 'allow_notifications', 'last_used')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(EmailNotification)
class EmailNotificationAdmin(admin.ModelAdmin):
    list_display = ('notification', 'to_email', 'subject', 'is_sent', 'sent_at')
    list_filter = ('is_sent', 'sent_at')
    search_fields = ('notification__title', 'to_email')
    ordering = ('-id',)
    readonly_fields = ('sent_at',)
    
    fieldsets = (
        ('Email Information', {
            'fields': ('notification', 'to_email', 'subject', 'body')
        }),
        ('Delivery Status', {
            'fields': ('is_sent', 'is_delivered', 'is_opened', 'sent_at', 'delivered_at', 'opened_at', 'error_message', 'retry_count')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('notification')


@admin.register(SMSNotification)
class SMSNotificationAdmin(admin.ModelAdmin):
    list_display = ('notification', 'to_phone', 'message', 'is_sent', 'sent_at')
    list_filter = ('is_sent', 'sent_at')
    search_fields = ('notification__title', 'to_phone')
    ordering = ('-id',)
    readonly_fields = ('sent_at',)
    
    fieldsets = (
        ('SMS Information', {
            'fields': ('notification', 'to_phone', 'message')
        }),
        ('Delivery Status', {
            'fields': ('is_sent', 'is_delivered', 'sent_at', 'delivered_at', 'provider', 'provider_message_id', 'error_message', 'retry_count')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('notification')


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_notifications', 'sms_notifications', 'push_notifications', 'created_at')
    list_filter = ('email_notifications', 'sms_notifications', 'push_notifications', 'created_at')
    search_fields = ('user__username', 'user__phone_number')
    ordering = ('user__username',)
    
    fieldsets = (
        ('Preference Information', {
            'fields': ('user',)
        }),
        ('Channel Preferences', {
            'fields': ('email_notifications', 'sms_notifications', 'push_notifications', 'order_updates', 'payment_notifications', 'delivery_updates', 'promotions', 'security_alerts', 'system_notifications')
        }),
        ('Timing Preferences', {
            'fields': ('email_frequency', 'quiet_hours_start', 'quiet_hours_end', 'quiet_hours_enabled')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user') 