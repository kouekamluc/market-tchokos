"""
Business Logic Services for AgriConnect App
Handles all business rules, workflows, and validations for different user types
"""

from django.db import transaction
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.utils import timezone
from django.db.models import Q, Avg, Count, Sum
from decimal import Decimal
import logging

from .models import (
    AgriProduct, AgriCart, AgriCartItem, AgriOrder, AgriOrderItem,
    AgriProductReview, Farm, HarvestSchedule
)
from users.models import User
from payments.models import Payment
from logistics.models import DeliveryTask

logger = logging.getLogger(__name__)


class CustomerService:
    """Business logic for customer users"""
    
    @staticmethod
    def add_to_cart(customer: User, product_id: str, quantity: int) -> dict:
        """Add product to customer's cart with business rules"""
        try:
            with transaction.atomic():
                # Validate product exists and is available
                product = AgriProduct.objects.select_for_update().get(
                    id=product_id, is_active=True, is_available=True
                )
                
                # Check stock availability
                if product.stock_quantity < quantity:
                    return {
                        'success': False,
                        'error': f'Only {product.stock_quantity} units available in stock'
                    }
                
                # Check if product is from verified farmer
                if not product.farmer.is_verified:
                    return {
                        'success': False,
                        'error': 'Product from unverified farmer cannot be added to cart'
                    }
                
                # Get or create cart
                cart, created = AgriCart.objects.get_or_create(
                    customer=customer,
                    defaults={'is_active': True}
                )
                
                # Check if item already exists
                cart_item, item_created = AgriCartItem.objects.get_or_create(
                    cart=cart,
                    product=product,
                    defaults={'quantity': quantity}
                )
                
                if not item_created:
                    # Update existing item quantity
                    new_quantity = cart_item.quantity + quantity
                    if new_quantity > product.stock_quantity:
                        return {
                            'success': False,
                            'error': f'Cannot add {quantity} more units. Only {product.stock_quantity - cart_item.quantity} available'
                        }
                    cart_item.quantity = new_quantity
                    cart_item.save()
                
                # Recalculate cart totals
                cart.refresh_from_db()
                
                return {
                    'success': True,
                    'cart': cart,
                    'message': 'Product added to cart successfully'
                }
                
        except AgriProduct.DoesNotExist:
            return {'success': False, 'error': 'Product not found or unavailable'}
        except Exception as e:
            logger.error(f"Error adding to cart: {str(e)}")
            return {'success': False, 'error': 'Failed to add product to cart'}
    
    @staticmethod
    def create_order_from_cart(customer: User, delivery_address: str, payment_method: str, notes: str = '') -> dict:
        """Create order from customer's cart with business rules"""
        try:
            with transaction.atomic():
                # Get customer's cart
                cart = AgriCart.objects.select_for_update().get(customer=customer)
                
                if not cart.items.exists():
                    return {'success': False, 'error': 'Cart is empty'}
                
                # Validate cart items
                for item in cart.items.all():
                    if not item.product.is_available:
                        return {'success': False, 'error': f'Product {item.product.name} is no longer available'}
                    
                    if item.product.stock_quantity < item.quantity:
                        return {'success': False, 'error': f'Insufficient stock for {item.product.name}'}
                
                # Calculate totals
                subtotal = sum(item.total_price for item in cart.items.all())
                delivery_fee = cart.delivery_fee
                commission_amount = subtotal * Decimal('0.12')  # 12% commission
                total_amount = subtotal + delivery_fee
                
                # Create order
                order = AgriOrder.objects.create(
                    customer=customer,
                    delivery_address=delivery_address,
                    payment_method=payment_method,
                    notes=notes,
                    total_amount=total_amount,
                    delivery_fee=delivery_fee,
                    commission_amount=commission_amount
                )
                
                # Create order items and update stock
                for cart_item in cart.items.all():
                    AgriOrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        unit_price=cart_item.product.price or cart_item.product.price_per_unit,
                        total_price=cart_item.total_price
                    )
                    
                    # Update product stock
                    product = cart_item.product
                    product.stock_quantity -= cart_item.quantity
                    if product.stock_quantity <= 0:
                        product.is_available = False
                    product.save()
                
                # Clear cart
                cart.items.all().delete()
                
                # Create payment record
                Payment.objects.create(
                    user=customer,
                    agri_order=order,
                    amount=total_amount,
                    payment_method=payment_method,
                    payment_status='pending'
                )
                
                return {
                    'success': True,
                    'order': order,
                    'message': 'Order created successfully'
                }
                
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return {'success': False, 'error': 'Failed to create order'}
    
    @staticmethod
    def cancel_order(customer: User, order_id: str) -> dict:
        """Cancel customer's order with business rules"""
        try:
            with transaction.atomic():
                order = AgriOrder.objects.select_for_update().get(
                    id=order_id, customer=customer
                )
                
                # Check if order can be cancelled
                if order.status not in ['pending', 'confirmed']:
                    return {
                        'success': False,
                        'error': 'Order cannot be cancelled in current status'
                    }
                
                # Update order status
                order.status = 'cancelled'
                order.save()
                
                # Restore product stock
                for item in order.items.all():
                    product = item.product
                    product.stock_quantity += item.quantity
                    if not product.is_available and product.stock_quantity > 0:
                        product.is_available = True
                    product.save()
                
                # Update payment status if payment was made
                if order.payment_status == 'paid':
                    # Initiate refund process
                    payment = order.payments.first()
                    if payment:
                        payment.payment_status = 'refunded'
                        payment.save()
                        order.payment_status = 'refunded'
                        order.save()
                
                return {
                    'success': True,
                    'message': 'Order cancelled successfully'
                }
                
        except AgriOrder.DoesNotExist:
            return {'success': False, 'error': 'Order not found'}
        except Exception as e:
            logger.error(f"Error cancelling order: {str(e)}")
            return {'success': False, 'error': 'Failed to cancel order'}
    
    @staticmethod
    def add_product_review(customer: User, product_id: str, rating: int, comment: str, title: str = '') -> dict:
        """Add product review with business rules"""
        try:
            # Check if customer has purchased the product
            has_purchased = AgriOrderItem.objects.filter(
                order__customer=customer,
                product_id=product_id,
                order__status='delivered'
            ).exists()
            
            if not has_purchased:
                return {
                    'success': False,
                    'error': 'You can only review products you have purchased'
                }
            
            # Check if customer already reviewed this product
            existing_review = AgriProductReview.objects.filter(
                product_id=product_id,
                user=customer
            ).first()
            
            if existing_review:
                return {
                    'success': False,
                    'error': 'You have already reviewed this product'
                }
            
            # Create review
            review = AgriProductReview.objects.create(
                product_id=product_id,
                user=customer,
                rating=rating,
                comment=comment,
                title=title,
                is_verified_purchase=has_purchased
            )
            
            # Update product rating
            product = review.product
            product.average_rating = product.reviews.aggregate(Avg('rating'))['rating__avg']
            product.review_count = product.reviews.count()
            product.save()
            
            return {
                'success': True,
                'review': review,
                'message': 'Review added successfully'
            }
            
        except Exception as e:
            logger.error(f"Error adding review: {str(e)}")
            return {'success': False, 'error': 'Failed to add review'}


