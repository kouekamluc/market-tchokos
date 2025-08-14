from django.contrib import admin
from django.utils.html import format_html
from .models import (
    DeliveryTask, DeliveryAgentLocation, DeliveryRoute, DeliveryZone,
    DeliveryAgentEarnings, DeliveryAgentRating, DeliverySchedule
)


@admin.register(DeliveryTask)
class DeliveryTaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'task_type', 'status', 'customer', 'farmer', 'delivery_agent', 'total_amount', 'created_at')
    list_filter = ('task_type', 'status', 'created_at')
    search_fields = ('id', 'customer__username', 'farmer__username', 'delivery_agent__username')
    ordering = ('-created_at',)
    readonly_fields = ('total_amount', 'distance')
    
    fieldsets = (
        ('Task Information', {
            'fields': ('task_type', 'status', 'customer', 'farmer', 'delivery_agent')
        }),
        ('Location Information', {
            'fields': ('pickup_location', 'pickup_address', 'pickup_contact', 'pickup_landmark', 'delivery_location', 'delivery_address', 'delivery_contact', 'delivery_landmark')
        }),
        ('Real-time Tracking', {
            'fields': ('last_known_point', 'bearing', 'speed_kmh'),
            'classes': ('collapse',)
        }),
        ('Financial Information', {
            'fields': ('base_fare', 'distance_fare', 'time_fare', 'total_amount')
        }),
        ('Timing Information', {
            'fields': ('assigned_at', 'started_at', 'completed_at')
        }),
        ('Additional Information', {
            'fields': ('priority', 'agri_order'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer', 'farmer', 'delivery_agent')


@admin.register(DeliveryAgentLocation)
class DeliveryAgentLocationAdmin(admin.ModelAdmin):
    list_display = ('delivery_agent', 'location', 'accuracy', 'speed', 'battery_level', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('delivery_agent__username', 'delivery_agent__phone_number')
    ordering = ('-timestamp',)
    readonly_fields = ('timestamp',)
    
    fieldsets = (
        ('Location Information', {
            'fields': ('delivery_agent', 'location', 'accuracy', 'speed', 'battery_level', 'timestamp')
        }),
    )


@admin.register(DeliveryRoute)
class DeliveryRouteAdmin(admin.ModelAdmin):
    list_display = ('delivery_task', 'route_data', 'distance', 'duration', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('delivery_task__id',)
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Route Information', {
            'fields': ('delivery_task', 'route_data', 'distance', 'duration')
        }),
    )


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'boundary', 'center', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Zone Information', {
            'fields': ('name', 'description', 'boundary', 'center')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(DeliveryAgentEarnings)
class DeliveryAgentEarningsAdmin(admin.ModelAdmin):
    list_display = ('delivery_agent', 'base_rate', 'commission_amount', 'total_earnings', 'is_paid', 'created_at')
    list_filter = ('is_paid', 'created_at')
    search_fields = ('delivery_agent__username', 'delivery_agent__phone_number')
    ordering = ('-created_at',)
    readonly_fields = ('total_earnings',)
    
    fieldsets = (
        ('Earnings Information', {
            'fields': ('delivery_agent', 'base_rate', 'commission_amount', 'total_earnings')
        }),
        ('Payment Information', {
            'fields': ('is_paid', 'paid_at', 'notes')
        }),
    )


@admin.register(DeliveryAgentRating)
class DeliveryAgentRatingAdmin(admin.ModelAdmin):
    list_display = ('delivery_agent', 'customer', 'rating', 'delivery_task', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('delivery_agent__username', 'customer__username', 'delivery_task__id')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Rating Information', {
            'fields': ('delivery_agent', 'customer', 'delivery_task', 'rating', 'comment')
        }),
    )


@admin.register(DeliverySchedule)
class DeliveryScheduleAdmin(admin.ModelAdmin):
    list_display = ('delivery_agent', 'date', 'start_time', 'end_time', 'is_available', 'created_at')
    list_filter = ('date', 'is_available', 'created_at')
    search_fields = ('delivery_agent__username', 'delivery_agent__phone_number')
    ordering = ('date', 'start_time')
    
    fieldsets = (
        ('Schedule Information', {
            'fields': ('delivery_agent', 'date', 'start_time', 'end_time', 'is_available', 'max_deliveries', 'current_deliveries')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    ) 