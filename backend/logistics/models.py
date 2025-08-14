from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.utils import timezone
from users.models import User

from agri_connect.models import AgriOrder
import uuid


class DeliveryTask(models.Model):
    """Delivery task model"""
    TASK_TYPES = [
        ('pickup', 'Pickup'),
        ('delivery', 'Delivery'),
        ('both', 'Pickup & Delivery'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='delivery_tasks')
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farmer_tasks')
    delivery_agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agent_tasks', null=True, blank=True)
    
    # Task details
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium')
    
    # Location details
    pickup_location = gis_models.PointField()
    pickup_address = models.TextField()
    pickup_contact = models.CharField(max_length=15)
    pickup_landmark = models.CharField(max_length=200, blank=True)
    
    delivery_location = gis_models.PointField()
    delivery_address = models.TextField()
    delivery_contact = models.CharField(max_length=15)
    delivery_landmark = models.CharField(max_length=200, blank=True)
    
    # Real-time tracking fields
    last_known_point = gis_models.PointField(null=True, blank=True, help_text="Last known location of delivery agent")
    bearing = models.FloatField(null=True, blank=True, help_text="Direction in degrees (0-360)")
    speed_kmh = models.FloatField(null=True, blank=True, help_text="Current speed in km/h")
    
    # Task number
    task_number = models.CharField(max_length=20, unique=True, blank=True)
    
    # Order references
    agri_order = models.ForeignKey('agri_connect.AgriOrder', on_delete=models.CASCADE, null=True, blank=True)
    
    # Financial details
    base_fare = models.DecimalField(max_digits=10, decimal_places=2)
    distance_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    time_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'delivery_tasks'
        verbose_name = 'Delivery Task'
        verbose_name_plural = 'Delivery Tasks'
        ordering = ['-created_at']
    
    def __str__(self):
        task_num = self.task_number or str(self.id)[:8]
        return f"Task {task_num} - {self.get_task_type_display()}"
    
    def save(self, *args, **kwargs):
        if not self.task_number:
            self.task_number = self.generate_task_number()
        super().save(*args, **kwargs)
    
    def generate_task_number(self):
        """Generate unique task number"""
        import random
        import string
        while True:
            task_number = f"DT{timezone.now().strftime('%Y%m%d')}{''.join(random.choices(string.digits, k=6))}"
            if not DeliveryTask.objects.filter(task_number=task_number).exists():
                return task_number
    
    @property
    def order(self):
        """Get the associated order"""
        return self.agri_order
    
    @property
    def customer(self):
        """Get the customer from the order"""
        if self.order:
            return self.order.customer
        return None
    
    @property
    def farmer(self):
        """Get the farmer from the order"""
        if self.agri_order and self.agri_order.items.exists():
            return self.agri_order.items.first().product.farmer
        return None
    
    @property
    def distance(self):
        """Calculate distance between pickup and delivery locations"""
        if self.pickup_location and self.delivery_location:
            from django.contrib.gis.measure import D
            return self.pickup_location.distance(self.delivery_location) * 100  # Convert to km
        return 0


class DeliveryAgentLocation(models.Model):
    """Track delivery agent locations"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery_agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='location_history')
    location = gis_models.PointField()
    accuracy = models.FloatField(null=True, blank=True)  # GPS accuracy in meters
    speed = models.FloatField(null=True, blank=True)  # Speed in km/h
    battery_level = models.PositiveIntegerField(null=True, blank=True)  # Battery percentage
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_agent_locations'
        verbose_name = 'Delivery Agent Location'
        verbose_name_plural = 'Delivery Agent Locations'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.delivery_agent.get_full_name()} - {self.timestamp}"


class DeliveryRoute(models.Model):
    """Delivery routes and navigation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery_task = models.ForeignKey(DeliveryTask, on_delete=models.CASCADE, related_name='routes')
    route_data = models.JSONField()  # Store route from mapping API
    distance = models.FloatField()  # Total distance in km
    duration = models.IntegerField()  # Estimated duration in minutes
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_routes'
        verbose_name = 'Delivery Route'
        verbose_name_plural = 'Delivery Routes'
    
    def __str__(self):
        task_num = self.delivery_task.task_number or str(self.delivery_task.id)[:8]
        return f"Route for Task {task_num}"


class DeliveryZone(models.Model):
    """Define delivery zones"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    boundary = gis_models.PolygonField()
    center = gis_models.PointField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_zones'
        verbose_name = 'Delivery Zone'
        verbose_name_plural = 'Delivery Zones'
    
    def __str__(self):
        return self.name


class DeliveryAgentEarnings(models.Model):
    """Track delivery agent earnings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery_agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earnings')
    delivery_task = models.ForeignKey(DeliveryTask, on_delete=models.CASCADE, related_name='earnings')
    
    # Earnings breakdown
    base_rate = models.DecimalField(max_digits=10, decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment status
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_agent_earnings'
        verbose_name = 'Delivery Agent Earning'
        verbose_name_plural = 'Delivery Agent Earnings'
    
    def __str__(self):
        return f"{self.delivery_agent.get_full_name()} - {self.total_earnings} CFA"


class DeliveryAgentRating(models.Model):
    """Delivery agent ratings from customers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery_agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='delivery_ratings')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_delivery_ratings')
    delivery_task = models.ForeignKey(DeliveryTask, on_delete=models.CASCADE, related_name='ratings')
    
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    is_approved = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'delivery_agent_ratings'
        verbose_name = 'Delivery Agent Rating'
        verbose_name_plural = 'Delivery Agent Ratings'
        unique_together = ['delivery_agent', 'delivery_task']
    
    def __str__(self):
        return f"{self.delivery_agent.get_full_name()} - {self.rating} stars"


class DeliverySchedule(models.Model):
    """Delivery schedules for optimization"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    delivery_agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedules')
    date = models.DateField()
    
    # Schedule details
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    
    # Capacity
    max_deliveries = models.PositiveIntegerField(default=10)
    current_deliveries = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'delivery_schedules'
        verbose_name = 'Delivery Schedule'
        verbose_name_plural = 'Delivery Schedules'
        unique_together = ['delivery_agent', 'date']
    
    def __str__(self):
        return f"{self.delivery_agent.get_full_name()} - {self.date}"
    
    @property
    def available_slots(self):
        return self.max_deliveries - self.current_deliveries 