class FarmerService:
    """Business logic for farmer users"""
    
    @staticmethod
    def create_product(farmer: User, product_data: dict) -> dict:
        """Create agricultural product with business rules"""
        try:
            # Validate farmer type
            if farmer.user_type != 'farmer':
                return {'success': False, 'error': 'Only farmers can create products'}
            
            # Validate required fields
            required_fields = ['name', 'description', 'price_per_unit', 'unit', 'available_quantity', 'harvest_date']
            for field in required_fields:
                if not product_data.get(field):
                    return {'success': False, 'error': f'{field} is required'}
            
            # Validate price
            if Decimal(str(product_data['price_per_unit'])) <= 0:
                return {'success': False, 'error': 'Price must be greater than zero'}
            
            # Validate quantity
            if int(product_data['available_quantity']) <= 0:
                return {'success': False, 'error': 'Available quantity must be greater than zero'}
            
            # Validate harvest date
            from datetime import date
            if product_data['harvest_date'] < date.today():
                return {'success': False, 'error': 'Harvest date cannot be in the past'}
            
            # Create product
            product = AgriProduct.objects.create(
                farmer=farmer,
                **product_data
            )
            
            return {
                'success': True,
                'product': product,
                'message': 'Product created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating product: {str(e)}")
            return {'success': False, 'error': 'Failed to create product'}
    
    @staticmethod
    def update_product_stock(farmer: User, product_id: str, new_quantity: int) -> dict:
        """Update product stock with business rules"""
        try:
            product = AgriProduct.objects.get(id=product_id, farmer=farmer)
            
            if new_quantity < 0:
                return {'success': False, 'error': 'Stock quantity cannot be negative'}
            
            # Update stock
            product.stock_quantity = new_quantity
            product.available_quantity = new_quantity
            
            # Update availability status
            if new_quantity == 0:
                product.is_available = False
            else:
                product.is_available = True
            
            product.save()
            
            return {
                'success': True,
                'product': product,
                'message': 'Stock updated successfully'
            }
            
        except AgriProduct.DoesNotExist:
            return {'success': False, 'error': 'Product not found'}
        except Exception as e:
            logger.error(f"Error updating stock: {str(e)}")
            return {'success': False, 'error': 'Failed to update stock'}
    
    @staticmethod
    def create_harvest_schedule(farmer: User, schedule_data: dict) -> dict:
        """Create harvest schedule with business rules"""
        try:
            # Validate farmer type
            if farmer.user_type != 'farmer':
                return {'success': False, 'error': 'Only farmers can create harvest schedules'}
            
            # Validate farm belongs to farmer
            farm = Farm.objects.get(id=schedule_data['farm'], farmer=farmer)
            
            # Validate harvest date
            from datetime import date
            if schedule_data['planned_harvest_date'] < date.today():
                return {'success': False, 'error': 'Harvest date cannot be in the past'}
            
            # Create schedule
            schedule = HarvestSchedule.objects.create(
                farmer=farmer,
                farm=farm,
                **schedule_data
            )
            
            return {
                'success': True,
                'schedule': schedule,
                'message': 'Harvest schedule created successfully'
            }
            
        except Farm.DoesNotExist:
            return {'success': False, 'error': 'Farm not found or does not belong to you'}
        except Exception as e:
            logger.error(f"Error creating harvest schedule: {str(e)}")
            return {'success': False, 'error': 'Failed to create harvest schedule'}
    
    @staticmethod
    def update_order_status(farmer: User, order_id: str, new_status: str) -> dict:
        """Update order status with business rules"""
        try:
            order = AgriOrder.objects.get(
                id=order_id,
                items__product__farmer=farmer
            )
            
            # Validate status transition
            valid_transitions = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['processing', 'cancelled'],
                'processing': ['shipped', 'cancelled'],
                'shipped': ['delivered', 'cancelled'],
                'delivered': [],  # Final state
                'cancelled': [],  # Final state
            }
            
            if new_status not in valid_transitions.get(order.status, []):
                return {
                    'success': False,
                    'error': f'Cannot transition from {order.status} to {new_status}'
                }
            
            # Update status
            order.status = new_status
            order.save()
            
            # If order is delivered, update payment status
            if new_status == 'delivered':
                order.payment_status = 'paid'
                order.delivered_at = timezone.now()
                order.save()
                
                # Update payment record
                payment = order.payments.first()
                if payment:
                    payment.payment_status = 'completed'
                    payment.completed_at = timezone.now()
                    payment.save()
            
            return {
                'success': True,
                'order': order,
                'message': f'Order status updated to {new_status}'
            }
            
        except AgriOrder.DoesNotExist:
            return {'success': False, 'error': 'Order not found'}
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            return {'success': False, 'error': 'Failed to update order status'}


