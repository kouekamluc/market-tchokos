from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.db.models import Q, Avg, Count
from django.shortcuts import get_object_or_404
from .models import (
    AgriCategory, AgriProduct, AgriProductImage, AgriProductReview,
    AgriCart, AgriCartItem, AgriOrder, AgriOrderItem, Farm, HarvestSchedule
)
from .serializers import (
    AgriCategorySerializer, AgriProductSerializer, AgriProductDetailSerializer,
    AgriProductImageSerializer, AgriProductReviewSerializer,
    AgriCartSerializer, AgriCartItemSerializer, AgriOrderSerializer, AgriOrderDetailSerializer,
    FarmSerializer, HarvestScheduleSerializer,
    AddToAgriCartSerializer, UpdateAgriCartItemSerializer, CreateAgriOrderSerializer
)


class AgriCategoryListView(generics.ListAPIView):
    """List all active agricultural categories"""
    queryset = AgriCategory.objects.filter(is_active=True)
    serializer_class = AgriCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for categories


class AgriCategoryDetailView(generics.RetrieveAPIView):
    """Get agricultural category details with products"""
    queryset = AgriCategory.objects.filter(is_active=True)
    serializer_class = AgriCategorySerializer
    permission_classes = [permissions.AllowAny]


class AgriProductListView(generics.ListAPIView):
    """List agricultural products with filtering and search"""
    serializer_class = AgriProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'farmer', 'is_active', 'is_on_sale', 'is_organic']
    search_fields = ['name', 'description', 'farmer__business_name']
    ordering_fields = ['price', 'created_at', 'harvest_date', 'average_rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = AgriProduct.objects.filter(is_active=True).select_related(
            'farmer', 'category'
        ).prefetch_related('images', 'reviews')
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by harvest date (freshness)
        harvested_today = self.request.query_params.get('harvested_today')
        if harvested_today == 'true':
            from django.utils import timezone
            today = timezone.now().date()
            queryset = queryset.filter(harvest_date=today)
        
        # Filter by location (distance from user)
        user_location = self.request.query_params.get('location')
        if user_location:
            try:
                lat, lng = map(float, user_location.split(','))
                user_point = Point(lng, lat, srid=4326)
                queryset = queryset.annotate(
                    distance=Distance('farm_location', user_point)
                ).filter(distance__lte=D(km=50)).order_by('distance')
            except (ValueError, TypeError):
                pass
        
        return queryset


class AgriProductDetailView(generics.RetrieveAPIView):
    """Get detailed agricultural product information"""
    queryset = AgriProduct.objects.filter(is_active=True).select_related(
        'farmer', 'category'
    ).prefetch_related('images', 'reviews')
    serializer_class = AgriProductDetailSerializer
    permission_classes = [permissions.AllowAny]


class AgriProductReviewListView(generics.ListCreateAPIView):
    """List and create agricultural product reviews"""
    serializer_class = AgriProductReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        return AgriProductReview.objects.filter(product_id=product_id).select_related('customer')
    
    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_id')
        serializer.save(
            product_id=product_id,
            customer=self.request.user
        )


class AgriCartView(APIView):
    """Agricultural cart management"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user's agricultural cart"""
        cart, created = AgriCart.objects.get_or_create(customer=request.user)
        serializer = AgriCartSerializer(cart)
        return Response(serializer.data)
    
    def post(self, request):
        """Add item to agricultural cart"""
        serializer = AddToAgriCartSerializer(data=request.data)
        if serializer.is_valid():
            cart, created = AgriCart.objects.get_or_create(customer=request.user)
            product = get_object_or_404(AgriProduct, id=serializer.validated_data['product_id'])
            
            # Check if item already exists in cart
            cart_item, created = AgriCartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': serializer.validated_data['quantity']}
            )
            
            if not created:
                cart_item.quantity += serializer.validated_data['quantity']
                cart_item.save()
            
            cart_serializer = AgriCartSerializer(cart)
            return Response(cart_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgriCartItemView(APIView):
    """Individual agricultural cart item management"""
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request, item_id):
        """Update agricultural cart item quantity"""
        cart_item = get_object_or_404(AgriCartItem, id=item_id, cart__customer=request.user)
        serializer = UpdateAgriCartItemSerializer(data=request.data)
        
        if serializer.is_valid():
            cart_item.quantity = serializer.validated_data['quantity']
            cart_item.save()
            
            if cart_item.quantity <= 0:
                cart_item.delete()
            
            cart = AgriCart.objects.get(customer=request.user)
            cart_serializer = AgriCartSerializer(cart)
            return Response(cart_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, item_id):
        """Remove item from agricultural cart"""
        cart_item = get_object_or_404(AgriCartItem, id=item_id, cart__customer=request.user)
        cart_item.delete()
        
        cart = AgriCart.objects.get(customer=request.user)
        cart_serializer = AgriCartSerializer(cart)
        return Response(cart_serializer.data)


