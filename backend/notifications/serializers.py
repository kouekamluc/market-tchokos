from rest_framework import serializers
from .models import (
    Notification, NotificationTemplate, PushNotification, EmailNotification,
    SMSNotification, NotificationPreference
)


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    recipient_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'recipient_name', 'notification_type', 'title', 'message',
            'priority', 'is_read', 'is_sent', 'email_sent', 'sms_sent', 'push_sent',
            'action_url', 'data', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationDetailSerializer(NotificationSerializer):
    """Detailed serializer for Notification with full information"""
    
    class Meta(NotificationSerializer.Meta):
        fields = NotificationSerializer.Meta.fields + [
            'data', 'read_at', 'sent_at'
        ]


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for NotificationTemplate model"""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'notification_type', 'title_template', 'message_template',
            'send_email', 'send_sms', 'send_push', 'variables', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PushNotificationSerializer(serializers.ModelSerializer):
    """Serializer for PushNotification model"""
    notification = NotificationSerializer(read_only=True)
    
    class Meta:
        model = PushNotification
        fields = [
            'id', 'user', 'device_token', 'device_type', 'device_id',
            'app_version', 'os_version', 'is_active', 'allow_notifications',
            'created_at', 'updated_at', 'last_used'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmailNotificationSerializer(serializers.ModelSerializer):
    """Serializer for EmailNotification model"""
    notification = NotificationSerializer(read_only=True)
    
    class Meta:
        model = EmailNotification
        fields = [
            'id', 'notification', 'to_email', 'subject', 'body',
            'is_sent', 'is_delivered', 'is_opened', 'sent_at', 'delivered_at',
            'opened_at', 'error_message', 'retry_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SMSNotificationSerializer(serializers.ModelSerializer):
    """Serializer for SMSNotification model"""
    notification = NotificationSerializer(read_only=True)
    
    class Meta:
        model = SMSNotification
        fields = [
            'id', 'notification', 'to_phone', 'message', 'is_sent', 'is_delivered',
            'sent_at', 'delivered_at', 'provider', 'provider_message_id',
            'error_message', 'retry_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'user_name', 'email_notifications', 'sms_notifications',
            'push_notifications', 'order_updates', 'payment_notifications',
            'delivery_updates', 'promotions', 'security_alerts', 'system_notifications',
            'email_frequency', 'quiet_hours_start', 'quiet_hours_end',
            'quiet_hours_enabled', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class CreateNotificationSerializer(serializers.Serializer):
    """Serializer for creating notifications"""
    user_id = serializers.UUIDField()
    notification_type = serializers.ChoiceField(choices=Notification.NOTIFICATION_TYPE)
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    priority = serializers.ChoiceField(choices=Notification.PRIORITY_LEVEL, default='normal')
    delivery_methods = serializers.ListField(
        child=serializers.ChoiceField(choices=[('email', 'Email'), ('sms', 'SMS'), ('push', 'Push')]),
        default=['push']
    )
    action_url = serializers.URLField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False)


class SendNotificationSerializer(serializers.Serializer):
    """Serializer for sending notifications"""
    notification_id = serializers.UUIDField()
    delivery_method = serializers.ChoiceField(choices=[('email', 'Email'), ('sms', 'SMS'), ('push', 'Push')])


class MarkNotificationReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    notification_ids = serializers.ListField(
        child=serializers.UUIDField()
    )


class UpdateNotificationPreferenceSerializer(serializers.Serializer):
    """Serializer for updating notification preferences"""
    notification_type = serializers.ChoiceField(choices=Notification.NOTIFICATION_TYPE)
    email_enabled = serializers.BooleanField(default=True)
    sms_enabled = serializers.BooleanField(default=True)
    push_enabled = serializers.BooleanField(default=True)
    quiet_hours_start = serializers.TimeField(required=False, allow_null=True)
    quiet_hours_end = serializers.TimeField(required=False, allow_null=True)


class SendTestNotificationSerializer(serializers.Serializer):
    """Serializer for sending test notifications"""
    delivery_method = serializers.ChoiceField(choices=[('email', 'Email'), ('sms', 'SMS'), ('push', 'Push')])
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    recipient_email = serializers.EmailField(required=False)
    recipient_phone = serializers.CharField(max_length=15, required=False)


class PushTokenSerializer(serializers.Serializer):
    """Serializer for managing push tokens"""
    device_token = serializers.CharField()
    device_type = serializers.ChoiceField(choices=[('android', 'Android'), ('ios', 'iOS'), ('web', 'Web')])
    app_version = serializers.CharField(required=False, allow_blank=True)
    device_info = serializers.JSONField(required=False)


class EmailNotificationHistorySerializer(serializers.ModelSerializer):
    """Serializer for email notification history"""
    
    class Meta:
        model = EmailNotification
        fields = [
            'id', 'to_email', 'subject', 'is_sent', 'sent_at',
            'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SMSNotificationHistorySerializer(serializers.ModelSerializer):
    """Serializer for SMS notification history"""
    
    class Meta:
        model = SMSNotification
        fields = [
            'id', 'to_phone', 'message', 'is_sent', 'sent_at',
            'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class BulkNotificationSerializer(serializers.Serializer):
    """Serializer for sending bulk notifications"""
    user_ids = serializers.ListField(
        child=serializers.UUIDField()
    )
    notification_type = serializers.ChoiceField(choices=Notification.NOTIFICATION_TYPE)
    title = serializers.CharField(max_length=200)
    message = serializers.CharField()
    priority = serializers.ChoiceField(choices=Notification.PRIORITY_LEVEL, default='normal')
    delivery_methods = serializers.ListField(
        child=serializers.ChoiceField(choices=[('email', 'Email'), ('sms', 'SMS'), ('push', 'Push')]),
        default=['push']
    )
    action_url = serializers.URLField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False) 