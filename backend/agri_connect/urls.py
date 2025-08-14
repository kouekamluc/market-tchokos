from django.urls import path
from . import views

urlpatterns = [
    # ============================================================================
    # PUBLIC ENDPOINTS (No authentication required)
    # ============================================================================
    path('categories/', views.AgriCategoryListView.as_view(), name='agri-category-list'),
    path('categories/<uuid:pk>/', views.AgriCategoryDetailView.as_view(), name='agri-category-detail'),
    path('products/', views.AgriProductListView.as_view(), name='agri-product-list'),
    path('products/<uuid:pk>/', views.AgriProductDetailView.as_view(), name='agri-product-detail'),
    
    # ============================================================================
    # CUSTOMER ENDPOINTS
    # ============================================================================
    # Cart management
    path('cart/', views.AgriCartView.as_view(), name='agri-cart'),
    path('cart/<uuid:cart_id>/add_item/', views.AgriCartAddItemView.as_view(), name='agri-cart-add-item'),
    path('cart/<uuid:cart_id>/update_item/', views.AgriCartUpdateItemView.as_view(), name='agri-cart-update-item'),
    path('cart/<uuid:cart_id>/remove_item/', views.AgriCartRemoveItemView.as_view(), name='agri-cart-remove-item'),
    path('cart/<uuid:cart_id>/clear/', views.AgriCartClearView.as_view(), name='agri-cart-clear'),
    
    # Order management
    path('orders/', views.AgriOrderListView.as_view(), name='agri-order-list'),
    path('orders/<uuid:pk>/', views.AgriOrderDetailView.as_view(), name='agri-order-detail'),
    path('orders/<uuid:order_id>/cancel/', views.AgriOrderCancelView.as_view(), name='agri-order-cancel'),
    
    # Product reviews
    path('products/<uuid:product_id>/reviews/', views.AgriProductReviewListView.as_view(), name='agri-product-reviews'),
    
    # Customer workflows
    path('customer/purchase/', views.CompletePurchaseView.as_view(), name='complete-purchase'),
    path('customer/orders/<uuid:order_id>/track/', views.OrderTrackingView.as_view(), name='order-tracking'),
    
    # Customer dashboard
    path('customer/dashboard/', views.CustomerDashboardView.as_view(), name='customer-dashboard'),
    
    # ============================================================================
    # FARMER ENDPOINTS
    # ============================================================================
    # Farm management
    path('farmer/farms/', views.FarmListView.as_view(), name='farmer-farm-list'),
    path('farmer/farms/<uuid:pk>/', views.FarmDetailView.as_view(), name='farmer-farm-detail'),
    
    # Product management
    path('farmer/products/', views.FarmerProductListView.as_view(), name='farmer-product-list'),
    path('farmer/products/<uuid:pk>/', views.FarmerProductDetailView.as_view(), name='farmer-product-detail'),
    
    # Order management
    path('farmer/orders/', views.FarmerOrderListView.as_view(), name='farmer-order-list'),
    
    # Harvest scheduling
    path('farmer/harvest-schedules/', views.HarvestScheduleListView.as_view(), name='farmer-harvest-schedule-list'),
    path('farmer/harvest-schedules/<uuid:pk>/', views.HarvestScheduleDetailView.as_view(), name='farmer-harvest-schedule-detail'),
    
    # Farmer workflows
    path('farmer/orders/<uuid:order_id>/fulfill/', views.OrderFulfillmentView.as_view(), name='order-fulfillment'),
    path('farmer/orders/<uuid:order_id>/request-delivery/', views.request_agri_delivery, name='request-agri-delivery'),
    
    # Farmer dashboard
    path('farmer/dashboard/', views.FarmerDashboardView.as_view(), name='farmer-dashboard'),
    
    # ============================================================================
    # DELIVERY AGENT ENDPOINTS
    # ============================================================================
    # Dashboard
    path('delivery-agent/dashboard/', views.DeliveryAgentDashboardView.as_view(), name='delivery-agent-dashboard'),
    
    # Task management
    path('delivery-agent/tasks/available/', views.AvailableTasksView.as_view(), name='available-tasks'),
    path('delivery-agent/tasks/<uuid:task_id>/accept/', views.AcceptTaskView.as_view(), name='accept-task'),
    path('delivery-agent/tasks/<uuid:task_id>/status/', views.UpdateTaskStatusView.as_view(), name='update-task-status'),
    
    # Location updates
    path('delivery-agent/location/', views.UpdateLocationView.as_view(), name='update-location'),
    
    # ============================================================================
    # ADMIN ENDPOINTS
    # ============================================================================
    # Dashboard
    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    
    # User management
    path('admin/farmers/<uuid:farmer_id>/verify/', views.VerifyFarmerView.as_view(), name='verify-farmer'),
    
    # Content moderation
    path('admin/products/<uuid:product_id>/approve/', views.ManageProductApprovalView.as_view(), name='manage-product-approval'),
    
    # System automation
    path('admin/automation/', views.SystemAutomationView.as_view(), name='system-automation'),
    
    # ============================================================================
    # ANALYTICS ENDPOINTS
    # ============================================================================
    path('analytics/customer/', views.CustomerDashboardView.as_view(), name='customer-analytics'),
    path('analytics/farmer/', views.FarmerDashboardView.as_view(), name='farmer-analytics'),
    
    # ============================================================================
    # WORKFLOW ENDPOINTS
    # ============================================================================
    path('workflows/customer/purchase/', views.CompletePurchaseView.as_view(), name='customer-purchase-workflow'),
    path('workflows/customer/order-tracking/<uuid:order_id>/', views.OrderTrackingView.as_view(), name='customer-order-tracking-workflow'),
    path('workflows/farmer/order-fulfillment/<uuid:order_id>/', views.OrderFulfillmentView.as_view(), name='farmer-order-fulfillment-workflow'),
    
    # ============================================================================
    # LEGACY ENDPOINTS (Maintained for backward compatibility)
    # ============================================================================
    # These endpoints are maintained for existing integrations
    path('cart/<uuid:cart_id>/add_item/', views.AgriCartAddItemView.as_view(), name='agri-cart-add-item'),
    path('cart/<uuid:cart_id>/update_item/', views.AgriCartUpdateItemView.as_view(), name='agri-cart-update-item'),
    path('cart/<uuid:cart_id>/remove_item/', views.AgriCartRemoveItemView.as_view(), name='agri-cart-remove-item'),
    path('cart/<uuid:cart_id>/clear/', views.AgriCartClearView.as_view(), name='agri-cart-clear'),
    path('orders/<uuid:order_id>/cancel/', views.AgriOrderCancelView.as_view(), name='agri-order-cancel'),
] 