class AgriOrderListView(generics.ListCreateAPIView):
    """List and create agricultural orders"""
    serializer_class = AgriOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return AgriOrder.objects.filter(customer=self.request.user).select_related(
            'delivery_address', 'delivery_agent'
        ).prefetch_related('items__product')
    
    def post(self, request, *args, **kwargs):
        """Create new agricultural order from cart"""
        serializer = CreateAgriOrderSerializer(data=request.data)
        if serializer.is_valid():
            cart = get_object_or_404(AgriCart, customer=request.user)
            if not cart.items.exists():
                return Response(
                    {'error': 'Cart is empty'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create order
            order = AgriOrder.objects.create(
                customer=request.user,
                delivery_address_id=serializer.validated_data['delivery_address_id'],
                payment_method=serializer.validated_data['payment_method'],
                notes=serializer.validated_data.get('notes', ''),
                total_amount=cart.total_amount,
                delivery_fee=0,  # Calculate based on distance
                commission_amount=cart.total_amount * 0.12  # 12% commission
            )
            
            # Create order items from cart
            for cart_item in cart.items.all():
                AgriOrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price,
                    total_price=cart_item.total_price
                )
            
            # Clear cart
            cart.items.all().delete()
            
            order_serializer = AgriOrderDetailSerializer(order)
            return Response(order_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgriOrderDetailView(generics.RetrieveAPIView):
    """Get agricultural order details"""
    serializer_class = AgriOrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AgriOrder.objects.filter(customer=self.request.user).select_related(
            'delivery_address', 'delivery_agent'
        ).prefetch_related('items__product')


# Farmer-specific views
class FarmListView(generics.ListCreateAPIView):
    """List and create farms for farmers"""
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['farming_method', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'size_hectares']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Farm.objects.filter(farmer=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)


class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual farms for farmers"""
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Farm.objects.filter(farmer=self.request.user)


class FarmerProductListView(generics.ListCreateAPIView):
    """List and create agricultural products for farmers"""
    serializer_class = AgriProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active', 'is_on_sale', 'is_organic']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'stock', 'harvest_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return AgriProduct.objects.filter(farmer=self.request.user).select_related('category')
    
    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)


class FarmerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual agricultural products for farmers"""
    serializer_class = AgriProductDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AgriProduct.objects.filter(farmer=self.request.user)


class FarmerOrderListView(generics.ListAPIView):
    """List orders for farmers"""
    serializer_class = AgriOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return AgriOrder.objects.filter(
            items__product__farmer=self.request.user
        ).distinct().select_related('customer', 'delivery_address')


class HarvestScheduleListView(generics.ListCreateAPIView):
    """List and create harvest schedules for farmers"""
    serializer_class = HarvestScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_completed']
    ordering_fields = ['expected_harvest_date', 'created_at']
    ordering = ['expected_harvest_date']
    
    def get_queryset(self):
        return HarvestSchedule.objects.filter(farm__farmer=self.request.user).select_related('farm')
    
    def perform_create(self, serializer):
        # Ensure the farm belongs to the current farmer
        farm = get_object_or_404(Farm, id=serializer.validated_data['farm'].id, farmer=self.request.user)
        serializer.save(farm=farm)


class HarvestScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual harvest schedules for farmers"""
    serializer_class = HarvestScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return HarvestSchedule.objects.filter(farm__farmer=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def request_agri_delivery(request, order_id):
    """Request delivery for an agricultural order"""
    order = get_object_or_404(
        AgriOrder, 
        id=order_id,
        items__product__farmer=request.user
    )
    
    # This would trigger the logistics system to find available delivery agents
    # For now, just update the order status
    order.status = 'pending_delivery'
    order.save()
    
    return Response({
        'message': 'Delivery requested successfully',
        'order_id': order.id
    }) 