class DeliveryAgentService:
    """Business logic for delivery agent users"""
    
    @staticmethod
    def accept_delivery_task(agent: User, task_id: str) -> dict:
        """Accept delivery task with business rules"""
        try:
            # Validate agent type
            if agent.user_type != 'delivery_agent':
                return {'success': False, 'error': 'Only delivery agents can accept tasks'}
            
            # Check if agent is available
            if not agent.is_available:
                return {'success': False, 'error': 'You are not available for new tasks'}
            
            # Get task
            task = DeliveryTask.objects.select_for_update().get(
                id=task_id, status='pending'
            )
            
            # Check if agent is within reasonable distance
            if agent.current_location and task.pickup_location:
                distance = agent.current_location.distance(task.pickup_location)
                if distance > D(km=20):  # 20km limit
                    return {
                        'success': False,
                        'error': 'Task is too far from your current location'
                    }
            
            # Accept task
            task.delivery_agent = agent
            task.status = 'assigned'
            task.assigned_at = timezone.now()
            task.save()
            
            # Update agent availability
            agent.is_available = False
            agent.save()
            
            return {
                'success': True,
                'task': task,
                'message': 'Task accepted successfully'
            }
            
        except DeliveryTask.DoesNotExist:
            return {'success': False, 'error': 'Task not found or already assigned'}
        except Exception as e:
            logger.error(f"Error accepting task: {str(e)}")
            return {'success': False, 'error': 'Failed to accept task'}
    
    @staticmethod
    def update_task_status(agent: User, task_id: str, new_status: str, notes: str = '') -> dict:
        """Update task status with business rules"""
        try:
            task = DeliveryTask.objects.get(
                id=task_id, delivery_agent=agent
            )
            
            # Validate status transition
            valid_transitions = {
                'assigned': ['in_progress'],
                'in_progress': ['completed', 'cancelled'],
                'completed': [],
                'cancelled': [],
            }
            
            if new_status not in valid_transitions.get(task.status, []):
                return {
                    'success': False,
                    'error': f'Cannot transition from {task.status} to {new_status}'
                }
            
            # Update status
            task.status = new_status
            
            if new_status == 'in_progress':
                task.started_at = timezone.now()
            elif new_status == 'completed':
                task.completed_at = timezone.now()
                # Update agent availability
                agent.is_available = True
                agent.total_deliveries += 1
                agent.save()
            
            if notes:
                task.notes = notes
            
            task.save()
            
            return {
                'success': True,
                'task': task,
                'message': f'Task status updated to {new_status}'
            }
            
        except DeliveryTask.DoesNotExist:
            return {'success': False, 'error': 'Task not found'}
        except Exception as e:
            logger.error(f"Error updating task status: {str(e)}")
            return {'success': False, 'error': 'Failed to update task status'}
    
    @staticmethod
    def update_location(agent: User, latitude: float, longitude: float) -> dict:
        """Update delivery agent location"""
        try:
            if agent.user_type != 'delivery_agent':
                return {'success': False, 'error': 'Only delivery agents can update location'}
            
            # Create point from coordinates
            point = Point(longitude, latitude, srid=4326)
            
            # Update agent location
            agent.current_location = point
            agent.save()
            
            return {
                'success': True,
                'message': 'Location updated successfully'
            }
            
        except Exception as e:
            logger.error(f"Error updating location: {str(e)}")
            return {'success': False, 'error': 'Failed to update location'}


