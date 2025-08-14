from django.urls import path
from . import views

urlpatterns = [
    # Notifications
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<uuid:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    path('create/', views.create_notification, name='create-notification'),
    path('send/', views.send_notification, name='send-notification'),
    path('mark-read/', views.mark_notifications_read, name='mark-notifications-read'),
    path('unread-count/', views.unread_notifications_count, name='unread-notifications-count'),
    path('dashboard-stats/', views.notification_dashboard_stats, name='notification-dashboard-stats'),
    
    # Notification templates
    path('templates/', views.NotificationTemplateListView.as_view(), name='notification-template-list'),
    path('templates/<int:pk>/', views.NotificationTemplateDetailView.as_view(), name='notification-template-detail'),
    
    # Push notifications
    path('push/', views.PushNotificationListView.as_view(), name='push-notification-list'),
    path('push/register-token/', views.register_push_token, name='register-push-token'),
    
    # Email notifications
    path('email/', views.EmailNotificationListView.as_view(), name='email-notification-list'),
    path('email/history/', views.EmailNotificationHistoryListView.as_view(), name='email-notification-history'),
    
    # SMS notifications
    path('sms/', views.SMSNotificationListView.as_view(), name='sms-notification-list'),
    path('sms/history/', views.SMSNotificationHistoryListView.as_view(), name='sms-notification-history'),
    
    # Notification preferences
    path('preferences/', views.NotificationPreferenceListView.as_view(), name='notification-preference-list'),
    path('preferences/<int:pk>/', views.NotificationPreferenceDetailView.as_view(), name='notification-preference-detail'),
    path('preferences/update/', views.update_notification_preference, name='update-notification-preference'),
    
    # Test notifications
    path('test/send/', views.send_test_notification, name='send-test-notification'),
    
    # Bulk notifications
    path('bulk/send/', views.send_bulk_notification, name='send-bulk-notification'),
] 