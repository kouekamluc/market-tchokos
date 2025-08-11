from django.urls import path
from . import views

urlpatterns = [
    # Payments
    path('payments/', views.PaymentListView.as_view(), name='payment-list'),
    path('payments/<uuid:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('payments/process/', views.process_payment, name='process-payment'),
    path('payments/status/<str:transaction_id>/', views.check_payment_status, name='check-payment-status'),
    path('payments/dashboard-stats/', views.payment_dashboard_stats, name='payment-dashboard-stats'),
    
    # Payment methods
    path('payment-methods/', views.PaymentMethodListView.as_view(), name='payment-method-list'),
    
    # Mobile money
    path('mobile-money/process/', views.process_mobile_money_payment, name='process-mobile-money'),
    path('mobile-money/transactions/', views.MobileMoneyTransactionListView.as_view(), name='mobile-money-transactions'),
    path('mobile-money/callback/<str:provider>/', views.mobile_money_callback, name='mobile-money-callback'),
    
    # Cash on delivery
    path('cash-on-delivery/process/', views.process_cash_on_delivery_payment, name='process-cod'),
    
    # Refunds
    path('refunds/', views.PaymentRefundListView.as_view(), name='refund-list'),
    path('refunds/create/', views.create_refund, name='create-refund'),
    
    # Settlements
    path('settlements/', views.PaymentSettlementListView.as_view(), name='settlement-list'),
    path('settlements/request/', views.request_settlement, name='request-settlement'),
] 