class AdminService:
    """Business logic for admin users"""
    
    @staticmethod
    def verify_farmer(admin: User, farmer_id: str, verification_status: bool, notes: str = '') -> dict:
        """Verify farmer account with business rules"""
        try:
            # Validate admin permissions
            if not admin.is_staff:
                return {'success': False, 'error': 'Insufficient permissions'}
            
            farmer = User.objects.get(id=farmer_id, user_type='farmer')
            
            # Update verification status
            farmer.is_verified = verification_status
            farmer.save()
            
            # Log verification action
            logger.info(f"Farmer {farmer.username} verification status changed to {verification_status} by admin {admin.username}")
            
            return {
                'success': True,
                'farmer': farmer,
                'message': f'Farmer verification status updated to {verification_status}'
            }
            
        except User.DoesNotExist:
            return {'success': False, 'error': 'Farmer not found'}
        except Exception as e:
            logger.error(f"Error verifying farmer: {str(e)}")
            return {'success': False, 'error': 'Failed to verify farmer'}
    
    @staticmethod
    def manage_product_approval(admin: User, product_id: str, is_approved: bool, reason: str = '') -> dict:
        """Approve or reject product with business rules"""
        try:
            # Validate admin permissions
            if not admin.is_staff:
                return {'success': False, 'error': 'Insufficient permissions'}
            
            product = AgriProduct.objects.get(id=product_id)
            
            # Update approval status
            product.is_active = is_approved
            product.save()
            
            # Log approval action
            logger.info(f"Product {product.name} approval status changed to {is_approved} by admin {admin.username}")
            
            return {
                'success': True,
                'product': product,
                'message': f'Product approval status updated to {is_approved}'
            }
            
        except AgriProduct.DoesNotExist:
            return {'success': False, 'error': 'Product not found'}
        except Exception as e:
            logger.error(f"Error managing product approval: {str(e)}")
            return {'success': False, 'error': 'Failed to manage product approval'}


