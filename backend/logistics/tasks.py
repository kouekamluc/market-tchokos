import logging
import requests
from celery import shared_task
from django.utils import timezone
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import DeliveryTask

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()


@shared_task
def calculate_eta_for_active_deliveries():
    """Calculate ETA for all active delivery tasks every 30 seconds"""
    try:
        active_tasks = DeliveryTask.objects.filter(
            status__in=['assigned', 'in_progress'],
            last_known_point__isnull=False
        ).select_related('agri_order')
        
        for task in active_tasks:
            try:
                eta_data = calculate_task_eta(task)
                if eta_data:
                    # Send ETA update via WebSocket
                    send_eta_update_to_websocket(task.agri_order.id, eta_data)
                    
            except Exception as e:
                logger.error(f"Error calculating ETA for task {task.id}: {e}")
                
    except Exception as e:
        logger.error(f"Error in ETA calculation task: {e}")


def calculate_task_eta(task):
    """Calculate ETA for a specific delivery task using OSRM"""
    try:
        if not task.last_known_point or not task.delivery_location:
            return None
        
        # Get current location and destination
        current_lat = task.last_known_point.y
        current_lon = task.last_known_point.x
        dest_lat = task.delivery_location.y
        dest_lon = task.delivery_location.x
        
        # Calculate distance using GeoDjango
        distance_km = task.last_known_point.distance(task.delivery_location) * 100
        
        # Use OSRM for route calculation and ETA
        eta_minutes = calculate_osrm_eta(
            current_lat, current_lon, dest_lat, dest_lon
        )
        
        if eta_minutes is not None:
            return {
                'eta_minutes': eta_minutes,
                'distance_km': round(distance_km, 2),
                'current_speed': task.speed_kmh or 0,
                'timestamp': timezone.now().isoformat()
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Error calculating ETA for task {task.id}: {e}")
        return None


def calculate_osrm_eta(current_lat, current_lon, dest_lat, dest_lon):
    """Calculate ETA using OSRM (Open Source Routing Machine)"""
    try:
        # OSRM API endpoint (using public demo server for now)
        # In production, you'd use your own OSRM instance
        osrm_url = "https://router.project-osrm.org/route/v1/driving"
        
        coordinates = f"{current_lon},{current_lat};{dest_lon},{dest_lat}"
        url = f"{osrm_url}/{coordinates}"
        
        params = {
            'overview': 'false',  # We don't need the full route, just duration
            'annotations': 'false'
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('code') == 'Ok' and data.get('routes'):
            # Duration is in seconds, convert to minutes
            duration_seconds = data['routes'][0]['duration']
            return round(duration_seconds / 60, 1)
        
        return None
        
    except requests.RequestException as e:
        logger.warning(f"OSRM API request failed: {e}")
        # Fallback to simple distance-based calculation
        return calculate_fallback_eta(current_lat, current_lat, dest_lat, dest_lon)
    except Exception as e:
        logger.error(f"Error calculating OSRM ETA: {e}")
        return None


def calculate_fallback_eta(current_lat, current_lon, dest_lat, dest_lon):
    """Fallback ETA calculation when OSRM is unavailable"""
    try:
        from math import radians, cos, sin, sqrt, atan2
        
        # Haversine formula for distance calculation
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1 = radians(current_lat), radians(current_lon)
        lat2, lon2 = radians(dest_lat), radians(dest_lon)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        # Assume average speed of 30 km/h for fallback calculation
        avg_speed_kmh = 30
        eta_hours = distance / avg_speed_kmh
        eta_minutes = eta_hours * 60
        
        return round(eta_minutes, 1)
        
    except Exception as e:
        logger.error(f"Error in fallback ETA calculation: {e}")
        return None


def send_eta_update_to_websocket(order_id, eta_data):
    """Send ETA update to WebSocket clients"""
    try:
        async_to_sync(channel_layer.group_send)(
            f'order_{order_id}',
            {
                'type': 'eta_update',
                'eta_minutes': eta_data['eta_minutes'],
                'distance_km': eta_data['distance_km'],
                'current_speed': eta_data['current_speed'],
                'timestamp': eta_data['timestamp']
            }
        )
    except Exception as e:
        logger.error(f"Error sending ETA update to WebSocket: {e}")


@shared_task
def cleanup_old_location_records():
    """Clean up old delivery agent location records (older than 30 days)"""
    try:
        cutoff_date = timezone.now() - timezone.timedelta(days=30)
        deleted_count = DeliveryTask.objects.filter(
            created_at__lt=cutoff_date,
            status='completed'
        ).count()
        
        # Log cleanup operation
        logger.info(f"Cleaned up {deleted_count} old completed delivery tasks")
        
    except Exception as e:
        logger.error(f"Error in location cleanup task: {e}")


@shared_task
def update_delivery_task_status():
    """Update delivery task statuses based on business rules"""
    try:
        # Auto-complete tasks that have been in progress for too long
        # This is a safety mechanism to prevent stuck tasks
        cutoff_time = timezone.now() - timezone.timedelta(hours=24)
        
        stuck_tasks = DeliveryTask.objects.filter(
            status='in_progress',
            started_at__lt=cutoff_time
        )
        
        for task in stuck_tasks:
            task.status = 'completed'
            task.completed_at = timezone.now()
            task.save()
            
            logger.info(f"Auto-completed stuck delivery task {task.id}")
            
    except Exception as e:
        logger.error(f"Error in delivery task status update: {e}")
