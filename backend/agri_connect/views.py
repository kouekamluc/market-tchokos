from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.db.models import Q, Avg, Count, Sum
from django.shortcuts import get_object_or_404
from .models import (
    AgriCategory, AgriProduct, AgriProductImage, AgriProductReview,
    AgriCart, AgriCartItem, AgriOrder, AgriOrderItem, Farm, HarvestSchedule
)
from logistics.models import DeliveryTask
from .serializers import (
    AgriCategorySerializer, AgriProductSerializer, AgriProductDetailSerializer,
    AgriProductImageSerializer, AgriProductReviewSerializer,
    AgriCartSerializer, AgriCartItemSerializer, AgriOrderSerializer, AgriOrderDetailSerializer,
    FarmSerializer, HarvestScheduleSerializer,
    AddToAgriCartSerializer, UpdateAgriCartItemSerializer, CreateAgriOrderSerializer
)
from .services import (
    CustomerService, FarmerService, DeliveryAgentService, AdminService, AnalyticsService
)
from .workflows import (
    CustomerWorkflow, FarmerWorkflow, DeliveryAgentWorkflow, AdminWorkflow, SystemWorkflow
)
from .permissions import (
    IsCustomer, IsFarmer, IsDeliveryAgent, IsAdmin, IsVerifiedFarmer,
    IsProductOwner, IsOrderOwner, IsOrderFarmer, IsCartOwner, IsFarmOwner,
    CanModifyOrder, CanCancelOrder, CanUpdateOrderStatus, CanAddToCart,
    CanCreateProduct, CanManageInventory, CanAcceptDeliveryTask,
    CustomerOrReadOnly, FarmerOrReadOnly, OwnerOrReadOnly, IsHarvestScheduleOwner,
    IsAvailableDeliveryAgent
)
from django.contrib.auth import get_user_model
User = get_user_model()


# ============================================================================
# PUBLIC VIEWS (No authentication required)
# ============================================================================

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
    filterset_fields = ['category', 'farmer', 'is_active', 'is_organic']
    search_fields = ['name', 'description']
    ordering_fields = ['price_per_unit', 'created_at', 'harvest_date', 'average_rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = AgriProduct.objects.filter(is_active=True, is_available=True).select_related(
            'farmer', 'category'
        ).prefetch_related('images', 'reviews')
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price_per_unit__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_unit__lte=max_price)
        
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
        
        # Filter by verified farmers only
        verified_only = self.request.query_params.get('verified_only')
        if verified_only == 'true':
            queryset = queryset.filter(farmer__is_verified=True)
        
        return queryset


class AgriProductDetailView(generics.RetrieveAPIView):
    """Get detailed agricultural product information"""
    queryset = AgriProduct.objects.filter(is_active=True, is_available=True).select_related(
        'farmer', 'category'
    ).prefetch_related('images', 'reviews')
    serializer_class = AgriProductDetailSerializer
    permission_classes = [permissions.AllowAny]


# ============================================================================
# CUSTOMER VIEWS
# ============================================================================

