from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    
    # Phone verification
    path('send-verification-code/', views.send_verification_code, name='send-verification-code'),
    path('verify-phone/', views.verify_phone, name='verify-phone'),
    
    # Profile management
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('change-password/', views.PasswordChangeView.as_view(), name='change-password'),
    
    # Addresses
    path('addresses/', views.UserAddressViewSet.as_view(), name='user-addresses'),
    path('addresses/<uuid:pk>/', views.UserAddressDetailView.as_view(), name='user-address-detail'),
    path('geocode/', views.geocode_address, name='geocode-address'),
    
    # Verification
    path('verifications/', views.UserVerificationViewSet.as_view(), name='user-verifications'),
    
    # Delivery agents
    path('delivery-agents/', views.DeliveryAgentsListView.as_view(), name='delivery-agents'),
    path('delivery-agents/update-location/', views.update_delivery_agent_location, name='update-location'),
    path('delivery-agents/toggle-availability/', views.toggle_delivery_agent_availability, name='toggle-availability'),
    
    # Merchants and farmers
    path('merchants-farmers/', views.MerchantsFarmersListView.as_view(), name='merchants-farmers'),
    
    # Search
    path('search/', views.search_users, name='search-users'),
] 