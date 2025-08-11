from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import User, UserAddress, UserVerification, UserSession


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone_number', 'user_type', 'is_verified', 'is_active', 'created_at')
    list_filter = ('user_type', 'is_verified', 'is_active', 'created_at')
    search_fields = ('username', 'email', 'phone_number', 'first_name', 'last_name', 'business_name')
    ordering = ('-created_at',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('ChronoConnect Profile', {
            'fields': ('user_type', 'phone_number', 'profile_picture', 'is_verified', 'location', 'address', 'city', 'region')
        }),
        ('Business Information', {
            'fields': ('business_name', 'business_description', 'business_license', 'years_in_business'),
            'classes': ('collapse',)
        }),
        ('Delivery Agent Information', {
            'fields': ('is_available', 'current_location', 'vehicle_type', 'vehicle_plate', 'rating', 'total_deliveries', 'total_earnings'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('ChronoConnect Profile', {
            'fields': ('user_type', 'phone_number', 'profile_picture')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'landmark', 'contact_number', 'is_default', 'created_at')
    list_filter = ('is_default', 'created_at')
    search_fields = ('user__username', 'user__phone_number', 'name', 'landmark', 'contact_number')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Address Information', {
            'fields': ('user', 'name', 'location', 'landmark', 'contact_number', 'is_default')
        }),
    )


@admin.register(UserVerification)
class UserVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'verification_type', 'is_approved', 'approved_by', 'created_at')
    list_filter = ('verification_type', 'is_approved', 'created_at')
    search_fields = ('user__username', 'user__phone_number', 'verification_type')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Verification Information', {
            'fields': ('user', 'verification_type', 'document', 'is_approved', 'approved_by', 'approved_at', 'notes')
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if obj.is_approved and not obj.approved_by:
            obj.approved_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'ip_address', 'login_time', 'logout_time', 'is_active')
    list_filter = ('is_active', 'login_time')
    search_fields = ('user__username', 'user__phone_number', 'ip_address', 'session_key')
    ordering = ('-login_time',)
    readonly_fields = ('session_key', 'ip_address', 'user_agent', 'login_time')
    
    fieldsets = (
        ('Session Information', {
            'fields': ('user', 'session_key', 'ip_address', 'user_agent', 'login_time', 'logout_time', 'is_active')
        }),
    ) 