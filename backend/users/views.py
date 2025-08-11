from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.db.models import Q
from django.core.cache import cache
import random
import requests
from decouple import config
from .models import User, UserAddress, UserVerification
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserLoginSerializer,
    UserAddressSerializer, UserVerificationSerializer, DeliveryAgentSerializer,
    MerchantFarmerSerializer, PasswordChangeSerializer, ProfileUpdateSerializer
)


class UserRegistrationView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """User profile management"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': UserSerializer(request.user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    """Password change endpoint"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if user.check_password(serializer.validated_data['old_password']):
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                return Response({'message': 'Password changed successfully'})
            else:
                return Response({'error': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserAddressViewSet(generics.ListCreateAPIView):
    """User addresses management"""
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Individual user address management"""
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)


class UserVerificationViewSet(generics.ListCreateAPIView):
    """User verification documents management"""
    serializer_class = UserVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserVerification.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DeliveryAgentsListView(generics.ListAPIView):
    """List available delivery agents"""
    serializer_class = DeliveryAgentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = User.objects.filter(
            user_type='delivery_agent',
            is_active=True,
            is_available=True
        )
        
        # Filter by location if provided
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius', 5000)  # Default 5km
        
        if lat and lng:
            user_location = Point(float(lng), float(lat))
            queryset = queryset.filter(
                current_location__distance_lte=(user_location, D(m=radius))
            ).annotate(
                distance=Distance('current_location', user_location)
            ).order_by('distance')
        
        return queryset


class MerchantsFarmersListView(generics.ListAPIView):
    """List merchants and farmers"""
    serializer_class = MerchantFarmerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_type = self.request.query_params.get('user_type')
        queryset = User.objects.filter(
            user_type__in=['merchant', 'farmer'],
            is_active=True
        )
        
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        return queryset


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_verification_code(request):
    """Send SMS verification code"""
    phone = request.data.get('phone')
    
    if not phone:
        return Response({'error': 'Phone number is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate 6-digit code
    code = str(random.randint(100000, 999999))
    
    # Store code in cache for 10 minutes
    cache.set(f"verification_{phone}", code, 600)
    
    # TODO: Integrate with actual SMS service (Twilio, etc.)
    # For development, just return the code
    if config('DEBUG', default=True, cast=bool):
        return Response({
            'message': 'Verification code sent',
            'code': code  # Remove this in production
        })
    
    # In production, send actual SMS
    # twilio_client.messages.create(
    #     body=f'Your ChronoConnect verification code is: {code}',
    #     from_=config('TWILIO_PHONE_NUMBER'),
    #     to=phone
    # )
    
    return Response({'message': 'Verification code sent'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_phone(request):
    """Verify phone number with code"""
    phone = request.data.get('phone')
    code = request.data.get('code')
    
    if not phone or not code:
        return Response({'error': 'Phone number and code are required'}, 
                      status=status.HTTP_400_BAD_REQUEST)
    
    stored_code = cache.get(f"verification_{phone}")
    if not stored_code or stored_code != code:
        return Response({'error': 'Invalid or expired code'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Mark user as verified if they exist
    try:
        user = User.objects.get(phone_number=phone)
        user.is_verified = True
        user.save()
    except User.DoesNotExist:
        pass  # User doesn't exist yet, that's okay
    
    # Clear the code from cache
    cache.delete(f"verification_{phone}")
    
    return Response({'message': 'Phone verified successfully'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def geocode_address(request):
    """Geocode address using Mapbox"""
    address = request.data.get('address')
    
    if not address:
        return Response({'error': 'Address is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    mapbox_token = config('MAPBOX_ACCESS_TOKEN', default='')
    if not mapbox_token:
        return Response({'error': 'Mapbox token not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    try:
        # Geocode using Mapbox
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"
        params = {
            'access_token': mapbox_token,
            'country': 'CM',  # Cameroon
            'limit': 1
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        if data['features']:
            feature = data['features'][0]
            coordinates = feature['center']
            
            return Response({
                'latitude': coordinates[1],
                'longitude': coordinates[0],
                'place_name': feature['place_name']
            })
        else:
            return Response({'error': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)
            
    except requests.RequestException as e:
        return Response({'error': 'Geocoding service unavailable'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_delivery_agent_location(request):
    """Update delivery agent's current location"""
    try:
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        
        if not lat or not lng:
            return Response({'error': 'Latitude and longitude are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if request.user.user_type != 'delivery_agent':
            return Response({'error': 'Only delivery agents can update location'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        request.user.current_location = Point(float(lng), float(lat))
        request.user.save()
        
        return Response({'message': 'Location updated successfully'})
    except ValueError:
        return Response({'error': 'Invalid coordinates'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_delivery_agent_availability(request):
    """Toggle delivery agent availability"""
    if request.user.user_type != 'delivery_agent':
        return Response({'error': 'Only delivery agents can toggle availability'}, 
                      status=status.HTTP_403_FORBIDDEN)
    
    request.user.is_available = not request.user.is_available
    request.user.save()
    
    return Response({
        'message': f"Availability set to {request.user.is_available}",
        'is_available': request.user.is_available
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_users(request):
    """Search users by name, phone, or business name"""
    query = request.query_params.get('q', '')
    user_type = request.query_params.get('user_type')
    
    if not query:
        return Response({'error': 'Search query is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    queryset = User.objects.filter(
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(phone_number__icontains=query) |
        Q(business_name__icontains=query)
    )
    
    if user_type:
        queryset = queryset.filter(user_type=user_type)
    
    serializer = UserSerializer(queryset[:10], many=True)  # Limit to 10 results
    return Response(serializer.data) 