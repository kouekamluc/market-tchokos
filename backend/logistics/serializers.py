from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import (
    DeliveryTask, DeliveryAgentLocation, DeliveryRoute, DeliveryZone,
    DeliveryAgentEarnings, DeliveryAgentRating, DeliverySchedule
)
from payments.models import Payment
from users.serializers import UserSerializer
from agri_connect.serializers import AgriOrderSerializer


class LocationUpdateSerializer(serializers.Serializer):
    """Serializer for real-time location updates from delivery agents"""
    lat = serializers.FloatField(help_text="Latitude coordinate")
    lon = serializers.FloatField(help_text="Longitude coordinate")
    bearing = serializers.FloatField(required=False, help_text="Direction in degrees (0-360)")
    speed = serializers.FloatField(required=False, help_text="Speed in km/h")
    accuracy = serializers.FloatField(required=False, help_text="GPS accuracy in meters")
    battery_level = serializers.IntegerField(required=False, min_value=0, max_value=100, help_text="Battery percentage")
    
    def validate_lat(self, value):
        if not -90 <= value <= 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90 degrees")
        return value
    
    def validate_lon(self, value):
        if not -180 <= value <= 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180 degrees")
        return value
    
    def validate_bearing(self, value):
        if value is not None and not 0 <= value <= 360:
            raise serializers.ValidationError("Bearing must be between 0 and 360 degrees")
        return value
    
    def validate_speed(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Speed cannot be negative")
        return value


class DeliveryTaskSerializer(serializers.ModelSerializer):
    """Serializer for delivery tasks"""
    customer = UserSerializer(read_only=True)
    farmer = UserSerializer(read_only=True)
    delivery_agent = UserSerializer(read_only=True)
    agri_order = AgriOrderSerializer(read_only=True)
    
    class Meta:
        model = DeliveryTask
        fields = '__all__'
        read_only_fields = ['id', 'task_number', 'created_at', 'assigned_at', 'started_at', 'completed_at']


class DeliveryTaskDetailSerializer(DeliveryTaskSerializer):
    """Detailed serializer for DeliveryTask with full information"""
    
    class Meta(DeliveryTaskSerializer.Meta):
        fields = list(DeliveryTaskSerializer.Meta.fields) + [
            'routes', 'priority'
        ]


class DeliveryAgentLocationSerializer(serializers.ModelSerializer):
    """Serializer for delivery agent locations"""
    delivery_agent = UserSerializer(read_only=True)
    
    class Meta:
        model = DeliveryAgentLocation
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.location:
            data['location'] = {
                'latitude': instance.location.y,
                'longitude': instance.location.x
            }
        return data
    
    def to_internal_value(self, data):
        location_data = data.get('location')
        if location_data and isinstance(location_data, dict):
            lat = location_data.get('latitude')
            lng = location_data.get('longitude')
            if lat and lng:
                data['location'] = Point(float(lng), float(lat))
        return super().to_internal_value(data)


class DeliveryRouteSerializer(serializers.ModelSerializer):
    """Serializer for delivery routes"""
    delivery_task = DeliveryTaskSerializer(read_only=True)
    
    class Meta:
        model = DeliveryRoute
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class DeliveryZoneSerializer(serializers.ModelSerializer):
    """Serializer for delivery zones"""
    class Meta:
        model = DeliveryZone
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class DeliveryAgentEarningsSerializer(serializers.ModelSerializer):
    """Serializer for delivery agent earnings"""
    delivery_agent = UserSerializer(read_only=True)
    delivery_task = DeliveryTaskSerializer(read_only=True)
    
    class Meta:
        model = DeliveryAgentEarnings
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class DeliveryAgentRatingSerializer(serializers.ModelSerializer):
    """Serializer for delivery agent ratings"""
    delivery_agent = UserSerializer(read_only=True)
    customer = UserSerializer(read_only=True)
    delivery_task = DeliveryTaskSerializer(read_only=True)
    
    class Meta:
        model = DeliveryAgentRating
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class DeliveryScheduleSerializer(serializers.ModelSerializer):
    """Serializer for delivery schedules"""
    delivery_agent = UserSerializer(read_only=True)
    
    class Meta:
        model = DeliverySchedule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class UpdateLocationSerializer(serializers.Serializer):
    """Serializer for updating delivery agent location"""
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    accuracy = serializers.FloatField(required=False)
    speed = serializers.FloatField(required=False)
    battery_level = serializers.IntegerField(required=False, min_value=0, max_value=100)


class AcceptTaskSerializer(serializers.Serializer):
    """Serializer for accepting delivery tasks"""
    task_id = serializers.UUIDField()


class UpdateTaskStatusSerializer(serializers.Serializer):
    """Serializer for updating task status"""
    status = serializers.ChoiceField(choices=DeliveryTask.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)


class CompleteTaskSerializer(serializers.Serializer):
    """Serializer for completing delivery tasks"""
    payment_confirmed = serializers.BooleanField()
    payment_method = serializers.ChoiceField(choices=[
        ('cash', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('mobile_money', 'Mobile Money'),
        ('bank_transfer', 'Bank Transfer'),
    ])
    customer_rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    customer_feedback = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True) 