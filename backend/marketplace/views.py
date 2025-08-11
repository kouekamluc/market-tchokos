from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.http import Http404
from .models import Category, Product, ProductImage, ProductVariant, ProductReview, Cart, CartItem, Order, OrderItem
from .serializers import (
    CategorySerializer, ProductSerializer, ProductImageSerializer, 
    ProductVariantSerializer, ProductReviewSerializer, CartSerializer, 
    CartItemSerializer, OrderSerializer, OrderItemSerializer
)
from users.models import User
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for product categories"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for categories
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get products in a specific category"""
        category = self.get_object()
        products = Product.objects.filter(
            category=category,
            is_active=True
        ).select_related('merchant', 'category')
        
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for products"""
    queryset = Product.objects.filter(is_active=True).select_related('merchant', 'category')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'merchant', 'is_on_sale', 'handmade', 'fast_delivery']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(category__name__icontains=search) |
                Q(merchant__business_name__icontains=search)
            )
        
        # Price range filter
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Location-based filtering
        lat = self.request.query_params.get('lat', None)
        lng = self.request.query_params.get('lng', None)
        radius = self.request.query_params.get('radius', 50)  # km
        
        if lat and lng:
            user_location = Point(float(lng), float(lat), srid=4326)
            queryset = queryset.filter(
                location__distance_lte=(user_location, radius * 1000)  # Convert km to meters
            ).annotate(
                distance=Distance('location', user_location)
            ).order_by('distance')
        
        # Rating filter
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        # Stock filter
        in_stock = self.request.query_params.get('in_stock', None)
        if in_stock == 'true':
            queryset = queryset.filter(stock__gt=0)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get reviews for a specific product"""
        product = self.get_object()
        reviews = ProductReview.objects.filter(
            product=product,
            is_approved=True
        ).select_related('user')
        
        serializer = ProductReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_review(self, request, pk=None):
        """Add a review to a product"""
        product = self.get_object()
        serializer = ProductReviewSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(product=product, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CartViewSet(viewsets.ModelViewSet):
    """API endpoint for shopping cart"""
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_object(self):
        """Get or create cart for the user"""
        try:
            return super().get_object()
        except Http404:
            # If no cart exists, create one
            cart, created = Cart.objects.get_or_create(
                user=self.request.user,
                defaults={'is_active': True}
            )
            return cart
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add item to cart"""
        cart = self.get_object()
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id, is_active=True)
            variant = None
            if variant_id:
                variant = ProductVariant.objects.get(id=variant_id, product=product)
            
            # Check if item already exists in cart
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                variant=variant,
                defaults={'quantity': quantity}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.save()
            
            # Create notification for cart addition
            try:
                Notification.objects.create(
                    user=request.user,
                    title="Item Added to Cart",
                    message=f"{product.name} has been added to your cart",
                    notification_type='system',
                    data={
                        'cart_item_id': cart_item.id,
                        'product_id': product.id,
                        'product_name': product.name,
                        'quantity': cart_item.quantity,
                        'action': 'view_cart'
                    },
                    action_url='/cart'
                )
            except Exception as e:
                logger.error(f"Failed to create cart notification: {e}")
            
            serializer = CartSerializer(cart)
            return Response(serializer.data)
            
        except (Product.DoesNotExist, ProductVariant.DoesNotExist):
            return Response(
                {'error': 'Product or variant not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def update_item(self, request, pk=None):
        """Update cart item quantity"""
        cart = self.get_object()
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            cart_item = CartItem.objects.get(id=item_id, cart=cart)
            if quantity <= 0:
                cart_item.delete()
            else:
                cart_item.quantity = quantity
                cart_item.save()
            
            serializer = CartSerializer(cart)
            return Response(serializer.data)
            
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        """Remove item from cart"""
        cart = self.get_object()
        item_id = request.data.get('item_id')
        
        try:
            cart_item = CartItem.objects.get(id=item_id, cart=cart)
            cart_item.delete()
            
            serializer = CartSerializer(cart)
            return Response(serializer.data)
            
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        """Clear all items from cart"""
        cart = self.get_object()
        cart.items.all().delete()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    """API endpoint for orders"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()
        
        if order.status in ['pending', 'confirmed']:
            order.status = 'cancelled'
            order.save()
            
            # Restore product stock
            for item in order.items.all():
                item.product.stock += item.quantity
                item.product.save()
            
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Order cannot be cancelled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ProductReviewViewSet(viewsets.ModelViewSet):
    """API endpoint for product reviews"""
    queryset = ProductReview.objects.filter(is_approved=True)
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProductImageViewSet(viewsets.ModelViewSet):
    """API endpoint for product images"""
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProductVariantViewSet(viewsets.ModelViewSet):
    """API endpoint for product variants"""
    queryset = ProductVariant.objects.filter(is_active=True)
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.AllowAny]


# Merchant-specific views
class MerchantProductViewSet(viewsets.ModelViewSet):
    """API endpoint for merchant to manage their products"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Product.objects.filter(merchant=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(merchant=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle product active status"""
        product = self.get_object()
        product.is_active = not product.is_active
        product.save()
        
        serializer = ProductSerializer(product)
        return Response(serializer.data)


class MerchantOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for merchant to view orders for their products"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get orders that contain products from this merchant
        return Order.objects.filter(
            items__product__merchant=self.request.user
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status (for merchant)"""
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in ['confirmed', 'processing', 'shipped']:
            order.status = new_status
            order.save()
            
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


# Search API
class SearchAPIView(APIView):
    """API endpoint for product search"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        category = request.query_params.get('category', None)
        min_price = request.query_params.get('min_price', None)
        max_price = request.query_params.get('max_price', None)
        
        products = Product.objects.filter(is_active=True)
        
        if query:
            products = products.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(category__name__icontains=query) |
                Q(merchant__business_name__icontains=query)
            )
        
        if category:
            products = products.filter(category__slug=category)
        
        if min_price:
            products = products.filter(price__gte=min_price)
        
        if max_price:
            products = products.filter(price__lte=max_price)
        
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data) 