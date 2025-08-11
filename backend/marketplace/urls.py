from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, ProductReviewViewSet,
    ProductImageViewSet, ProductVariantViewSet, CartViewSet,
    OrderViewSet, MerchantProductViewSet, MerchantOrderViewSet,
    SearchAPIView
)

# Create routers
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'reviews', ProductReviewViewSet)
router.register(r'images', ProductImageViewSet)
router.register(r'variants', ProductVariantViewSet)
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')

# Merchant-specific routers
merchant_router = DefaultRouter()
merchant_router.register(r'products', MerchantProductViewSet, basename='merchant-product')
merchant_router.register(r'orders', MerchantOrderViewSet, basename='merchant-order')

urlpatterns = [
    # Public API endpoints
    path('', include(router.urls)),
    path('search/', SearchAPIView.as_view(), name='search'),
    
    # Merchant-specific endpoints
    path('merchant/', include(merchant_router.urls)),
] 