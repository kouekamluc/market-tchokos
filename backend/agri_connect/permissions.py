"""
Permissions System for AgriConnect App
Controls access to different features based on user types and business rules
"""

from rest_framework import permissions
from django.contrib.auth.models import AnonymousUser
from users.models import User


class IsCustomer(permissions.BasePermission):
    """Allow access only to customers"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'customer'
        )


class IsFarmer(permissions.BasePermission):
    """Allow access only to farmers"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'farmer'
        )


class IsDeliveryAgent(permissions.BasePermission):
    """Allow access only to delivery agents"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'delivery_agent'
        )


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin users"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_staff
        )


class IsVerifiedFarmer(permissions.BasePermission):
    """Allow access only to verified farmers"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'farmer' and
            request.user.is_verified
        )


class IsAvailableDeliveryAgent(permissions.BasePermission):
    """Allow access only to available delivery agents"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'delivery_agent' and
            request.user.is_available
        )


class IsProductOwner(permissions.BasePermission):
    """Allow access only to the owner of the product"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the user is the farmer who owns the product
        if hasattr(obj, 'farmer'):
            return obj.farmer == request.user
        elif hasattr(obj, 'product') and hasattr(obj.product, 'farmer'):
            return obj.product.farmer == request.user
        return False


class IsOrderOwner(permissions.BasePermission):
    """Allow access only to the owner of the order"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the user is the customer who placed the order
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        return False


class IsOrderFarmer(permissions.BasePermission):
    """Allow access only to the farmer who has products in the order"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the user is a farmer with products in the order
        if hasattr(obj, 'items'):
            return obj.items.filter(product__farmer=request.user).exists()
        return False


class IsCartOwner(permissions.BasePermission):
    """Allow access only to the owner of the cart"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the user is the customer who owns the cart
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        return False


class IsFarmOwner(permissions.BasePermission):
    """Allow access only to the owner of the farm"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the user is the farmer who owns the farm
        if hasattr(obj, 'farmer'):
            return obj.farmer == request.user
        return False


class IsHarvestScheduleOwner(permissions.BasePermission):
    """Allow access only to the owner of the harvest schedule"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the user is the farmer who owns the harvest schedule
        if hasattr(obj, 'farmer'):
            return obj.farmer == request.user
        return False


class IsDeliveryTaskAgent(permissions.BasePermission):
    """Allow access only to the assigned delivery agent"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the user is the delivery agent assigned to the task
        if hasattr(obj, 'delivery_agent'):
            return obj.delivery_agent == request.user
        return False


class IsReviewOwner(permissions.BasePermission):
    """Allow access only to the owner of the review"""
    
    def has_object_permission(self, request, view, obj):
        # Check if the user is the customer who wrote the review
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class CanModifyOrder(permissions.BasePermission):
    """Check if user can modify the order based on its status"""
    
    def has_object_permission(self, request, view, obj):
        # Only allow modifications if order is in pending or confirmed status
        if hasattr(obj, 'status'):
            return obj.status in ['pending', 'confirmed']
        return False


class CanCancelOrder(permissions.BasePermission):
    """Check if user can cancel the order"""
    
    def has_object_permission(self, request, view, obj):
        # Only allow cancellation if order is in pending or confirmed status
        if hasattr(obj, 'status'):
            return obj.status in ['pending', 'confirmed']
        return False


class CanUpdateOrderStatus(permissions.BasePermission):
    """Check if user can update order status"""
    
    def has_object_permission(self, request, view, obj):
        # Farmers can update status of orders with their products
        if request.user.user_type == 'farmer':
            return obj.items.filter(product__farmer=request.user).exists()
        
        # Delivery agents can update status of assigned tasks
        if request.user.user_type == 'delivery_agent':
            delivery_task = getattr(obj, 'delivery_task', None)
            if delivery_task:
                return delivery_task.delivery_agent == request.user
        
        return False


class CanAddToCart(permissions.BasePermission):
    """Check if user can add product to cart"""
    
    def has_permission(self, request, view):
        # Only customers can add to cart
        if not (request.user and request.user.is_authenticated and request.user.user_type == 'customer'):
            return False
        
        # Check if product is available and from verified farmer
        product_id = request.data.get('product_id')
        if product_id:
            try:
                from .models import AgriProduct
                product = AgriProduct.objects.get(id=product_id)
                return product.is_active and product.is_available and product.farmer.is_verified
            except:
                return False
        
        return True


class CanCreateProduct(permissions.BasePermission):
    """Check if user can create products"""
    
    def has_permission(self, request, view):
        # Only verified farmers can create products
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'farmer' and
            request.user.is_verified
        )


class CanManageInventory(permissions.BasePermission):
    """Check if user can manage inventory"""
    
    def has_permission(self, request, view):
        # Only farmers can manage inventory
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'farmer'
        )


class CanAcceptDeliveryTask(permissions.BasePermission):
    """Check if user can accept delivery tasks"""
    
    def has_permission(self, request, view):
        # Only available delivery agents can accept tasks
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'delivery_agent' and
            request.user.is_available
        )


