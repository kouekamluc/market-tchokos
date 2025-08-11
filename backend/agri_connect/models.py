from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import Point
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from users.models import User
import uuid


class AgriCategory(models.Model):
    """Product categories for AgriConnect"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # Emoji or icon class
    image = models.ImageField(upload_to='agri_category_images/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agri_categories'
        verbose_name = 'Agri Category'
        verbose_name_plural = 'Agri Categories'
    
    def __str__(self):
        return self.name


class AgriProduct(models.Model):
    """Agricultural product model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agri_products')
    category = models.ForeignKey('AgriCategory', on_delete=models.CASCADE, related_name='products')
    
    # Product details
    name = models.CharField(max_length=200)
    description = models.TextField()
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=50)  # kg, pieces, etc.
    available_quantity = models.PositiveIntegerField()
    
    # Product characteristics
    harvest_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    farm_location = gis_models.PointField()
    farm_name = models.CharField(max_length=200, blank=True)
    farming_method = models.CharField(max_length=100, blank=True)  # Traditional, Modern, etc.
    
    # Quality indicators
    is_organic = models.BooleanField(default=False)
    is_fresh = models.BooleanField(default=True)
    quality_grade = models.CharField(max_length=20, choices=[
        ('A', 'Grade A'),
        ('B', 'Grade B'),
        ('C', 'Grade C'),
    ], default='A')
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agri_products'
        verbose_name = 'Agricultural Product'
        verbose_name_plural = 'Agricultural Products'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.farmer.business_name}"
    
    @property
    def is_on_sale(self):
        return self.original_price and self.original_price > self.price
    
    @property
    def discount_percentage(self):
        if self.is_on_sale:
            return int(((self.original_price - self.price) / self.original_price) * 100)
        return 0
    
    @property
    def is_in_stock(self):
        return self.stock_quantity > 0
    
    @property
    def days_since_harvest(self):
        return (timezone.now().date() - self.harvest_date).days
    
    @property
    def is_fresh(self):
        return self.days_since_harvest <= 3  # Consider fresh if harvested within 3 days


class AgriProductImage(models.Model):
    """AgriProduct images"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(AgriProduct, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='agri_product_images/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'agri_product_images'
        verbose_name = 'Agri Product Image'
        verbose_name_plural = 'Agri Product Images'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"{self.product.name} - Image {self.order}"
    
    def save(self, *args, **kwargs):
        if self.is_primary:
            # Set all other images of this product to non-primary
            AgriProductImage.objects.filter(product=self.product).update(is_primary=False)
        super().save(*args, **kwargs)


class AgriProductReview(models.Model):
    """AgriProduct reviews and ratings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(AgriProduct, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agri_product_reviews')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agri_product_reviews'
        verbose_name = 'Agri Product Review'
        verbose_name_plural = 'Agri Product Reviews'
        unique_together = ['product', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.product.name} ({self.rating} stars)"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        if is_new:
            # Update product rating
            self.update_product_rating()
    
    def update_product_rating(self):
        """Update the product's average rating"""
        reviews = AgriProductReview.objects.filter(
            product=self.product,
            is_approved=True
        )
        if reviews.exists():
            avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
            self.product.rating = round(avg_rating, 2)
            self.product.total_reviews = reviews.count()
            self.product.save()


class AgriCart(models.Model):
    """AgriConnect shopping cart"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agri_carts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'agri_carts'
        verbose_name = 'Agri Cart'
        verbose_name_plural = 'Agri Carts'
    
    def __str__(self):
        return f"Agri Cart for {self.user.get_full_name()}"
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())
    
    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.all())
    
    @property
    def delivery_fee(self):
        from django.conf import settings
        if self.subtotal >= settings.FREE_DELIVERY_THRESHOLD:
            return 0
        return 500  # Default delivery fee
    
    @property
    def total(self):
        return self.subtotal + self.delivery_fee


class AgriCartItem(models.Model):
    """AgriCart items"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(AgriCart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(AgriProduct, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agri_cart_items'
        verbose_name = 'Agri Cart Item'
        verbose_name_plural = 'Agri Cart Items'
        unique_together = ['cart', 'product']
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    @property
    def unit_price(self):
        return self.product.price
    
    @property
    def total_price(self):
        return self.unit_price * self.quantity


class AgriOrder(models.Model):
    """Agricultural order model"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHODS = [
        ('cash', 'Cash on Delivery'),
        ('card', 'Credit/Debit Card'),
        ('mobile_money', 'Mobile Money'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agri_orders')
    
    # Order details
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Delivery details
    delivery_address = models.TextField()
    delivery_location = gis_models.PointField()
    delivery_landmark = models.CharField(max_length=200, blank=True)
    delivery_contact = models.CharField(max_length=15)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'agri_orders'
        verbose_name = 'Agricultural Order'
        verbose_name_plural = 'Agricultural Orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Agri Order {self.id} - {self.customer.get_full_name()}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        super().save(*args, **kwargs)
    
    def generate_order_number(self):
        """Generate unique order number"""
        import random
        import string
        while True:
            order_number = f"AG{timezone.now().strftime('%Y%m%d')}{''.join(random.choices(string.digits, k=6))}"
            if not AgriOrder.objects.filter(order_number=order_number).exists():
                return order_number


class AgriOrderItem(models.Model):
    """AgriOrder items"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(AgriOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(AgriProduct, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'agri_order_items'
        verbose_name = 'Agri Order Item'
        verbose_name_plural = 'Agri Order Items'
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class Farm(models.Model):
    """Farm model for agricultural products"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='farms')
    
    # Farm details
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = gis_models.PointField()
    size = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # in hectares
    size_unit = models.CharField(max_length=20, default='hectares')
    
    # Farm characteristics
    soil_type = models.CharField(max_length=100, blank=True)
    irrigation_type = models.CharField(max_length=100, blank=True)
    farming_method = models.CharField(max_length=100, blank=True)  # Traditional, Modern, Organic
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'farms'
        verbose_name = 'Farm'
        verbose_name_plural = 'Farms'
    
    def __str__(self):
        return f"{self.name} - {self.farmer.business_name}"


class HarvestSchedule(models.Model):
    """Harvest schedules for farmers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='harvest_schedules')
    product = models.ForeignKey(AgriProduct, on_delete=models.CASCADE, related_name='harvest_schedules')
    planned_harvest_date = models.DateField()
    expected_quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=20, default='kg')
    notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    actual_harvest_date = models.DateField(null=True, blank=True)
    actual_quantity = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'harvest_schedules'
        verbose_name = 'Harvest Schedule'
        verbose_name_plural = 'Harvest Schedules'
        ordering = ['planned_harvest_date']
    
    def __str__(self):
        return f"{self.product.name} - {self.planned_harvest_date}" 