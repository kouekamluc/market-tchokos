from django.db import models
from django.utils import timezone
from users.models import User
import uuid


class Notification(models.Model):
    """System notifications"""
    NOTIFICATION_TYPE = (
        ('order_status', 'Order Status Update'),
        ('payment', 'Payment Notification'),
        ('delivery', 'Delivery Update'),
        ('promotion', 'Promotion'),
        ('system', 'System Notification'),
        ('security', 'Security Alert'),
    )
    
    PRIORITY_LEVEL = (
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    # Notification details
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVEL, default='normal')
    
    # Status
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    
    # Delivery methods
    email_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    push_sent = models.BooleanField(default=False)
    
    # Metadata
    data = models.JSONField(default=dict, blank=True)  # Additional data for the notification
    action_url = models.URLField(blank=True)  # URL to redirect when notification is clicked
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def mark_as_sent(self):
        """Mark notification as sent"""
        if not self.is_sent:
            self.is_sent = True
            self.sent_at = timezone.now()
            self.save()


class NotificationTemplate(models.Model):
    """Notification templates for different types of notifications"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=20, choices=Notification.NOTIFICATION_TYPE)
    
    # Template content
    title_template = models.CharField(max_length=200)
    message_template = models.TextField()
    
    # Delivery settings
    send_email = models.BooleanField(default=True)
    send_sms = models.BooleanField(default=False)
    send_push = models.BooleanField(default=True)
    
    # Template variables
    variables = models.JSONField(default=list, blank=True)  # List of available variables
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_templates'
        verbose_name = 'Notification Template'
        verbose_name_plural = 'Notification Templates'
    
    def __str__(self):
        return self.name


class PushNotification(models.Model):
    """Push notification tokens and settings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_tokens')
    
    # Device information
    device_token = models.CharField(max_length=255, unique=True)
    device_type = models.CharField(max_length=20, choices=[
        ('ios', 'iOS'),
        ('android', 'Android'),
        ('web', 'Web'),
    ])
    device_id = models.CharField(max_length=100, blank=True)
    
    # App information
    app_version = models.CharField(max_length=20, blank=True)
    os_version = models.CharField(max_length=20, blank=True)
    
    # Settings
    is_active = models.BooleanField(default=True)
    allow_notifications = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'push_notifications'
        verbose_name = 'Push Notification'
        verbose_name_plural = 'Push Notifications'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.device_type}"


class EmailNotification(models.Model):
    """Email notification tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.OneToOneField(Notification, on_delete=models.CASCADE, related_name='email_details')
    
    # Email details
    to_email = models.EmailField()
    subject = models.CharField(max_length=200)
    body = models.TextField()
    
    # Status
    is_sent = models.BooleanField(default=False)
    is_delivered = models.BooleanField(default=False)
    is_opened = models.BooleanField(default=False)
    
    # Tracking
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'email_notifications'
        verbose_name = 'Email Notification'
        verbose_name_plural = 'Email Notifications'
    
    def __str__(self):
        return f"Email to {self.to_email} - {self.subject}"


class SMSNotification(models.Model):
    """SMS notification tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.OneToOneField(Notification, on_delete=models.CASCADE, related_name='sms_details')
    
    # SMS details
    to_phone = models.CharField(max_length=15)
    message = models.TextField()
    
    # Status
    is_sent = models.BooleanField(default=False)
    is_delivered = models.BooleanField(default=False)
    
    # Tracking
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Provider details
    provider = models.CharField(max_length=50, blank=True)
    provider_message_id = models.CharField(max_length=100, blank=True)
    
    # Error handling
    error_message = models.TextField(blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'sms_notifications'
        verbose_name = 'SMS Notification'
        verbose_name_plural = 'SMS Notifications'
    
    def __str__(self):
        return f"SMS to {self.to_phone}"


class NotificationPreference(models.Model):
    """User notification preferences"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # General settings
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    
    # Specific notification types
    order_updates = models.BooleanField(default=True)
    payment_notifications = models.BooleanField(default=True)
    delivery_updates = models.BooleanField(default=True)
    promotions = models.BooleanField(default=True)
    security_alerts = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=False)
    
    # Frequency settings
    email_frequency = models.CharField(max_length=20, choices=[
        ('immediate', 'Immediate'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
    ], default='immediate')
    
    # Quiet hours
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    quiet_hours_enabled = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.get_full_name()}"
    
    def can_send_notification(self, notification_type):
        """Check if notification can be sent based on preferences"""
        if notification_type == 'order_status':
            return self.order_updates
        elif notification_type == 'payment':
            return self.payment_notifications
        elif notification_type == 'delivery':
            return self.delivery_updates
        elif notification_type == 'promotion':
            return self.promotions
        elif notification_type == 'security':
            return self.security_alerts
        elif notification_type == 'system':
            return self.system_notifications
        return True
    
    def is_quiet_hours(self):
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_enabled or not self.quiet_hours_start or not self.quiet_hours_end:
            return False
        
        current_time = timezone.now().time()
        if self.quiet_hours_start <= self.quiet_hours_end:
            return self.quiet_hours_start <= current_time <= self.quiet_hours_end
        else:  # Quiet hours span midnight
            return current_time >= self.quiet_hours_start or current_time <= self.quiet_hours_end 