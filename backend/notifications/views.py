from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import json
from .models import (
    Notification, NotificationTemplate, PushNotification, EmailNotification,
    SMSNotification, NotificationPreference
)
from .serializers import (
    NotificationSerializer, NotificationDetailSerializer, NotificationTemplateSerializer,
    PushNotificationSerializer, EmailNotificationSerializer, SMSNotificationSerializer,
    NotificationPreferenceSerializer, CreateNotificationSerializer, SendNotificationSerializer,
    MarkNotificationReadSerializer, UpdateNotificationPreferenceSerializer,
    SendTestNotificationSerializer, PushTokenSerializer, EmailNotificationHistorySerializer,
    SMSNotificationHistorySerializer, BulkNotificationSerializer
)


class NotificationListView(generics.ListAPIView):
    """List notifications for the current user"""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['type', 'priority', 'is_read', 'is_sent']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationDetailView(generics.RetrieveAPIView):
    """Get detailed notification information"""
    serializer_class = NotificationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationTemplateListView(generics.ListAPIView):
    """List notification templates"""
    queryset = NotificationTemplate.objects.filter(is_active=True)
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'title_template', 'message_template']


class NotificationTemplateDetailView(generics.RetrieveAPIView):
    """Get notification template details"""
    queryset = NotificationTemplate.objects.filter(is_active=True)
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]


class PushNotificationListView(generics.ListAPIView):
    """List push notifications"""
    serializer_class = PushNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_sent']
    ordering_fields = ['created_at', 'sent_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return PushNotification.objects.filter(
            notification__recipient=self.request.user
        ).select_related('notification')


class EmailNotificationListView(generics.ListAPIView):
    """List email notifications"""
    serializer_class = EmailNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_sent']
    ordering_fields = ['created_at', 'sent_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return EmailNotification.objects.filter(
            notification__recipient=self.request.user
        ).select_related('notification')


class SMSNotificationListView(generics.ListAPIView):
    """List SMS notifications"""
    serializer_class = SMSNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_sent']
    ordering_fields = ['created_at', 'sent_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return SMSNotification.objects.filter(
            notification__recipient=self.request.user
        ).select_related('notification')


