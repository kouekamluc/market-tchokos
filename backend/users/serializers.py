from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, UserAddress, UserVerification


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone_number',
            'user_type', 'profile_picture', 'is_verified', 'is_active',
            'business_name', 'business_description', 'rating', 'total_deliveries',
            'total_earnings', 'is_available', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'rating', 'total_deliveries', 'total_earnings']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'phone_number',
            'user_type', 'password', 'password_confirm'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    phone_number = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        phone_number = attrs.get('phone_number')
        password = attrs.get('password')
        
        if phone_number and password:
            user = authenticate(username=phone_number, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include phone_number and password')
        
        return attrs


class UserAddressSerializer(serializers.ModelSerializer):
    """Serializer for UserAddress model"""
    
    class Meta:
        model = UserAddress
        fields = [
            'id', 'name', 'location', 'landmark', 'contact_number',
            'is_default', 'created_at'
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
                from django.contrib.gis.geos import Point
                data['location'] = Point(float(lng), float(lat))
        return super().to_internal_value(data)


class UserVerificationSerializer(serializers.ModelSerializer):
    """Serializer for UserVerification model"""
    
    class Meta:
        model = UserVerification
        fields = [
            'id', 'verification_type', 'document', 'is_approved',
            'approved_by', 'approved_at', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'is_approved', 'approved_by', 'approved_at', 'created_at']


class DeliveryAgentSerializer(serializers.ModelSerializer):
    """Serializer for delivery agent specific fields"""
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'phone_number', 'profile_picture',
            'is_available', 'current_location', 'vehicle_type', 'vehicle_plate',
            'rating', 'total_deliveries', 'total_earnings'
        ]
        read_only_fields = ['id', 'rating', 'total_deliveries', 'total_earnings']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.current_location:
            data['current_location'] = {
                'latitude': instance.current_location.y,
                'longitude': instance.current_location.x
            }
        return data


class MerchantFarmerSerializer(serializers.ModelSerializer):
    """Serializer for merchant/farmer specific fields"""
    
    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'phone_number', 'profile_picture',
            'business_name', 'business_description', 'business_license',
            'years_in_business', 'is_verified', 'rating'
        ]
        read_only_fields = ['id', 'rating']


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for profile updates"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'profile_picture',
            'business_name', 'business_description', 'vehicle_type', 'vehicle_plate'
        ] 