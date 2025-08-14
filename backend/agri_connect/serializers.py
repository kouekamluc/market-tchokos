from rest_framework import serializers
from django.contrib.gis.geos import Point
from .models import (
    AgriCategory, AgriProduct, AgriProductImage, AgriProductReview,
    AgriCart, AgriCartItem, AgriOrder, AgriOrderItem, Farm, HarvestSchedule
)


class AgriCategorySerializer(serializers.ModelSerializer):
    """Serializer for AgriCategory model"""
    
    class Meta:
        model = AgriCategory
        fields = ['id', 'name', 'description', 'image', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class AgriProductImageSerializer(serializers.ModelSerializer):
    """Serializer for AgriProductImage model"""
    
    class Meta:
        model = AgriProductImage
        fields = ['id', 'image', 'is_primary', 'created_at']
        read_only_fields = ['id', 'created_at']


class AgriProductReviewSerializer(serializers.ModelSerializer):
    """Serializer for AgriProductReview model"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_avatar = serializers.CharField(source='user.profile_picture', read_only=True)
    
    class Meta:
        model = AgriProductReview
        fields = [
            'id', 'product', 'user', 'user_name', 'user_avatar',
            'rating', 'title', 'comment', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class AgriProductSerializer(serializers.ModelSerializer):
    """Serializer for AgriProduct model"""
    images = AgriProductImageSerializer(many=True, read_only=True)
    reviews = AgriProductReviewSerializer(many=True, read_only=True)
    farmer_name = serializers.CharField(source='farmer.business_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = AgriProduct
        fields = [
            'id', 'farmer', 'farmer_name', 'category', 'category_name',
            'name', 'description', 'price_per_unit', 'price', 'sale_price', 'available_quantity', 'stock_quantity', 'unit', 'images',
            'reviews', 'average_rating', 'review_count', 'is_available', 'is_active',
            'is_on_sale', 'discount_percentage', 'is_in_stock', 'created_at'
        ]
        read_only_fields = ['id', 'farmer', 'created_at', 'average_rating', 'review_count']


class AgriProductDetailSerializer(AgriProductSerializer):
    """Detailed serializer for AgriProduct with full information"""
    
    class Meta(AgriProductSerializer.Meta):
        fields = AgriProductSerializer.Meta.fields + [
            'is_organic', 'harvest_date', 'farm_location', 'farm_name', 'farming_method',
            'days_since_harvest', 'is_fresh', 'quality_grade', 'expiry_date', 'farm'
        ]


class AgriCartItemSerializer(serializers.ModelSerializer):
    """Serializer for AgriCartItem model"""
    product = AgriProductSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = AgriCartItem
        fields = [
            'id', 'product', 'product_id', 'quantity', 'total_price', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AgriCartSerializer(serializers.ModelSerializer):
    """Serializer for AgriCart model"""
    items = AgriCartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = AgriCart
        fields = ['id', 'customer', 'items', 'total_items', 'total_amount', 'created_at']
        read_only_fields = ['id', 'customer', 'created_at']


class AgriOrderItemSerializer(serializers.ModelSerializer):
    """Serializer for AgriOrderItem model"""
    product = AgriProductSerializer(read_only=True)
    
    class Meta:
        model = AgriOrderItem
        fields = [
            'id', 'product', 'quantity', 'unit_price', 'total_price', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AgriOrderSerializer(serializers.ModelSerializer):
    """Serializer for AgriOrder model"""
    items = AgriOrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    
    class Meta:
        model = AgriOrder
        fields = [
            'id', 'order_number', 'customer', 'customer_name', 'items', 'delivery_address',
            'total_amount', 'delivery_fee', 'commission_amount', 'status',
            'payment_method', 'payment_status', 'created_at'
        ]
        read_only_fields = ['id', 'order_number', 'customer', 'created_at']


class AgriOrderDetailSerializer(AgriOrderSerializer):
    """Detailed serializer for AgriOrder with full information"""
    
    class Meta(AgriOrderSerializer.Meta):
        fields = AgriOrderSerializer.Meta.fields + [
            'delivery_location', 'delivery_landmark', 'delivery_contact', 'notes',
            'estimated_delivery', 'actual_delivery', 'delivery_agent', 'updated_at'
        ]


class FarmSerializer(serializers.ModelSerializer):
    """Serializer for Farm model"""
    farmer_name = serializers.CharField(source='farmer.business_name', read_only=True)
    
    class Meta:
        model = Farm
        fields = [
            'id', 'farmer', 'farmer_name', 'name', 'description', 'location',
            'size', 'size_unit', 'soil_type', 'irrigation_type', 'farming_method', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'farmer', 'created_at']


class HarvestScheduleSerializer(serializers.ModelSerializer):
    """Serializer for HarvestSchedule model"""
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    
    class Meta:
        model = HarvestSchedule
        fields = [
            'id', 'farmer', 'product', 'farm', 'farm_name', 'planned_harvest_date',
            'expected_quantity', 'unit', 'notes', 'is_completed', 'actual_harvest_date',
            'actual_quantity', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at']


class AddToAgriCartSerializer(serializers.Serializer):
    """Serializer for adding items to agri cart"""
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class UpdateAgriCartItemSerializer(serializers.Serializer):
    """Serializer for updating agri cart items"""
    quantity = serializers.IntegerField(min_value=1)


class CreateAgriOrderSerializer(serializers.Serializer):
    """Serializer for creating agri orders"""
    delivery_address = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=AgriOrder.PAYMENT_METHODS)
    notes = serializers.CharField(required=False, allow_blank=True) 