class NotificationPreferenceListView(generics.ListCreateAPIView):
    """List and create notification preferences"""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['notification_type']
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NotificationPreferenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual notification preferences"""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_notification(request):
    """Create a new notification"""
    serializer = CreateNotificationSerializer(data=request.data)
    if serializer.is_valid():
        recipient_id = serializer.validated_data['recipient_id']
        notification_type = serializer.validated_data['type']
        title = serializer.validated_data['title']
        message = serializer.validated_data['message']
        priority = serializer.validated_data['priority']
        delivery_methods = serializer.validated_data['delivery_methods']
        action_url = serializer.validated_data.get('action_url', '')
        metadata = serializer.validated_data.get('metadata', {})
        
        # Check if user has permission to create notifications
        if request.user.user_type not in ['admin', 'merchant', 'farmer']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create notification
        notification = Notification.objects.create(
            recipient_id=recipient_id,
            type=notification_type,
            title=title,
            message=message,
            priority=priority,
            delivery_methods=delivery_methods,
            action_url=action_url,
            metadata=metadata
        )
        
        notification_serializer = NotificationDetailSerializer(notification)
        return Response({
            'message': 'Notification created successfully',
            'notification': notification_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_notification(request):
    """Send a notification through specified delivery method"""
    serializer = SendNotificationSerializer(data=request.data)
    if serializer.is_valid():
        notification_id = serializer.validated_data['notification_id']
        delivery_method = serializer.validated_data['delivery_method']
        
        try:
            notification = Notification.objects.get(id=notification_id)
            
            # Check if user has permission to send this notification
            if request.user != notification.recipient and request.user.user_type not in ['admin']:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Send notification based on delivery method
            if delivery_method == 'push':
                # Create push notification
                push_notification = PushNotification.objects.create(
                    notification=notification,
                    device_token=notification.recipient.device_token or '',
                    title=notification.title,
                    body=notification.message,
                    data=notification.metadata or {}
                )
                
                # Here you would integrate with actual push notification service
                # For now, we'll mark it as sent
                push_notification.is_sent = True
                push_notification.sent_at = timezone.now()
                push_notification.save()
                
            elif delivery_method == 'email':
                # Create email notification
                email_notification = EmailNotification.objects.create(
                    notification=notification,
                    to_email=notification.recipient.email,
                    subject=notification.title,
                    body=notification.message
                )
                
                # Send email
                try:
                    send_mail(
                        subject=notification.title,
                        message=notification.message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[notification.recipient.email],
                        fail_silently=False
                    )
                    email_notification.is_sent = True
                    email_notification.sent_at = timezone.now()
                except Exception as e:
                    email_notification.error_message = str(e)
                
                email_notification.save()
                
            elif delivery_method == 'sms':
                # Create SMS notification
                sms_notification = SMSNotification.objects.create(
                    notification=notification,
                    to_phone=notification.recipient.phone_number,
                    message=notification.message
                )
                
                # Here you would integrate with actual SMS service
                # For now, we'll mark it as sent
                sms_notification.is_sent = True
                sms_notification.sent_at = timezone.now()
                sms_notification.save()
            
            # Update notification status
            notification.is_sent = True
            notification.sent_at = timezone.now()
            notification.save()
            
            return Response({
                'message': f'Notification sent via {delivery_method}',
                'notification_id': notification.id
            })
            
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notifications_read(request):
    """Mark notifications as read"""
    serializer = MarkNotificationReadSerializer(data=request.data)
    if serializer.is_valid():
        notification_ids = serializer.validated_data['notification_ids']
        
        # Update notifications
        notifications = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user
        )
        
        updated_count = notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            'message': f'{updated_count} notifications marked as read',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_notifications_count(request):
    """Get count of unread notifications"""
    count = Notification.objects.filter(
        recipient=request.user,
        is_read=False
    ).count()
    
    return Response({
        'unread_count': count
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_notification_preference(request):
    """Update notification preferences"""
    serializer = UpdateNotificationPreferenceSerializer(data=request.data)
    if serializer.is_valid():
        notification_type = serializer.validated_data['notification_type']
        email_enabled = serializer.validated_data['email_enabled']
        sms_enabled = serializer.validated_data['sms_enabled']
        push_enabled = serializer.validated_data['push_enabled']
        quiet_hours_start = serializer.validated_data.get('quiet_hours_start')
        quiet_hours_end = serializer.validated_data.get('quiet_hours_end')
        
        # Update or create preference
        preference, created = NotificationPreference.objects.get_or_create(
            user=request.user,
            notification_type=notification_type,
            defaults={
                'email_enabled': email_enabled,
                'sms_enabled': sms_enabled,
                'push_enabled': push_enabled,
                'quiet_hours_start': quiet_hours_start,
                'quiet_hours_end': quiet_hours_end
            }
        )
        
        if not created:
            preference.email_enabled = email_enabled
            preference.sms_enabled = sms_enabled
            preference.push_enabled = push_enabled
            preference.quiet_hours_start = quiet_hours_start
            preference.quiet_hours_end = quiet_hours_end
            preference.save()
        
        preference_serializer = NotificationPreferenceSerializer(preference)
        return Response({
            'message': 'Notification preferences updated successfully',
            'preference': preference_serializer.data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_test_notification(request):
    """Send a test notification"""
    serializer = SendTestNotificationSerializer(data=request.data)
    if serializer.is_valid():
        delivery_method = serializer.validated_data['delivery_method']
        title = serializer.validated_data['title']
        message = serializer.validated_data['message']
        recipient_email = serializer.validated_data.get('recipient_email')
        recipient_phone = serializer.validated_data.get('recipient_phone')
        
        # Check if user has permission to send test notifications
        if request.user.user_type not in ['admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            if delivery_method == 'email' and recipient_email:
                # Send test email
                send_mail(
                    subject=f'[TEST] {title}',
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recipient_email],
                    fail_silently=False
                )
                
            elif delivery_method == 'sms' and recipient_phone:
                # Here you would integrate with actual SMS service
                # For now, we'll just return success
                pass
                
            elif delivery_method == 'push':
                # Here you would integrate with actual push notification service
                # For now, we'll just return success
                pass
            
            return Response({
                'message': f'Test notification sent via {delivery_method}',
                'delivery_method': delivery_method
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to send test notification: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def register_push_token(request):
    """Register push notification token"""
    serializer = PushTokenSerializer(data=request.data)
    if serializer.is_valid():
        device_token = serializer.validated_data['device_token']
        device_type = serializer.validated_data['device_type']
        app_version = serializer.validated_data.get('app_version', '')
        device_info = serializer.validated_data.get('device_info', {})
        
        # Update user's device token
        request.user.device_token = device_token
        request.user.save()
        
        return Response({
            'message': 'Push token registered successfully',
            'device_token': device_token,
            'device_type': device_type
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailNotificationHistoryListView(generics.ListAPIView):
    """List email notification history"""
    serializer_class = EmailNotificationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_sent']
    ordering_fields = ['created_at', 'sent_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.user.user_type in ['admin']:
            return EmailNotification.objects.all()
        else:
            return EmailNotification.objects.filter(
                notification__recipient=self.request.user
            )


class SMSNotificationHistoryListView(generics.ListAPIView):
    """List SMS notification history"""
    serializer_class = SMSNotificationHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_sent']
    ordering_fields = ['created_at', 'sent_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.user.user_type in ['admin']:
            return SMSNotification.objects.all()
        else:
            return SMSNotification.objects.filter(
                notification__recipient=self.request.user
            )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_bulk_notification(request):
    """Send bulk notifications to multiple recipients"""
    serializer = BulkNotificationSerializer(data=request.data)
    if serializer.is_valid():
        recipient_ids = serializer.validated_data['recipient_ids']
        notification_type = serializer.validated_data['type']
        title = serializer.validated_data['title']
        message = serializer.validated_data['message']
        priority = serializer.validated_data['priority']
        delivery_methods = serializer.validated_data['delivery_methods']
        action_url = serializer.validated_data.get('action_url', '')
        metadata = serializer.validated_data.get('metadata', {})
        
        # Check if user has permission to send bulk notifications
        if request.user.user_type not in ['admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create notifications for all recipients
        notifications = []
        for recipient_id in recipient_ids:
            notification = Notification.objects.create(
                recipient_id=recipient_id,
                type=notification_type,
                title=title,
                message=message,
                priority=priority,
                delivery_methods=delivery_methods,
                action_url=action_url,
                metadata=metadata
            )
            notifications.append(notification)
        
        return Response({
            'message': f'Bulk notification created for {len(notifications)} recipients',
            'notification_count': len(notifications)
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def notification_dashboard_stats(request):
    """Get notification dashboard statistics"""
    user = request.user
    
    if user.user_type in ['admin']:
        # Admin stats
        total_notifications = Notification.objects.count()
        unread_notifications = Notification.objects.filter(is_read=False).count()
        sent_notifications = Notification.objects.filter(is_sent=True).count()
        
        recent_notifications = Notification.objects.all().order_by('-created_at')[:10]
        
    else:
        # User stats
        total_notifications = Notification.objects.filter(recipient=user).count()
        unread_notifications = Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()
        sent_notifications = Notification.objects.filter(
            recipient=user,
            is_sent=True
        ).count()
        
        recent_notifications = Notification.objects.filter(
            recipient=user
        ).order_by('-created_at')[:10]
    
    notifications_serializer = NotificationSerializer(recent_notifications, many=True)
    
    return Response({
        'total_notifications': total_notifications,
        'unread_notifications': unread_notifications,
        'sent_notifications': sent_notifications,
        'recent_notifications': notifications_serializer.data
    }) 