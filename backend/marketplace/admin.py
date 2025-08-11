from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import (
    Category, Product, ProductImage, ProductVariant, ProductReview,
    Cart, CartItem, Order, OrderItem
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
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


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ('image', 'alt_text', 'is_primary')


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ('name', 'value', 'price_adjustment', 'is_active')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'merchant', 'category', 'price', 'stock', 'is_active', 'created_at')
    list_filter = ('category', 'is_active', 'fast_delivery', 'created_at')
    search_fields = ('name', 'description', 'merchant__username', 'merchant__business_name')
    # prepopulated_fields = {'slug': ('name',)}  # slug field doesn't exist
    ordering = ('-created_at',)
    inlines = [ProductImageInline, ProductVariantInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'merchant', 'category')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'stock', 'is_on_sale', 'discount_percentage')
        }),
        ('Product Features', {
            'fields': ('warranty', 'handmade', 'fast_delivery')
        }),
        ('Location & Status', {
            'fields': ('location', 'is_active', 'featured')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('merchant', 'category')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_preview', 'alt_text', 'is_primary', 'created_at')
    list_filter = ('is_primary', 'created_at')
    search_fields = ('product__name', 'alt_text')
    ordering = ('-created_at',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px; max-width: 50px;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Image Preview'


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'name', 'value', 'price_adjustment', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('product__name', 'name', 'value')
    ordering = ('-id',)


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
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


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1
    fields = ('product', 'quantity')


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_items', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__phone_number')
    ordering = ('-updated_at',)
    inlines = [CartItemInline]
    readonly_fields = ('total_items',)
    
    fieldsets = (
        ('Cart Information', {
            'fields': ('user', 'total_items')
        }),
    )


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'total_price')
    list_filter = ()
    search_fields = ('cart__user__username', 'product__name')
    ordering = ('-id',)
    readonly_fields = ('total_price',)
    
    fieldsets = (
        ('Cart Item Information', {
            'fields': ('cart', 'product', 'quantity', 'total_price')
        }),
    )


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    fields = ('product', 'quantity', 'total_price')
    readonly_fields = ('total_price',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'status', 'total_amount', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('id', 'customer__username', 'customer__phone_number')
    ordering = ('-created_at',)
    inlines = [OrderItemInline]
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


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'total_price')
    list_filter = ()
    search_fields = ('order__id', 'product__name')
    ordering = ('-id',)
    readonly_fields = ('total_price',)
    
    fieldsets = (
        ('Order Item Information', {
            'fields': ('order', 'product', 'quantity', 'total_price')
        }),
    ) 