"""
Workflow Management for AgriConnect App
Manages complete user journey flows and business processes
"""

from django.db import transaction
from django.utils import timezone
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from decimal import Decimal
import logging

from .models import (
    AgriProduct, AgriCart, AgriCartItem, AgriOrder, AgriOrderItem,
    AgriProductReview, Farm, HarvestSchedule
)
from users.models import User
from payments.models import Payment
from logistics.models import DeliveryTask
from .services import (
    CustomerService, FarmerService, DeliveryAgentService, AdminService
)

logger = logging.getLogger(__name__)


class CustomerWorkflow:
    """Complete customer journey workflow"""
    
    @staticmethod
    def complete_purchase_flow(customer: User, product_ids: list, quantities: list, 
                             delivery_address: str, payment_method: str, notes: str = '') -> dict:
        """
        Complete purchase flow: Add to cart -> Checkout -> Payment -> Order creation
        """
        try:
            with transaction.atomic():
                # Step 1: Add products to cart
                cart_items = []
                for product_id, quantity in zip(product_ids, quantities):
                    result = CustomerService.add_to_cart(customer, product_id, quantity)
                    if not result['success']:
                        return result
                    cart_items.append(result['cart'])
                
                # Step 2: Create order from cart
                result = CustomerService.create_order_from_cart(
                    customer, delivery_address, payment_method, notes
                )
                
                if not result['success']:
                    return result
                
                order = result['order']
                
                # Step 3: Process payment based on method
                if payment_method == 'cash':
                    # Cash on delivery - no immediate payment processing
                    payment_status = 'pending'
                elif payment_method == 'mobile_money':
                    # Mobile money - initiate payment
                    payment_status = 'processing'
                    # Here you would integrate with mobile money provider
                else:
                    # Other payment methods
                    payment_status = 'pending'
                
                # Step 4: Update payment status
                payment = order.payments.first()
                if payment:
                    payment.payment_status = payment_status
                    payment.save()
                
                # Step 5: Create delivery task if delivery fee > 0
                if order.delivery_fee > 0:
                    DeliveryTask.objects.create(
                        task_type='delivery',
                        status='pending',
                        customer=customer,
                        farmer=order.items.first().product.farmer,
                        pickup_location=order.items.first().product.farm_location,
                        delivery_location=Point(0, 0, srid=4326),  # Will be updated with actual delivery address
                        total_amount=order.total_amount,
                        notes=f"Order {order.order_number} delivery"
                    )
                
                return {
                    'success': True,
                    'order': order,
                    'message': 'Purchase completed successfully',
                    'next_steps': [
                        'Wait for farmer confirmation',
                        'Track order status',
                        'Prepare for delivery'
                    ]
                }
                
        except Exception as e:
            logger.error(f"Error in complete purchase flow: {str(e)}")
            return {'success': False, 'error': 'Failed to complete purchase'}
    
    @staticmethod
    def order_tracking_flow(customer: User, order_id: str) -> dict:
        """Complete order tracking workflow"""
        try:
            order = AgriOrder.objects.get(id=order_id, customer=customer)
            
            # Get delivery task if exists
            delivery_task = None
            if order.delivery_fee > 0:
                delivery_task = DeliveryTask.objects.filter(
                    customer=customer,
                    farmer=order.items.first().product.farmer
                ).first()
            
            # Calculate estimated delivery time
            estimated_delivery = None
            if order.status in ['confirmed', 'processing', 'shipped']:
                # Simple estimation: 2-3 days from order confirmation
                estimated_delivery = order.created_at + timezone.timedelta(days=3)
            
            # Get order timeline
            timeline = []
            timeline.append({
                'status': 'Order Placed',
                'timestamp': order.created_at,
                'description': f'Order {order.order_number} was placed'
            })
            
            if order.status in ['confirmed', 'processing', 'shipped', 'delivered']:
                timeline.append({
                    'status': 'Order Confirmed',
                    'timestamp': order.updated_at,
                    'description': 'Farmer confirmed your order'
                })
            
            if order.status in ['shipped', 'delivered']:
                timeline.append({
                    'status': 'Order Shipped',
                    'timestamp': order.updated_at,
                    'description': 'Your order is on its way'
                })
            
            if order.status == 'delivered':
                timeline.append({
                    'status': 'Order Delivered',
                    'timestamp': order.delivered_at,
                    'description': 'Order delivered successfully'
                })
            
            return {
                'success': True,
                'order': order,
                'delivery_task': delivery_task,
                'estimated_delivery': estimated_delivery,
                'timeline': timeline,
                'current_status': order.status,
                'next_action': CustomerWorkflow._get_next_action(order.status)
            }
            
        except AgriOrder.DoesNotExist:
            return {'success': False, 'error': 'Order not found'}
        except Exception as e:
            logger.error(f"Error in order tracking flow: {str(e)}")
            return {'success': False, 'error': 'Failed to track order'}
    
    @staticmethod
    def _get_next_action(order_status: str) -> str:
        """Get next action for customer based on order status"""
        actions = {
            'pending': 'Wait for farmer confirmation',
            'confirmed': 'Order confirmed, preparing for delivery',
            'processing': 'Order is being processed',
            'shipped': 'Order is on its way',
            'delivered': 'Order completed - leave a review',
            'cancelled': 'Order was cancelled',
        }
        return actions.get(order_status, 'Unknown status')


