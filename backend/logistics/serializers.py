from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import (
    DeliveryTask, DeliveryAgentLocation, DeliveryRoute, DeliveryZone,
    DeliveryAgentEarnings, DeliveryAgentRating, DeliverySchedule
)
from payments.models import Payment


class DeliveryTaskSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryTask model"""
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    merchant_name = serializers.CharField(source='merchant.business_name', read_only=True)
    delivery_agent_name = serializers.CharField(source='delivery_agent.get_full_name', read_only=True)
    pickup_address = serializers.CharField(source='pickup_location', read_only=True)
    delivery_address = serializers.CharField(source='delivery_location', read_only=True)
    
    class Meta:
        model = DeliveryTask
        fields = [
            'id', 'task_type', 'status', 'customer', 'customer_name',
            'merchant', 'merchant_name', 'delivery_agent', 'delivery_agent_name',
            'pickup_location', 'pickup_address', 'delivery_location', 'delivery_address',
            'pickup_contact', 'delivery_contact', 'pickup_landmark', 'delivery_landmark',
            'total_amount', 'base_fare', 'distance_fare', 'time_fare', 'distance',
            'assigned_at', 'started_at', 'completed_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'assigned_at', 'started_at', 'completed_at']


class DeliveryTaskDetailSerializer(DeliveryTaskSerializer):
    """Detailed serializer for DeliveryTask with full information"""
    
    class Meta(DeliveryTaskSerializer.Meta):
        fields = DeliveryTaskSerializer.Meta.fields + [
            'routes', 'priority'
        ]


class DeliveryAgentLocationSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryAgentLocation model"""
    agent_name = serializers.CharField(source='delivery_agent.get_full_name', read_only=True)
    
    class Meta:
        model = DeliveryAgentLocation
        fields = [
            'id', 'delivery_agent', 'agent_name', 'location', 'accuracy', 'speed', 'battery_level',
            'timestamp', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
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
    """Serializer for DeliveryRoute model"""
    
    class Meta:
        model = DeliveryRoute
        fields = [
            'id', 'delivery_task', 'route_data', 'distance', 'duration',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DeliveryZoneSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryZone model"""
    
    class Meta:
        model = DeliveryZone
        fields = [
            'id', 'name', 'description', 'boundary', 'center',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DeliveryAgentEarningsSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryAgentEarnings model"""
    agent_name = serializers.CharField(source='delivery_agent.get_full_name', read_only=True)
    
    class Meta:
        model = DeliveryAgentEarnings
        fields = [
            'id', 'delivery_agent', 'agent_name', 'delivery_task', 'base_rate',
            'commission_amount', 'total_earnings', 'is_paid',
            'paid_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DeliveryAgentRatingSerializer(serializers.ModelSerializer):
    """Serializer for DeliveryAgentRating model"""
    agent_name = serializers.CharField(source='delivery_agent.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    
    class Meta:
        model = DeliveryAgentRating
        fields = [
            'id', 'delivery_agent', 'agent_name', 'customer', 'customer_name',
            'delivery_task', 'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'customer', 'created_at']


class DeliveryScheduleSerializer(serializers.ModelSerializer):
    """Serializer for DeliverySchedule model"""
    agent_name = serializers.CharField(source='delivery_agent.get_full_name', read_only=True)
    
    class Meta:
        model = DeliverySchedule
        fields = [
            'id', 'delivery_agent', 'agent_name', 'date', 'start_time',
            'end_time', 'is_available', 'max_deliveries', 'current_deliveries',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


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