class CanViewAnalytics(permissions.BasePermission):
    """Check if user can view analytics"""
    
    def has_permission(self, request, view):
        # Only authenticated users can view their own analytics
        return request.user and request.user.is_authenticated


class IsReadOnly(permissions.BasePermission):
    """Allow read-only access"""
    
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS


class IsCreateOnly(permissions.BasePermission):
    """Allow only creation"""
    
    def has_permission(self, request, view):
        return request.method == 'POST'


class IsUpdateOnly(permissions.BasePermission):
    """Allow only updates"""
    
    def has_permission(self, request, view):
        return request.method in ['PUT', 'PATCH']


class IsDeleteOnly(permissions.BasePermission):
    """Allow only deletion"""
    
    def has_permission(self, request, view):
        return request.method == 'DELETE'


class CompositePermission(permissions.BasePermission):
    """Combine multiple permissions with AND logic"""
    
    def __init__(self, *permission_classes):
        self.permission_classes = permission_classes
    
    def has_permission(self, request, view):
        return all(
            permission().has_permission(request, view)
            for permission in self.permission_classes
        )
    
    def has_object_permission(self, request, view, obj):
        return all(
            permission().has_object_permission(request, view, obj)
            for permission in self.permission_classes
        )


class ConditionalPermission(permissions.BasePermission):
    """Apply different permissions based on conditions"""
    
    def __init__(self, condition_func, true_permission, false_permission):
        self.condition_func = condition_func
        self.true_permission = true_permission
        self.false_permission = false_permission
    
    def has_permission(self, request, view):
        if self.condition_func(request, view):
            return self.true_permission().has_permission(request, view)
        else:
            return self.false_permission().has_permission(request, view)
    
    def has_object_permission(self, request, view, obj):
        if self.condition_func(request, view):
            return self.true_permission().has_object_permission(request, view, obj)
        else:
            return self.false_permission().has_object_permission(request, view, obj)


# Predefined permission combinations
class CustomerOrReadOnly(permissions.BasePermission):
    """Allow customers to modify, others to read"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsCustomer().has_permission(request, view)


class FarmerOrReadOnly(permissions.BasePermission):
    """Allow farmers to modify, others to read"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsFarmer().has_permission(request, view)


class AdminOrReadOnly(permissions.BasePermission):
    """Allow admins to modify, others to read"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return IsAdmin().has_permission(request, view)


class OwnerOrReadOnly(permissions.BasePermission):
    """Allow owners to modify, others to read"""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Check if user is the owner
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        elif hasattr(obj, 'farmer'):
            return obj.farmer == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


# Business rule specific permissions
class CanPurchaseProduct(permissions.BasePermission):
    """Check if user can purchase a product"""
    
    def has_permission(self, request, view):
        # Only customers can purchase
        if not IsCustomer().has_permission(request, view):
            return False
        
        # Check if product is available
        product_id = request.data.get('product_id')
        if product_id:
            try:
                from .models import AgriProduct
                product = AgriProduct.objects.get(id=product_id)
                return (
                    product.is_active and 
                    product.is_available and 
                    product.stock_quantity > 0 and
                    product.farmer.is_verified
                )
            except:
                return False
        
        return True


class CanReviewProduct(permissions.BasePermission):
    """Check if user can review a product"""
    
    def has_permission(self, request, view):
        # Only customers can review
        if not IsCustomer().has_permission(request, view):
            return False
        
        # Check if customer has purchased the product
        product_id = request.data.get('product_id')
        if product_id:
            try:
                from .models import AgriOrderItem
                has_purchased = AgriOrderItem.objects.filter(
                    order__customer=request.user,
                    product_id=product_id,
                    order__status='delivered'
                ).exists()
                return has_purchased
            except:
                return False
        
        return True


class CanManageDelivery(permissions.BasePermission):
    """Check if user can manage delivery"""
    
    def has_permission(self, request, view):
        # Only delivery agents can manage delivery
        if not IsDeliveryAgent().has_permission(request, view):
            return False
        
        # Check if agent is available
        return request.user.is_available


# Permission decorators for views
def require_customer(view_func):
    """Decorator to require customer permissions"""
    def wrapper(request, *args, **kwargs):
        if not IsCustomer().has_permission(request, None):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Customer access required")
        return view_func(request, *args, **kwargs)
    return wrapper


def require_farmer(view_func):
    """Decorator to require farmer permissions"""
    def wrapper(request, *args, **kwargs):
        if not IsFarmer().has_permission(request, None):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Farmer access required")
        return view_func(request, *args, **kwargs)
    return wrapper


def require_delivery_agent(view_func):
    """Decorator to require delivery agent permissions"""
    def wrapper(request, *args, **kwargs):
        if not IsDeliveryAgent().has_permission(request, None):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Delivery agent access required")
        return view_func(request, *args, **kwargs)
    return wrapper


def require_admin(view_func):
    """Decorator to require admin permissions"""
    def wrapper(request, *args, **kwargs):
        if not IsAdmin().has_permission(request, None):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Admin access required")
        return view_func(request, *args, **kwargs)
    return wrapper
