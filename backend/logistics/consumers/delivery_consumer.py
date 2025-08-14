import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..models import DeliveryTask

logger = logging.getLogger(__name__)
User = get_user_model()


class DeliveryConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time delivery tracking"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.order_id = self.scope['url_route']['kwargs']['order_id']
        self.room_group_name = f'order_{self.order_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        
        logger.info(f"WebSocket connected for order {self.order_id}")
        
        # Send initial order status
        await self.send_order_status()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        logger.info(f"WebSocket disconnected for order {self.order_id}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'location_update':
                # Handle location update from delivery agent
                await self.handle_location_update(text_data_json)
            elif message_type == 'status_update':
                # Handle status update
                await self.handle_status_update(text_data_json)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    async def handle_location_update(self, data):
        """Handle real-time location updates"""
        try:
            # Update delivery task with new location
            await self.update_delivery_location(data)
            
            # Broadcast location update to all connected clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'delivery_location_update',
                    'lat': data.get('lat'),
                    'lon': data.get('lon'),
                    'bearing': data.get('bearing'),
                    'speed': data.get('speed'),
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Error handling location update: {e}")
    
    async def handle_status_update(self, data):
        """Handle delivery status updates"""
        try:
            # Broadcast status update to all connected clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'delivery_status_update',
                    'status': data.get('status'),
                    'message': data.get('message'),
                    'timestamp': timezone.now().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Error handling status update: {e}")
    
    @database_sync_to_async
    def update_delivery_location(self, data):
        """Update delivery task location in database"""
        try:
            task = DeliveryTask.objects.get(
                agri_order__id=self.order_id,
                status__in=['assigned', 'in_progress']
            )
            
            # Update task with new location data
            if 'lat' in data and 'lon' in data:
                from django.contrib.gis.geos import Point
                task.last_known_point = Point(data['lon'], data['lat'])
            
            if 'bearing' in data:
                task.bearing = data['bearing']
            
            if 'speed' in data:
                task.speed_kmh = data['speed']
            
            task.save()
            
        except DeliveryTask.DoesNotExist:
            logger.warning(f"No active delivery task found for order {self.order_id}")
        except Exception as e:
            logger.error(f"Error updating delivery location: {e}")
    
    async def send_order_status(self):
        """Send initial order status to connected client"""
        try:
            order_status = await self.get_order_status()
            await self.send(text_data=json.dumps({
                'type': 'order_status',
                'data': order_status
            }))
        except Exception as e:
            logger.error(f"Error sending order status: {e}")
    
    @database_sync_to_async
    def get_order_status(self):
        """Get current order status from database"""
        try:
            from agri_connect.models import AgriOrder
            order = AgriOrder.objects.get(id=self.order_id)
            
            # Get active delivery task if exists
            delivery_task = None
            try:
                delivery_task = DeliveryTask.objects.get(
                    agri_order=order,
                    status__in=['assigned', 'in_progress']
                )
            except DeliveryTask.DoesNotExist:
                pass
            
            return {
                'order_id': str(order.id),
                'status': order.status,
                'delivery_status': delivery_task.status if delivery_task else None,
                'delivery_agent': delivery_task.delivery_agent.get_full_name() if delivery_task and delivery_task.delivery_agent else None,
                'last_known_location': {
                    'lat': delivery_task.last_known_point.y if delivery_task and delivery_task.last_known_point else None,
                    'lon': delivery_task.last_known_point.x if delivery_task and delivery_task.last_known_point else None,
                } if delivery_task and delivery_task.last_known_point else None,
                'bearing': delivery_task.bearing if delivery_task else None,
                'speed': delivery_task.speed_kmh if delivery_task else None,
            }
            
        except AgriOrder.DoesNotExist:
            return {'error': 'Order not found'}
        except Exception as e:
            logger.error(f"Error getting order status: {e}")
            return {'error': 'Error retrieving order status'}
    
    # Channel layer message handlers
    
    async def delivery_location_update(self, event):
        """Send delivery location update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'location_update',
            'lat': event['lat'],
            'lon': event['lon'],
            'bearing': event['bearing'],
            'speed': event['speed'],
            'timestamp': event['timestamp']
        }))
    
    async def delivery_status_update(self, event):
        """Send delivery status update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'status': event['status'],
            'message': event['message'],
            'timestamp': event['timestamp']
        }))
    
    async def eta_update(self, event):
        """Send ETA update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'eta_update',
            'eta_minutes': event['eta_minutes'],
            'distance_km': event['distance_km'],
            'timestamp': event['timestamp']
        }))
