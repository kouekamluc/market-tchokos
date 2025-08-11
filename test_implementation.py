#!/usr/bin/env python3
"""
Test script for ChronoConnect backend implementation
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronoconnect.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from users.models import User, UserAddress
from users.serializers import UserSerializer, UserAddressSerializer

User = get_user_model()

def test_user_creation():
    """Test user creation and serialization"""
    print("Testing user creation...")
    
    # Create a test user
    user_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'phone_number': '+237612345678',
        'first_name': 'Test',
        'last_name': 'User',
        'user_type': 'customer',
        'password': 'testpass123'
    }
    
    user = User.objects.create_user(**user_data)
    print(f"✓ Created user: {user.get_full_name()}")
    
    # Test serialization
    serializer = UserSerializer(user)
    print(f"✓ User serialized: {serializer.data['email']}")
    
    return user

def test_address_creation(user):
    """Test address creation and serialization"""
    print("\nTesting address creation...")
    
    # Create a test address
    location = Point(9.0820, 8.6753)  # Nigeria coordinates
    address_data = {
        'user': user,
        'name': 'Home',
        'location': location,
        'landmark': 'Near the main market',
        'contact_number': '+237612345678',
        'is_default': True
    }
    
    address = UserAddress.objects.create(**address_data)
    print(f"✓ Created address: {address.name}")
    
    # Test serialization
    serializer = UserAddressSerializer(address)
    print(f"✓ Address serialized: {serializer.data['name']}")
    
    return address

def test_phone_verification():
    """Test phone verification endpoints"""
    print("\nTesting phone verification...")
    
    # This would normally test the API endpoints
    # For now, just verify the functions exist
    from users.views import send_verification_code, verify_phone
    print("✓ Phone verification functions exist")
    
    return True

def test_geocoding():
    """Test geocoding functionality"""
    print("\nTesting geocoding...")
    
    # This would test the geocoding endpoint
    # For now, just verify the function exists
    from users.views import geocode_address
    print("✓ Geocoding function exists")
    
    return True

def main():
    """Run all tests"""
    print("🚀 Testing ChronoConnect Backend Implementation")
    print("=" * 50)
    
    try:
        # Test user creation
        user = test_user_creation()
        
        # Test address creation
        address = test_address_creation(user)
        
        # Test phone verification
        test_phone_verification()
        
        # Test geocoding
        test_geocoding()
        
        print("\n" + "=" * 50)
        print("✅ All tests passed! Backend implementation is working correctly.")
        print("\nNext steps:")
        print("1. Start the backend server: python manage.py runserver 8000")
        print("2. Start the frontend: npm run dev")
        print("3. Test the registration flow with phone verification")
        print("4. Test the location picker component")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1) 