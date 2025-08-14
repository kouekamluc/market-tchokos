from django.contrib import admin
from django.utils.html import format_html
from .models import (
    AgriCategory, AgriProduct, AgriProductImage, AgriProductReview,
    AgriCart, AgriCartItem, AgriOrder, AgriOrderItem, Farm, HarvestSchedule
)


@admin.register(AgriCategory)
class AgriCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    # prepopulated_fields = {'slug': ('name',)}  # slug field doesn't exist
    ordering = ('name',)
    
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'description', 'image', 'is_active')
        }),
    )


class AgriProductImageInline(admin.TabularInline):
    model = AgriProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary')


@admin.register(AgriProduct)
class AgriProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'category', 'price_per_unit', 'available_quantity', 'unit', 'is_organic', 'is_active', 'created_at')
    list_filter = ('category', 'is_organic', 'is_active', 'farming_method', 'created_at')
    search_fields = ('name', 'description', 'farmer__username', 'farmer__business_name')
    # prepopulated_fields = {'slug': ('name',)}  # slug field doesn't exist
    ordering = ('-created_at',)
    inlines = [AgriProductImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'farmer', 'category', 'unit')
        }),
        ('Pricing & Stock', {
            'fields': ('price_per_unit', 'available_quantity', 'is_on_sale', 'discount_percentage')
        }),
        ('Agricultural Information', {
            'fields': ('is_organic', 'harvest_date', 'farm_location', 'farm_name', 'farming_method', 'quality_grade', 'expiry_date')
        }),
        ('Location & Status', {
            'fields': ('location', 'is_active')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('farmer', 'category')


@admin.register(AgriProductImage)
class AgriProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_preview', 'alt_text', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('product__name', 'alt_text')
    ordering = ('-created_at',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px; max-width: 50px;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Image Preview'


@admin.register(AgriProductReview)
class AgriProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'is_verified_purchase', 'created_at')
    list_filter = ('rating', 'is_verified_purchase', 'created_at')
    search_fields = ('product__name', 'user__username', 'title', 'comment')
    ordering = ('-created_at',)
    readonly_fields = ('is_verified_purchase',)
    
    fieldsets = (
        ('Review Information', {
            'fields': ('product', 'user', 'rating', 'title', 'comment', 'is_verified_purchase')
        }),
    )


class AgriCartItemInline(admin.TabularInline):
    model = AgriCartItem
    extra = 1
    fields = ('product', 'quantity')


@admin.register(AgriCart)
class AgriCartAdmin(admin.ModelAdmin):
    list_display = ('customer', 'total_items', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('customer__username', 'customer__phone_number')
    ordering = ('-updated_at',)
    inlines = [AgriCartItemInline]
    readonly_fields = ('total_items',)
    
    fieldsets = (
        ('Cart Information', {
            'fields': ('customer', 'total_items')
        }),
    )


@admin.register(AgriCartItem)
class AgriCartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'total_price', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('cart__user__username', 'product__name')
    ordering = ('-created_at',)
    readonly_fields = ('total_price',)
    
    fieldsets = (
        ('Cart Item Information', {
            'fields': ('cart', 'product', 'quantity', 'total_price')
        }),
    )


class AgriOrderItemInline(admin.TabularInline):
    model = AgriOrderItem
    extra = 1
    fields = ('product', 'quantity', 'total_price')
    readonly_fields = ('total_price',)


@admin.register(AgriOrder)
class AgriOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'status', 'total_amount', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('id', 'customer__username', 'customer__phone_number')
    ordering = ('-created_at',)
    inlines = [AgriOrderItemInline]
    readonly_fields = ('total_amount', 'commission_amount', 'delivery_fee')
    
    fieldsets = (
        ('Order Information', {
            'fields': ('customer', 'status', 'total_amount', 'commission_amount', 'delivery_fee')
        }),
        ('Payment Information', {
            'fields': ('payment_status', 'payment_method')
        }),
        ('Delivery Information', {
            'fields': ('delivery_address', 'delivery_location', 'delivery_landmark', 'delivery_contact')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('customer')


@admin.register(AgriOrderItem)
class AgriOrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'unit_price', 'total_price')
    list_filter = ()
    search_fields = ('order__id', 'product__name')
    ordering = ('-id',)
    readonly_fields = ('total_price',)
    
    fieldsets = (
        ('Order Item Information', {
            'fields': ('order', 'product', 'quantity', 'unit_price', 'total_price')
        }),
    )


@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('name', 'farmer', 'location', 'size', 'size_unit', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'farmer__username', 'farmer__business_name', 'description')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Farm Information', {
            'fields': ('name', 'farmer', 'description', 'location', 'size', 'size_unit', 'soil_type', 'irrigation_type', 'farming_method')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(HarvestSchedule)
class HarvestScheduleAdmin(admin.ModelAdmin):
    list_display = ('farmer', 'product', 'planned_harvest_date', 'expected_quantity', 'unit', 'is_completed', 'created_at')
    list_filter = ('is_completed', 'planned_harvest_date', 'created_at')
    search_fields = ('farmer__username', 'product__name')
    ordering = ('-planned_harvest_date',)
    
    fieldsets = (
        ('Harvest Information', {
            'fields': ('farmer', 'product', 'planned_harvest_date', 'expected_quantity', 'unit', 'is_completed')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
    ) 