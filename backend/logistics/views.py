from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.db.models import Q, Sum, Count, Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    DeliveryTask, DeliveryAgentLocation, DeliveryRoute, DeliveryZone,
    DeliveryAgentEarnings, DeliveryAgentRating, DeliverySchedule
)
from .serializers import (
    DeliveryTaskSerializer, DeliveryTaskDetailSerializer,
    DeliveryAgentLocationSerializer, DeliveryRouteSerializer,
    DeliveryZoneSerializer, DeliveryAgentEarningsSerializer,
    DeliveryAgentRatingSerializer, DeliveryScheduleSerializer,
    UpdateLocationSerializer, AcceptTaskSerializer,
    UpdateTaskStatusSerializer, CompleteTaskSerializer, LocationUpdateSerializer
)


class DeliveryAgentRateThrottle(UserRateThrottle):
    """Rate limit for delivery agent location updates: 1 request per 3 seconds"""
    rate = '1/3s'


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@throttle_classes([DeliveryAgentRateThrottle])
def update_delivery_location(request):
    """Update delivery agent's real-time location for active tasks"""
    try:
        # Validate user is delivery agent
        if request.user.user_type != 'delivery_agent':
            return Response(
                {'error': 'Only delivery agents can update location'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate serializer
        serializer = LocationUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Create Point object
        location_point = Point(data['lon'], data['lat'])
        
        # Update user's current location
        request.user.current_location = location_point
        request.user.save()
        
        # Create location history record
        DeliveryAgentLocation.objects.create(
            delivery_agent=request.user,
            location=location_point,
            accuracy=data.get('accuracy'),
            speed=data.get('speed'),
            battery_level=data.get('battery_level')
        )
        
        # Update active delivery tasks with real-time tracking data
        active_tasks = DeliveryTask.objects.filter(
            delivery_agent=request.user,
            status__in=['assigned', 'in_progress']
        )
        
        for task in active_tasks:
            task.last_known_point = location_point
            task.bearing = data.get('bearing')
            task.speed_kmh = data.get('speed')
            task.save()
        
        return Response({
            'message': 'Location updated successfully',
            'active_tasks_updated': active_tasks.count()
        })
        
    except Exception as e:
        return Response(
            {'error': f'Location update failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class DeliveryTaskListView(generics.ListAPIView):
    """List delivery tasks with filtering"""
    serializer_class = DeliveryTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'task_type', 'delivery_agent']
    ordering_fields = ['created_at', 'assigned_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'delivery_agent':
            return DeliveryTask.objects.filter(delivery_agent=user).select_related(
                'customer', 'merchant', 'delivery_agent'
            )
        elif user.user_type in ['merchant', 'farmer']:
            return DeliveryTask.objects.filter(merchant=user).select_related(
                'customer', 'merchant', 'delivery_agent'
            )
        else:  # customer
            return DeliveryTask.objects.filter(customer=user).select_related(
                'customer', 'merchant', 'delivery_agent'
            )


class DeliveryTaskDetailView(generics.RetrieveAPIView):
    """Get detailed delivery task information"""
    serializer_class = DeliveryTaskDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'delivery_agent':
            return DeliveryTask.objects.filter(delivery_agent=user).select_related(
                'customer', 'merchant', 'delivery_agent', 'route'
            )
        elif user.user_type in ['merchant', 'farmer']:
            return DeliveryTask.objects.filter(merchant=user).select_related(
                'customer', 'merchant', 'delivery_agent', 'route'
            )
        else:  # customer
            return DeliveryTask.objects.filter(customer=user).select_related(
                'customer', 'merchant', 'delivery_agent', 'route'
            )


class AvailableTasksListView(generics.ListAPIView):
    """List available delivery tasks for agents"""
    serializer_class = DeliveryTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['task_type']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.user.user_type != 'delivery_agent':
            return DeliveryTask.objects.none()
        
        # Get available tasks (not assigned to any agent)
        queryset = DeliveryTask.objects.filter(
            status='pending',
            delivery_agent__isnull=True
        ).select_related('customer', 'merchant')
        
        # Filter by distance from agent's current location
        agent_location = self.request.user.current_location
        if agent_location:
            queryset = queryset.annotate(
                distance=Distance('pickup_location', agent_location)
            ).filter(distance__lte=D(km=10)).order_by('distance')
        
        return queryset


class CurrentTasksListView(generics.ListAPIView):
    """List current delivery tasks for agents"""
    serializer_class = DeliveryTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['assigned_at', 'created_at']
    ordering = ['-assigned_at']
    
    def get_queryset(self):
        if self.request.user.user_type != 'delivery_agent':
            return DeliveryTask.objects.none()
        
        return DeliveryTask.objects.filter(
            delivery_agent=self.request.user,
            status__in=['assigned', 'in_progress']
        ).select_related('customer', 'merchant')


class CompletedTasksListView(generics.ListAPIView):
    """List completed delivery tasks for agents"""
    serializer_class = DeliveryTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['task_type']
    ordering_fields = ['completed_at', 'total_amount']
    ordering = ['-completed_at']
    
    def get_queryset(self):
        if self.request.user.user_type != 'delivery_agent':
            return DeliveryTask.objects.none()
        
        return DeliveryTask.objects.filter(
            delivery_agent=self.request.user,
            status='completed'
        ).select_related('customer', 'merchant')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_task(request):
    """Accept a delivery task"""
    try:
        task_id = request.data.get('task_id')
        task = get_object_or_404(DeliveryTask, id=task_id, status='pending')
        
        if request.user.user_type != 'delivery_agent':
            return Response({'error': 'Only delivery agents can accept tasks'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if task.delivery_agent:
            return Response({'error': 'Task already assigned'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        task.delivery_agent = request.user
        task.status = 'assigned'
        task.assigned_at = timezone.now()
        task.save()
        
        return Response({'message': 'Task accepted successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_task_status(request, task_id):
    """Update delivery task status"""
    try:
        task = get_object_or_404(DeliveryTask, id=task_id)
        new_status = request.data.get('status')
        
        if request.user.user_type != 'delivery_agent':
            return Response({'error': 'Only delivery agents can update task status'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if task.delivery_agent != request.user:
            return Response({'error': 'You can only update your own tasks'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if new_status not in ['in_progress', 'completed', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        task.status = new_status
        if new_status == 'in_progress':
            task.started_at = timezone.now()
        elif new_status == 'completed':
            task.completed_at = timezone.now()
        task.save()
        
        return Response({'message': f'Task status updated to {new_status}'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_task(request, task_id):
    """Complete a delivery task"""
    try:
        task = get_object_or_404(DeliveryTask, id=task_id)
        
        if request.user.user_type != 'delivery_agent':
            return Response({'error': 'Only delivery agents can complete tasks'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if task.delivery_agent != request.user:
            return Response({'error': 'You can only complete your own tasks'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if task.status != 'in_progress':
            return Response({'error': 'Task must be in progress to complete'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Update task status
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        
        # Update delivery agent stats
        agent = request.user
        agent.total_deliveries += 1
        agent.total_earnings += task.total_amount
        agent.save()
        
        # Create earnings record
        DeliveryAgentEarnings.objects.create(
            delivery_agent=agent,
            task=task,
            amount=task.total_amount,
            payment_status='pending'
        )
        
        return Response({
            'message': 'Task completed successfully',
            'earnings': task.total_amount
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DeliveryAgentEarningsListView(generics.ListAPIView):
    """List delivery agent earnings"""
    serializer_class = DeliveryAgentEarningsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['payment_status']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.user.user_type != 'delivery_agent':
            return DeliveryAgentEarnings.objects.none()
        return DeliveryAgentEarnings.objects.filter(delivery_agent=self.request.user)


class DeliveryAgentRatingListView(generics.ListAPIView):
    """List delivery agent ratings"""
    serializer_class = DeliveryAgentRatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['rating']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.request.user.user_type != 'delivery_agent':
            return DeliveryAgentRating.objects.none()
        return DeliveryAgentRating.objects.filter(delivery_agent=self.request.user)


class DeliveryScheduleListView(generics.ListCreateAPIView):
    """List and create delivery schedules"""
    serializer_class = DeliveryScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['day_of_week', 'is_active']
    ordering_fields = ['day_of_week', 'start_time']
    ordering = ['day_of_week', 'start_time']
    
    def get_queryset(self):
        return DeliverySchedule.objects.filter(delivery_agent=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(delivery_agent=self.request.user)


class DeliveryScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage individual delivery schedules"""
    serializer_class = DeliveryScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return DeliverySchedule.objects.filter(delivery_agent=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def agent_dashboard_stats(request):
    """Get delivery agent dashboard statistics"""
    if request.user.user_type != 'delivery_agent':
        return Response({'error': 'Only delivery agents can access dashboard'}, 
                      status=status.HTTP_403_FORBIDDEN)
    
    # Get today's stats
    today = timezone.now().date()
    today_tasks = DeliveryTask.objects.filter(
        delivery_agent=request.user,
        created_at__date=today
    )
    
    # Get this week's stats
    week_start = today - timezone.timedelta(days=today.weekday())
    week_tasks = DeliveryTask.objects.filter(
        delivery_agent=request.user,
        created_at__date__gte=week_start
    )
    
    stats = {
        'today_tasks': today_tasks.count(),
        'today_earnings': today_tasks.aggregate(total=Sum('total_amount'))['total'] or 0,
        'week_tasks': week_tasks.count(),
        'week_earnings': week_tasks.aggregate(total=Sum('total_amount'))['total'] or 0,
        'total_deliveries': request.user.total_deliveries,
        'total_earnings': request.user.total_earnings,
        'rating': request.user.rating,
        'is_available': request.user.is_available,
    }
    
    return Response(stats) 