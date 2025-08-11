from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.core.validators import RegexValidator
from django.utils import timezone
import uuid


class User(AbstractUser):
    """Custom User model with additional fields"""
    USER_TYPES = [
        ('customer', 'Customer'),
        ('merchant', 'Merchant'),
        ('farmer', 'Farmer'),
        ('delivery_agent', 'Delivery Agent'),
        ('admin', 'Admin'),
    ]
    
    # Basic fields
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, unique=True, validators=[
        RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    ])
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='customer')
    
    # Profile fields
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], blank=True)
    
    # Location fields
    location = gis_models.PointField(null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Business fields (for merchants/farmers)
    business_name = models.CharField(max_length=200, blank=True)
    business_description = models.TextField(blank=True)
    business_license = models.CharField(max_length=100, blank=True)
    years_in_business = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    
    # Delivery agent specific fields
    is_available = models.BooleanField(default=True)
    current_location = gis_models.PointField(null=True, blank=True)
    vehicle_type = models.CharField(max_length=50, blank=True)
    vehicle_plate = models.CharField(max_length=20, blank=True)
    
    # Rating and earnings
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_deliveries = models.PositiveIntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Required fields for Django
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['username', 'email']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.phone_number})"
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def get_short_name(self):
        return self.first_name or self.username


class UserAddress(models.Model):
    """User's saved addresses"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    name = models.CharField(max_length=100)  # e.g., "Home", "Work"
    location = gis_models.PointField()
    landmark = models.CharField(max_length=200, blank=True)
    contact_number = models.CharField(max_length=15)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_addresses'
        verbose_name = 'User Address'
        verbose_name_plural = 'User Addresses'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.name}"
    
    def save(self, *args, **kwargs):
        # If this address is set as default, unset others
        if self.is_default:
            UserAddress.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class UserVerification(models.Model):
    """
    User verification documents and status
    """
    VERIFICATION_TYPES = (
        ('id_card', 'ID Card'),
        ('passport', 'Passport'),
        ('drivers_license', 'Driver\'s License'),
        ('business_license', 'Business License'),
        ('utility_bill', 'Utility Bill'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications')
    verification_type = models.CharField(max_length=20, choices=VERIFICATION_TYPES)
    document = models.FileField(upload_to='verification_documents/')
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_verifications')
    approved_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_verifications'
        verbose_name = 'User Verification'
        verbose_name_plural = 'User Verifications'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_verification_type_display()}"


class UserSession(models.Model):
    """
    Track user sessions for analytics
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.login_time}" 