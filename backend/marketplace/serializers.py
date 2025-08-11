from rest_framework import serializers
from .models import (
    Category, Product, ProductImage, ProductVariant, ProductReview,
    Cart, CartItem, Order, OrderItem
)
from users.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for product categories"""
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'icon', 'image',
            'is_active', 'product_count', 'created_at', 'updated_at'
        ]
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images"""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for product variants"""
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'value', 'price_adjustment', 
            'stock_quantity', 'is_active'
        ]


class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer for product reviews"""
    user = UserSerializer(read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'user', 'user_name', 'rating', 'title', 'comment',
            'is_verified_purchase', 'created_at'
        ]
        read_only_fields = ['user', 'is_verified_purchase']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products"""
    merchant = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    sale_price = serializers.SerializerMethodField()
    distance = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'merchant', 'category', 'name', 'description', 'price',
            'stock', 'warranty', 'handmade', 'fast_delivery', 'is_on_sale',
            'discount_percentage', 'location', 'city', 'region', 'is_active',
            'rating', 'total_reviews', 'images', 'variants', 'reviews',
            'primary_image', 'review_count', 'average_rating', 'is_in_stock',
            'sale_price', 'distance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['merchant', 'rating', 'total_reviews']
    
    def get_primary_image(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return ProductImageSerializer(primary_image).data
        return None
    
    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()
    
    def get_average_rating(self, obj):
        reviews = obj.reviews.filter(is_approved=True)
        if reviews:
            return sum(review.rating for review in reviews) / len(reviews)
        return 0.0
    
    def get_is_in_stock(self, obj):
        return obj.stock > 0
    
    def get_sale_price(self, obj):
        if obj.is_on_sale and obj.discount_percentage > 0:
            return obj.price * (1 - obj.discount_percentage / 100)
        return obj.price
    
    def get_distance(self, obj):
        if hasattr(obj, 'distance'):
            return obj.distance.km if obj.distance else None
        return None


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items"""
    product = ProductSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)
    unit_price = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'variant', 'quantity', 'unit_price',
            'total_price', 'created_at', 'updated_at'
        ]
    
    def get_unit_price(self, obj):
        if obj.variant:
            return float(obj.product.price + obj.variant.price_adjustment)
        return float(obj.product.price)
    
    def get_total_price(self, obj):
        return float(obj.total_price)


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart"""
    user = UserSerializer(read_only=True)
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    delivery_fee = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = [
            'id', 'user', 'items', 'total_items', 'subtotal',
            'delivery_fee', 'total', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user']
    
    def get_total_items(self, obj):
        return obj.total_items
    
    def get_subtotal(self, obj):
        return float(obj.subtotal)
    
    def get_delivery_fee(self, obj):
        return float(obj.delivery_fee)
    
    def get_total(self, obj):
        return float(obj.total)


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    product = ProductSerializer(read_only=True)
    variant = ProductVariantSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'variant', 'quantity', 'unit_price', 'total_price'
        ]


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders"""
    customer = UserSerializer(read_only=True)
    delivery_address = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'delivery_address',
            'total_amount', 'delivery_fee', 'commission_amount',
            'delivery_landmark', 'delivery_contact', 'status',
            'status_display', 'payment_method', 'payment_method_display',
            'payment_status', 'payment_status_display', 'items',
            'created_at', 'updated_at', 'delivered_at'
        ]
        read_only_fields = ['customer', 'order_number', 'total_amount', 'delivery_fee', 'commission_amount']
    
    def get_delivery_address(self, obj):
        if obj.delivery_address:
            return {
                'id': obj.delivery_address.id,
                'landmark': obj.delivery_address.landmark,
                'latitude': obj.delivery_address.location.latitude,
                'longitude': obj.delivery_address.location.longitude,
                'contact_number': obj.delivery_address.contact_number
            }
        return None


# Additional serializers for specific operations
class AddToCartSerializer(serializers.Serializer):
    """Serializer for adding items to cart"""
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer for updating cart items"""
    quantity = serializers.IntegerField(min_value=0)


class CreateOrderSerializer(serializers.Serializer):
    """Serializer for creating orders"""
    delivery_address_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHODS)
    notes = serializers.CharField(required=False, allow_blank=True)


class ProductSearchSerializer(serializers.Serializer):
    """Serializer for product search"""
    query = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    in_stock = serializers.BooleanField(required=False)
    min_rating = serializers.DecimalField(max_digits=3, decimal_places=2, required=False)
    lat = serializers.FloatField(required=False)
    lng = serializers.FloatField(required=False)
    radius = serializers.FloatField(required=False, default=50) 