class FarmerWorkflow:
    """Complete farmer journey workflow"""
    
    @staticmethod
    def product_management_flow(farmer: User, action: str, product_data: dict = None, 
                               product_id: str = None) -> dict:
        """Complete product management workflow"""
        try:
            if action == 'create':
                return FarmerService.create_product(farmer, product_data)
            elif action == 'update_stock':
                return FarmerService.update_product_stock(
                    farmer, product_id, product_data['new_quantity']
                )
            elif action == 'deactivate':
                product = AgriProduct.objects.get(id=product_id, farmer=farmer)
                product.is_active = False
                product.save()
                return {'success': True, 'message': 'Product deactivated successfully'}
            else:
                return {'success': False, 'error': 'Invalid action'}
                
        except AgriProduct.DoesNotExist:
            return {'success': False, 'error': 'Product not found'}
        except Exception as e:
            logger.error(f"Error in product management flow: {str(e)}")
            return {'success': False, 'error': 'Failed to manage product'}
    
    @staticmethod
    def order_fulfillment_flow(farmer: User, order_id: str, action: str, notes: str = '') -> dict:
        """Complete order fulfillment workflow"""
        try:
            order = AgriOrder.objects.get(
                id=order_id,
                items__product__farmer=farmer
            )
            
            if action == 'confirm':
                # Confirm order
                result = FarmerService.update_order_status(farmer, order_id, 'confirmed')
                if result['success']:
                    # Send notification to customer
                    logger.info(f"Order {order.order_number} confirmed by farmer {farmer.username}")
                
                return result
                
            elif action == 'process':
                # Start processing order
                result = FarmerService.update_order_status(farmer, order_id, 'processing')
                if result['success']:
                    # Update inventory and prepare for shipping
                    for item in order.items.all():
                        product = item.product
                        if product.stock_quantity < item.quantity:
                            return {'success': False, 'error': f'Insufficient stock for {product.name}'}
                    
                    # Create delivery task
                    DeliveryTask.objects.create(
                        task_type='delivery',
                        status='pending',
                        customer=order.customer,
                        farmer=farmer,
                        pickup_location=order.items.first().product.farm_location,
                        delivery_location=Point(0, 0, srid=4326),  # Will be updated
                        total_amount=order.total_amount,
                        notes=f"Order {order.order_number} ready for delivery"
                    )
                
                return result
                
            elif action == 'ship':
                # Mark order as shipped
                result = FarmerService.update_order_status(farmer, order_id, 'shipped')
                if result['success']:
                    # Update delivery task
                    delivery_task = DeliveryTask.objects.filter(
                        customer=order.customer,
                        farmer=farmer
                    ).first()
                    if delivery_task:
                        delivery_task.status = 'in_progress'
                        delivery_task.save()
                
                return result
                
            elif action == 'deliver':
                # Mark order as delivered
                result = FarmerService.update_order_status(farmer, order_id, 'delivered')
                if result['success']:
                    # Complete delivery task
                    delivery_task = DeliveryTask.objects.filter(
                        customer=order.customer,
                        farmer=farmer
                    ).first()
                    if delivery_task:
                        delivery_task.status = 'completed'
                        delivery_task.completed_at = timezone.now()
                        delivery_task.save()
                
                return result
                
            else:
                return {'success': False, 'error': 'Invalid action'}
                
        except AgriOrder.DoesNotExist:
            return {'success': False, 'error': 'Order not found'}
        except Exception as e:
            logger.error(f"Error in order fulfillment flow: {str(e)}")
            return {'success': False, 'error': 'Failed to fulfill order'}
    
    @staticmethod
    def harvest_planning_flow(farmer: User, action: str, schedule_data: dict = None, 
                             schedule_id: str = None) -> dict:
        """Complete harvest planning workflow"""
        try:
            if action == 'create':
                return FarmerService.create_harvest_schedule(farmer, schedule_data)
            elif action == 'update':
                schedule = HarvestSchedule.objects.get(id=schedule_id, farmer=farmer)
                for key, value in schedule_data.items():
                    setattr(schedule, key, value)
                schedule.save()
                return {'success': True, 'message': 'Schedule updated successfully'}
            elif action == 'complete':
                schedule = HarvestSchedule.objects.get(id=schedule_id, farmer=farmer)
                schedule.is_completed = True
                schedule.actual_harvest_date = timezone.now().date()
                schedule.save()
                return {'success': True, 'message': 'Harvest marked as completed'}
            else:
                return {'success': False, 'error': 'Invalid action'}
                
        except HarvestSchedule.DoesNotExist:
            return {'success': False, 'error': 'Schedule not found'}
        except Exception as e:
            logger.error(f"Error in harvest planning flow: {str(e)}")
            return {'success': False, 'error': 'Failed to manage harvest schedule'}


