from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.AgriCategoryListView.as_view(), name='agri-category-list'),
    path('categories/<int:pk>/', views.AgriCategoryDetailView.as_view(), name='agri-category-detail'),
    
    # Products
    path('products/', views.AgriProductListView.as_view(), name='agri-product-list'),
    path('products/<int:pk>/', views.AgriProductDetailView.as_view(), name='agri-product-detail'),
    path('products/<int:product_id>/reviews/', views.AgriProductReviewListView.as_view(), name='agri-product-reviews'),
    
    # Cart
    path('cart/', views.AgriCartView.as_view(), name='agri-cart'),
    path('cart/items/<int:item_id>/', views.AgriCartItemView.as_view(), name='agri-cart-item'),
    
    # Orders
    path('orders/', views.AgriOrderListView.as_view(), name='agri-order-list'),
    path('orders/<int:pk>/', views.AgriOrderDetailView.as_view(), name='agri-order-detail'),
    path('orders/<int:order_id>/request-delivery/', views.request_agri_delivery, name='request-agri-delivery'),
    
    # Farms
    path('farms/', views.FarmListView.as_view(), name='farm-list'),
    path('farms/<int:pk>/', views.FarmDetailView.as_view(), name='farm-detail'),
    
    # Farmer specific
    path('farmer/products/', views.FarmerProductListView.as_view(), name='farmer-products'),
    path('farmer/products/<int:pk>/', views.FarmerProductDetailView.as_view(), name='farmer-product-detail'),
    path('farmer/orders/', views.FarmerOrderListView.as_view(), name='farmer-orders'),
    
    # Harvest schedules
    path('harvest-schedules/', views.HarvestScheduleListView.as_view(), name='harvest-schedule-list'),
    path('harvest-schedules/<int:pk>/', views.HarvestScheduleDetailView.as_view(), name='harvest-schedule-detail'),
] 