class AgriCartView(APIView):
    """Agricultural cart management for customers"""
    permission_classes = [IsCustomer]
    
    def get(self, request):
        """Get customer's agricultural cart"""
        cart, created = AgriCart.objects.get_or_create(customer=request.user)
        serializer = AgriCartSerializer(cart)
        return Response(serializer.data)
    
    def post(self, request):
        """Add item to agricultural cart using business logic"""
        serializer = AddToAgriCartSerializer(data=request.data)
        if serializer.is_valid():
            result = CustomerService.add_to_cart(
                request.user,
                serializer.validated_data['product_id'],
                serializer.validated_data['quantity']
            )
            
            if result['success']:
                cart_serializer = AgriCartSerializer(result['cart'])
                return Response(cart_serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgriCartItemView(APIView):
    """Individual agricultural cart item management for customers"""
    permission_classes = [IsCustomer]
    
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
    """List and create agricultural orders for customers"""
    serializer_class = AgriOrderSerializer
    permission_classes = [IsCustomer]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return AgriOrder.objects.filter(customer=self.request.user).select_related(
            'delivery_address', 'delivery_agent'
        ).prefetch_related('items__product')
    
    def post(self, request, *args, **kwargs):
        """Create new agricultural order from cart using business logic"""
        serializer = CreateAgriOrderSerializer(data=request.data)
        if serializer.is_valid():
            result = CustomerService.create_order_from_cart(
                request.user,
                serializer.validated_data['delivery_address'],
                serializer.validated_data['payment_method'],
                serializer.validated_data.get('notes', '')
            )
            
            if result['success']:
                order_serializer = AgriOrderDetailSerializer(result['order'])
                return Response(order_serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgriOrderDetailView(generics.RetrieveAPIView):
    """Get agricultural order details for customers"""
    serializer_class = AgriOrderDetailSerializer
    permission_classes = [IsCustomer, IsOrderOwner]
    
    def get_queryset(self):
        return AgriOrder.objects.filter(customer=self.request.user).select_related(
            'delivery_address', 'delivery_agent'
        ).prefetch_related('items__product')


class AgriOrderCancelView(APIView):
    """Cancel agricultural order for customers"""
    permission_classes = [IsCustomer]
    
    def post(self, request, order_id):
        """Cancel agricultural order using business logic"""
        result = CustomerService.cancel_order(request.user, order_id)
        
        if result['success']:
            return Response({
                'message': result['message'],
                'order_id': order_id
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


class AgriProductReviewListView(generics.ListCreateAPIView):
    """List and create agricultural product reviews for customers"""
    serializer_class = AgriProductReviewSerializer
    permission_classes = [IsCustomer]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        return AgriProductReview.objects.filter(
            product_id=product_id, is_approved=True
        ).select_related('user')
    
    def perform_create(self, serializer):
        """Create review using business logic"""
        product_id = self.kwargs.get('product_id')
        result = CustomerService.add_product_review(
            self.request.user,
            product_id,
            serializer.validated_data['rating'],
            serializer.validated_data['comment'],
            serializer.validated_data.get('title', '')
        )
        
        if result['success']:
            serializer.save(
                product_id=product_id,
                user=self.request.user
            )
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(result['error'])


# ============================================================================
# FARMER VIEWS
# ============================================================================

class FarmListView(generics.ListCreateAPIView):
    """List and create farms for farmers"""
    serializer_class = FarmSerializer
    permission_classes = [IsFarmer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['farming_method', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'size']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Farm.objects.filter(farmer=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)


class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual farms for farmers"""
    serializer_class = FarmSerializer
    permission_classes = [IsFarmer, IsFarmOwner]
    
    def get_queryset(self):
        return Farm.objects.filter(farmer=self.request.user)


class FarmerProductListView(generics.ListCreateAPIView):
    """List and create agricultural products for farmers"""
    serializer_class = AgriProductSerializer
    permission_classes = [IsVerifiedFarmer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active', 'is_on_sale', 'is_organic']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'stock_quantity', 'harvest_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return AgriProduct.objects.filter(farmer=self.request.user).select_related('category')
    
    def perform_create(self, serializer):
        """Create product using business logic"""
        result = FarmerService.create_product(
            self.request.user,
            serializer.validated_data
        )
        
        if result['success']:
            serializer.save(farmer=self.request.user)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(result['error'])


class FarmerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual agricultural products for farmers"""
    serializer_class = AgriProductDetailSerializer
    permission_classes = [IsVerifiedFarmer, IsProductOwner]
    
    def get_queryset(self):
        return AgriProduct.objects.filter(farmer=self.request.user)


class FarmerOrderListView(generics.ListAPIView):
    """List orders for farmers"""
    serializer_class = AgriOrderSerializer
    permission_classes = [IsFarmer]
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
    permission_classes = [IsFarmer]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_completed']
    ordering_fields = ['planned_harvest_date', 'created_at']
    ordering = ['planned_harvest_date']
    
    def get_queryset(self):
        return HarvestSchedule.objects.filter(farmer=self.request.user).select_related('farm')
    
    def perform_create(self, serializer):
        """Create harvest schedule using business logic"""
        result = FarmerService.create_harvest_schedule(
            self.request.user,
            serializer.validated_data
        )
        
        if result['success']:
            serializer.save(farmer=self.request.user)
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(result['error'])


class HarvestScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual harvest schedules for farmers"""
    serializer_class = HarvestScheduleSerializer
    permission_classes = [IsFarmer, IsHarvestScheduleOwner]
    
    def get_queryset(self):
        return HarvestSchedule.objects.filter(farmer=self.request.user)


# ============================================================================
# DELIVERY AGENT VIEWS
# ============================================================================

class DeliveryAgentDashboardView(APIView):
    """Delivery agent dashboard"""
    permission_classes = [IsDeliveryAgent]
    
    def get(self, request):
        """Get delivery agent dashboard data"""
        # Get assigned tasks
        assigned_tasks = DeliveryTask.objects.filter(
            delivery_agent=request.user
        ).select_related('customer', 'farmer')
        
        # Get completed tasks today
        from django.utils import timezone
        today = timezone.now().date()
        completed_today = assigned_tasks.filter(
            status='completed',
            completed_at__date=today
        ).count()
        
        # Get earnings today
        earnings_today = assigned_tasks.filter(
            status='completed',
            completed_at__date=today
        ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        
        return Response({
            'assigned_tasks': assigned_tasks.count(),
            'completed_today': completed_today,
            'earnings_today': earnings_today,
            'is_available': request.user.is_available
        })


class AvailableTasksView(generics.ListAPIView):
    """List available delivery tasks for delivery agents"""
    permission_classes = [IsAvailableDeliveryAgent]
    
    def get_queryset(self):
        if not self.request.user.current_location:
            return DeliveryTask.objects.none()
        
        # Get tasks within reasonable distance
        return DeliveryTask.objects.filter(
            status='pending'
        ).annotate(
            distance=self.request.user.current_location.distance('pickup_location')
        ).filter(
            distance__lte=D(km=20)
        ).order_by('distance')


class AcceptTaskView(APIView):
    """Accept delivery task for delivery agents"""
    permission_classes = [IsAvailableDeliveryAgent]
    
    def post(self, request, task_id):
        """Accept delivery task using business logic"""
        result = DeliveryAgentService.accept_delivery_task(
            request.user, task_id
        )
        
        if result['success']:
            return Response({
                'message': result['message'],
                'task': result['task']
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


class UpdateTaskStatusView(APIView):
    """Update task status for delivery agents"""
    permission_classes = [IsDeliveryAgent]
    
    def post(self, request, task_id):
        """Update task status using business logic"""
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if not new_status:
            return Response({
                'error': 'Status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = DeliveryAgentService.update_task_status(
            request.user, task_id, new_status, notes
        )
        
        if result['success']:
            return Response({
                'message': result['message'],
                'task': result['task']
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


class UpdateLocationView(APIView):
    """Update delivery agent location"""
    permission_classes = [IsDeliveryAgent]
    
    def post(self, request):
        """Update location using business logic"""
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not latitude or not longitude:
            return Response({
                'error': 'Latitude and longitude are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = DeliveryAgentService.update_location(
            request.user, latitude, longitude
        )
        
        if result['success']:
            return Response({
                'message': result['message']
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# ADMIN VIEWS
# ============================================================================

class AdminDashboardView(APIView):
    """Admin dashboard"""
    permission_classes = [IsAdmin]
    
    def get(self, request):
        """Get admin dashboard data"""
        # Get system statistics
        total_users = User.objects.count()
        total_farmers = User.objects.filter(user_type='farmer').count()
        total_customers = User.objects.filter(user_type='customer').count()
        total_products = AgriProduct.objects.count()
        total_orders = AgriOrder.objects.count()
        
        # Get pending verifications
        pending_verifications = User.objects.filter(
            user_type='farmer', is_verified=False
        ).count()
        
        # Get pending product approvals
        pending_products = AgriProduct.objects.filter(is_active=False).count()
        
        return Response({
            'total_users': total_users,
            'total_farmers': total_farmers,
            'total_customers': total_customers,
            'total_products': total_products,
            'total_orders': total_orders,
            'pending_verifications': pending_verifications,
            'pending_products': pending_products
        })


class VerifyFarmerView(APIView):
    """Verify farmer account for admins"""
    permission_classes = [IsAdmin]
    
    def post(self, request, farmer_id):
        """Verify farmer using business logic"""
        verification_status = request.data.get('verification_status')
        notes = request.data.get('notes', '')
        
        if verification_status is None:
            return Response({
                'error': 'Verification status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = AdminService.verify_farmer(
            request.user, farmer_id, verification_status, notes
        )
        
        if result['success']:
            return Response({
                'message': result['message'],
                'farmer': result['farmer']
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


class ManageProductApprovalView(APIView):
    """Manage product approval for admins"""
    permission_classes = [IsAdmin]
    
    def post(self, request, product_id):
        """Manage product approval using business logic"""
        is_approved = request.data.get('is_approved')
        reason = request.data.get('reason', '')
        
        if is_approved is None:
            return Response({
                'error': 'Approval status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = AdminService.manage_product_approval(
            request.user, product_id, is_approved, reason
        )
        
        if result['success']:
            return Response({
                'message': result['message'],
                'product': result['product']
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# ANALYTICS VIEWS
# ============================================================================

class CustomerDashboardView(APIView):
    """Customer dashboard analytics"""
    permission_classes = [IsCustomer]
    
    def get(self, request):
        """Get customer dashboard data using business logic"""
        result = AnalyticsService.get_customer_dashboard_data(request.user)
        
        if result['success']:
            return Response(result['data'])
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


class FarmerDashboardView(APIView):
    """Farmer dashboard analytics"""
    permission_classes = [IsFarmer]
    
    def get(self, request):
        """Get farmer dashboard data using business logic"""
        result = AnalyticsService.get_farmer_dashboard_data(request.user)
        
        if result['success']:
            return Response(result['data'])
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# WORKFLOW VIEWS
# ============================================================================

class CompletePurchaseView(APIView):
    """Complete purchase workflow for customers"""
    permission_classes = [IsCustomer]
    
    def post(self, request):
        """Complete purchase using workflow"""
        product_ids = request.data.get('product_ids', [])
        quantities = request.data.get('quantities', [])
        delivery_address = request.data.get('delivery_address')
        payment_method = request.data.get('payment_method')
        notes = request.data.get('notes', '')
        
        if not all([product_ids, quantities, delivery_address, payment_method]):
            return Response({
                'error': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = CustomerWorkflow.complete_purchase_flow(
            request.user, product_ids, quantities, delivery_address, payment_method, notes
        )
        
        if result['success']:
            return Response({
                'message': result['message'],
                'order': result['order'],
                'next_steps': result['next_steps']
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


class OrderTrackingView(APIView):
    """Order tracking workflow for customers"""
    permission_classes = [IsCustomer]
    
    def get(self, request, order_id):
        """Track order using workflow"""
        result = CustomerWorkflow.order_tracking_flow(request.user, order_id)
        
        if result['success']:
            return Response({
                'order': result['order'],
                'delivery_task': result['delivery_task'],
                'estimated_delivery': result['estimated_delivery'],
                'timeline': result['timeline'],
                'current_status': result['current_status'],
                'next_action': result['next_action']
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


class OrderFulfillmentView(APIView):
    """Order fulfillment workflow for farmers"""
    permission_classes = [IsFarmer]
    
    def post(self, request, order_id):
        """Fulfill order using workflow"""
        action = request.data.get('action')
        notes = request.data.get('notes', '')
        
        if not action:
            return Response({
                'error': 'Action is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = FarmerWorkflow.order_fulfillment_flow(
            request.user, order_id, action, notes
        )
        
        if result['success']:
            return Response({
                'message': result['message'],
                'order': result['order']
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# SYSTEM AUTOMATION VIEWS
# ============================================================================

class SystemAutomationView(APIView):
    """System automation for admins"""
    permission_classes = [IsAdmin]
    
    def post(self, request):
        """Run system automation"""
        automation_type = request.data.get('automation_type')
        
        if automation_type == 'stock_management':
            result = SystemWorkflow.automated_stock_management()
        elif automation_type == 'order_automation':
            result = SystemWorkflow.order_status_automation()
        elif automation_type == 'delivery_optimization':
            result = SystemWorkflow.delivery_optimization()
        else:
            return Response({
                'error': 'Invalid automation type'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if result['success']:
            return Response({
                'message': result['message'],
                'data': result
            })
        
        return Response({
            'error': result['error']
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# LEGACY VIEWS (Updated with new business logic)
# ============================================================================

class AgriCartAddItemView(APIView):
    """Add item to agricultural cart using business logic"""
    permission_classes = [IsCustomer]
    
    def post(self, request, cart_id):
        """Add item to agricultural cart"""
        cart = get_object_or_404(AgriCart, id=cart_id, customer=request.user)
        serializer = AddToAgriCartSerializer(data=request.data)
        
        if serializer.is_valid():
            result = CustomerService.add_to_cart(
                request.user,
                serializer.validated_data['product_id'],
                serializer.validated_data['quantity']
            )
            
            if result['success']:
                cart_serializer = AgriCartSerializer(result['cart'])
                return Response(cart_serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgriCartUpdateItemView(APIView):
    """Update agricultural cart item using business logic"""
    permission_classes = [IsCustomer]
    
    def put(self, request, cart_id):
        """Update agricultural cart item quantity"""
        cart = get_object_or_404(AgriCart, id=cart_id, customer=request.user)
        serializer = UpdateAgriCartItemSerializer(data=request.data)
        
        if serializer.is_valid():
            product_id = request.data.get('product_id')
            cart_item = get_object_or_404(AgriCartItem, cart=cart, product_id=product_id)
            
            cart_item.quantity = serializer.validated_data['quantity']
            cart_item.save()
            
            if cart_item.quantity <= 0:
                cart_item.delete()
            
            cart_serializer = AgriCartSerializer(cart)
            return Response(cart_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AgriCartRemoveItemView(APIView):
    """Remove item from agricultural cart using business logic"""
    permission_classes = [IsCustomer]
    
    def delete(self, request, cart_id):
        """Remove item from agricultural cart"""
        cart = get_object_or_404(AgriCart, id=cart_id, customer=request.user)
        product_id = request.data.get('product_id')
        
        if product_id:
            cart_item = get_object_or_404(AgriCartItem, cart=cart, product_id=product_id)
            cart_item.delete()
        
        cart_serializer = AgriCartSerializer(cart)
        return Response(cart_serializer.data)


class AgriCartClearView(APIView):
    """Clear agricultural cart using business logic"""
    permission_classes = [IsCustomer]
    
    def delete(self, request, cart_id):
        """Clear agricultural cart"""
        cart = get_object_or_404(AgriCart, id=cart_id, customer=request.user)
        cart.items.all().delete()
        
        cart_serializer = AgriCartSerializer(cart)
        return Response(cart_serializer.data)


@api_view(['POST'])
@permission_classes([IsFarmer])
def request_agri_delivery(request, order_id):
    """Request delivery for an agricultural order using business logic"""
    result = FarmerWorkflow.order_fulfillment_flow(
        request.user, order_id, 'process'
    )
    
    if result['success']:
        return Response({
            'message': 'Delivery requested successfully',
            'order_id': order_id
        })
    
    return Response({
        'error': result['error']
    }, status=status.HTTP_400_BAD_REQUEST) 