class DeliveryAgentWorkflow:
    """Complete delivery agent journey workflow"""
    
    @staticmethod
    def task_management_flow(agent: User, action: str, task_id: str = None, 
                           location_data: dict = None, notes: str = '') -> dict:
        """Complete task management workflow"""
        try:
            if action == 'accept_task':
                return DeliveryAgentService.accept_delivery_task(agent, task_id)
            elif action == 'start_task':
                return DeliveryAgentService.update_task_status(agent, task_id, 'in_progress', notes)
            elif action == 'complete_task':
                return DeliveryAgentService.update_task_status(agent, task_id, 'completed', notes)
            elif action == 'update_location':
                return DeliveryAgentService.update_location(
                    agent, location_data['latitude'], location_data['longitude']
                )
            elif action == 'get_available_tasks':
                # Get available tasks within reasonable distance
                if not agent.current_location:
                    return {'success': False, 'error': 'Please update your location first'}
                
                available_tasks = DeliveryTask.objects.filter(
                    status='pending'
                ).annotate(
                    distance=agent.current_location.distance('pickup_location')
                ).filter(
                    distance__lte=D(km=20)
                ).order_by('distance')[:10]
                
                return {
                    'success': True,
                    'available_tasks': available_tasks
                }
            else:
                return {'success': False, 'error': 'Invalid action'}
                
        except Exception as e:
            logger.error(f"Error in task management flow: {str(e)}")
            return {'success': False, 'error': 'Failed to manage task'}


class AdminWorkflow:
    """Complete admin management workflow"""
    
    @staticmethod
    def user_management_flow(admin: User, action: str, user_id: str = None, 
                           verification_data: dict = None) -> dict:
        """Complete user management workflow"""
        try:
            if not admin.is_staff:
                return {'success': False, 'error': 'Insufficient permissions'}
            
            if action == 'verify_farmer':
                return AdminService.verify_farmer(
                    admin, user_id, verification_data['status'], verification_data.get('notes', '')
                )
            elif action == 'suspend_user':
                user = User.objects.get(id=user_id)
                user.is_active = False
                user.save()
                return {'success': True, 'message': 'User suspended successfully'}
            elif action == 'activate_user':
                user = User.objects.get(id=user_id)
                user.is_active = True
                user.save()
                return {'success': True, 'message': 'User activated successfully'}
            else:
                return {'success': False, 'error': 'Invalid action'}
                
        except User.DoesNotExist:
            return {'success': False, 'error': 'User not found'}
        except Exception as e:
            logger.error(f"Error in user management flow: {str(e)}")
            return {'success': False, 'error': 'Failed to manage user'}
    
    @staticmethod
    def content_moderation_flow(admin: User, action: str, content_type: str, 
                               content_id: str, moderation_data: dict = None) -> dict:
        """Complete content moderation workflow"""
        try:
            if not admin.is_staff:
                return {'success': False, 'error': 'Insufficient permissions'}
            
            if content_type == 'product':
                return AdminService.manage_product_approval(
                    admin, content_id, moderation_data['is_approved'], moderation_data.get('reason', '')
                )
            elif content_type == 'review':
                review = AgriProductReview.objects.get(id=content_id)
                review.is_approved = moderation_data['is_approved']
                review.save()
                return {'success': True, 'message': 'Review moderation updated'}
            else:
                return {'success': False, 'error': 'Invalid content type'}
                
        except Exception as e:
            logger.error(f"Error in content moderation flow: {str(e)}")
            return {'success': False, 'error': 'Failed to moderate content'}


