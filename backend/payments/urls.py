from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Payment management
    path('', views.PaymentListView.as_view(), name='payment-list'),
    path('<uuid:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    
    # Mobile money payments
    path('mobile-money/initiate/', views.InitiateMobileMoneyPaymentView.as_view(), name='initiate-mobile-money'),
    path('mobile-money/transactions/', views.MobileMoneyTransactionListView.as_view(), name='mobile-money-transactions'),
    
    # Webhooks (CSRF exempt)
    path('webhooks/<str:provider>/', views.mobile_money_webhook, name='mobile-money-webhook'),
    
    # Cash on delivery
    path('cash-on-delivery/', views.CashOnDeliveryPaymentView.as_view(), name='cash-on-delivery'),
    
    # Refunds
    path('refunds/', views.PaymentRefundView.as_view(), name='create-refund'),
    
    # Payment utilities
    path('verify/', views.verify_payment, name='verify-payment'),
    path('summary/', views.payment_summary, name='payment-summary'),
] 