class AnalyticsService:
    """Business analytics and reporting service"""
    
    @staticmethod
    def get_farmer_dashboard_data(farmer: User) -> dict:
        """Get farmer dashboard analytics"""
        try:
            # Get farmer's products
            products = AgriProduct.objects.filter(farmer=farmer)
            
            # Get orders for farmer's products
            orders = AgriOrder.objects.filter(
                items__product__farmer=farmer
            ).distinct()
            
            # Calculate metrics
            total_products = products.count()
            active_products = products.filter(is_active=True).count()
            total_orders = orders.count()
            pending_orders = orders.filter(status='pending').count()
            completed_orders = orders.filter(status='delivered').count()
            
            # Calculate revenue
            total_revenue = orders.filter(
                status='delivered', payment_status='paid'
            ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
            # Get recent orders
            recent_orders = orders.order_by('-created_at')[:5]
            
            return {
                'success': True,
                'data': {
                    'total_products': total_products,
                    'active_products': active_products,
                    'total_orders': total_orders,
                    'pending_orders': pending_orders,
                    'completed_orders': completed_orders,
                    'total_revenue': total_revenue,
                    'recent_orders': recent_orders
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting farmer dashboard data: {str(e)}")
            return {'success': False, 'error': 'Failed to get dashboard data'}
    
    @staticmethod
    def get_customer_dashboard_data(customer: User) -> dict:
        """Get customer dashboard analytics"""
        try:
            # Get customer's orders
            orders = AgriOrder.objects.filter(customer=customer)
            
            # Calculate metrics
            total_orders = orders.count()
            pending_orders = orders.filter(status__in=['pending', 'confirmed', 'processing']).count()
            completed_orders = orders.filter(status='delivered').count()
            
            # Calculate total spent
            total_spent = orders.filter(
                status='delivered', payment_status='paid'
            ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
            # Get recent orders
            recent_orders = orders.order_by('-created_at')[:5]
            
            return {
                'success': True,
                'data': {
                    'total_orders': total_orders,
                    'pending_orders': pending_orders,
                    'completed_orders': completed_orders,
                    'total_spent': total_spent,
                    'recent_orders': recent_orders
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting customer dashboard data: {str(e)}")
            return {'success': False, 'error': 'Failed to get dashboard data'}