class SystemWorkflow:
    """System-level workflows and automation"""
    
    @staticmethod
    def automated_stock_management() -> dict:
        """Automated stock management workflow"""
        try:
            # Find products with low stock
            low_stock_products = AgriProduct.objects.filter(
                stock_quantity__lte=10,
                is_active=True,
                is_available=True
            )
            
            # Find products that need restocking
            needs_restock = AgriProduct.objects.filter(
                stock_quantity=0,
                is_active=True,
                is_available=False
            )
            
            # Update product availability
            for product in low_stock_products:
                if product.stock_quantity == 0:
                    product.is_available = False
                    product.save()
            
            return {
                'success': True,
                'low_stock_count': low_stock_products.count(),
                'needs_restock_count': needs_restock.count(),
                'message': 'Stock management completed'
            }
            
        except Exception as e:
            logger.error(f"Error in automated stock management: {str(e)}")
            return {'success': False, 'error': 'Failed to manage stock'}
    
    @staticmethod
    def order_status_automation() -> dict:
        """Automated order status updates"""
        try:
            # Find orders that need status updates
            pending_orders = AgriOrder.objects.filter(
                status='pending',
                created_at__lte=timezone.now() - timezone.timedelta(hours=24)
            )
            
            # Auto-cancel orders that haven't been confirmed within 24 hours
            for order in pending_orders:
                order.status = 'cancelled'
                order.save()
                
                # Restore product stock
                for item in order.items.all():
                    product = item.product
                    product.stock_quantity += item.quantity
                    if not product.is_available and product.stock_quantity > 0:
                        product.is_available = True
                    product.save()
            
            return {
                'success': True,
                'auto_cancelled_count': pending_orders.count(),
                'message': 'Order automation completed'
            }
            
        except Exception as e:
            logger.error(f"Error in order status automation: {str(e)}")
            return {'success': False, 'error': 'Failed to automate orders'}
    
    @staticmethod
    def delivery_optimization() -> dict:
        """Optimize delivery routes and assignments"""
        try:
            # Find pending delivery tasks
            pending_tasks = DeliveryTask.objects.filter(status='pending')
            
            # Find available delivery agents
            available_agents = User.objects.filter(
                user_type='delivery_agent',
                is_available=True
            )
            
            # Simple assignment logic (can be enhanced with more sophisticated algorithms)
            for task in pending_tasks:
                if available_agents.exists():
                    # Find closest available agent
                    closest_agent = None
                    min_distance = float('inf')
                    
                    for agent in available_agents:
                        if agent.current_location and task.pickup_location:
                            distance = agent.current_location.distance(task.pickup_location)
                            if distance < min_distance:
                                min_distance = distance
                                closest_agent = agent
                    
                    if closest_agent and min_distance <= D(km=20):
                        # Assign task to closest agent
                        task.delivery_agent = closest_agent
                        task.status = 'assigned'
                        task.assigned_at = timezone.now()
                        task.save()
                        
                        # Update agent availability
                        closest_agent.is_available = False
                        closest_agent.save()
            
            return {
                'success': True,
                'assigned_tasks': pending_tasks.filter(status='assigned').count(),
                'message': 'Delivery optimization completed'
            }
            
        except Exception as e:
            logger.error(f"Error in delivery optimization: {str(e)}")
            return {'success': False, 'error': 'Failed to optimize delivery'}
