from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.db import transaction
from marketplace.models import Category, Product, ProductImage, ProductVariant
from users.models import User
import uuid


class Command(BaseCommand):
    help = 'Populate marketplace with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample marketplace data...')
        
        with transaction.atomic():
            # Create categories
            categories = self.create_categories()
            
            # Create sample products
            self.create_sample_products(categories)
            
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample marketplace data!')
        )

    def create_categories(self):
        """Create sample categories"""
        categories_data = [
            {
                'name': 'Electronics',
                'slug': 'electronics',
                'description': 'Latest gadgets and electronic devices',
                'icon': '📱'
            },
            {
                'name': 'Fashion & Style',
                'slug': 'fashion',
                'description': 'Trendy clothing and accessories',
                'icon': '👕'
            },
            {
                'name': 'Home & Garden',
                'slug': 'home-garden',
                'description': 'Home improvement and garden supplies',
                'icon': '🏠'
            },
            {
                'name': 'Beauty & Health',
                'slug': 'beauty-health',
                'description': 'Beauty products and health supplements',
                'icon': '💄'
            },
            {
                'name': 'Sports & Outdoors',
                'slug': 'sports-outdoors',
                'description': 'Sports equipment and outdoor gear',
                'icon': '⚽'
            },
            {
                'name': 'Books & Media',
                'slug': 'books-media',
                'description': 'Books, movies, and educational materials',
                'icon': '📚'
            },
            {
                'name': 'Automotive',
                'slug': 'automotive',
                'description': 'Car parts and accessories',
                'icon': '🚗'
            },
            {
                'name': 'Toys & Games',
                'slug': 'toys-games',
                'description': 'Fun toys and games for all ages',
                'icon': '🎮'
            }
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        return categories

    def create_sample_products(self, categories):
        """Create sample products"""
        # Get or create a merchant user
        merchant, created = User.objects.get_or_create(
            username='sample_merchant',
            defaults={
                'email': 'merchant@example.com',
                'phone_number': '+237612345678',
                'first_name': 'Sample',
                'last_name': 'Merchant',
                'user_type': 'merchant',
                'business_name': 'TechHub Cameroon',
                'is_verified': True,
                'is_active': True
            }
        )
        
        if created:
            merchant.set_password('password123')
            merchant.save()
            self.stdout.write(f'Created merchant: {merchant.business_name}')

        products_data = [
            {
                'name': 'Samsung Galaxy A54 5G',
                'description': 'Latest Samsung smartphone with 5G capabilities, 128GB storage, 6GB RAM',
                'price': 285000,
                'stock': 15,
                'category': categories[0],  # Electronics
                'warranty': '1 year',
                'fast_delivery': True,
                'location': Point(9.7674, 4.0511, srid=4326),  # Douala
                'city': 'Douala',
                'region': 'Littoral'
            },
            {
                'name': 'Nike Air Max 270',
                'description': 'Comfortable running shoes with Air Max technology, perfect for daily use',
                'price': 125000,
                'stock': 25,
                'category': categories[1],  # Fashion
                'fast_delivery': False,
                'location': Point(11.5021, 3.8474, srid=4326),  # Yaoundé
                'city': 'Yaoundé',
                'region': 'Centre'
            },
            {
                'name': 'iPhone 13 Pro',
                'description': 'Premium iPhone with professional camera system, 256GB storage',
                'price': 650000,
                'stock': 8,
                'category': categories[0],  # Electronics
                'warranty': '1 year Apple Care',
                'fast_delivery': True,
                'location': Point(9.7674, 4.0511, srid=4326),  # Douala
                'city': 'Douala',
                'region': 'Littoral'
            },
            {
                'name': 'Adidas Traditional Dress',
                'description': 'Beautiful traditional African dress with modern Adidas styling',
                'price': 45000,
                'stock': 12,
                'category': categories[1],  # Fashion
                'handmade': True,
                'location': Point(10.1553, 5.9597, srid=4326),  # Bamenda
                'city': 'Bamenda',
                'region': 'Northwest'
            },
            {
                'name': 'Garden Tool Set',
                'description': 'Complete set of high-quality garden tools for home gardening',
                'price': 35000,
                'stock': 30,
                'category': categories[2],  # Home & Garden
                'location': Point(9.7674, 4.0511, srid=4326),  # Douala
                'city': 'Douala',
                'region': 'Littoral'
            },
            {
                'name': 'Organic Face Cream',
                'description': 'Natural organic face cream with shea butter and aloe vera',
                'price': 15000,
                'stock': 50,
                'category': categories[3],  # Beauty & Health
                'handmade': True,
                'location': Point(11.5021, 3.8474, srid=4326),  # Yaoundé
                'city': 'Yaoundé',
                'region': 'Centre'
            },
            {
                'name': 'Football Jersey',
                'description': 'Official Cameroon national team jersey, high quality fabric',
                'price': 25000,
                'stock': 20,
                'category': categories[4],  # Sports
                'location': Point(9.7674, 4.0511, srid=4326),  # Douala
                'city': 'Douala',
                'region': 'Littoral'
            },
            {
                'name': 'Programming Book Collection',
                'description': 'Complete collection of programming books for beginners to advanced',
                'price': 75000,
                'stock': 10,
                'category': categories[5],  # Books & Media
                'location': Point(11.5021, 3.8474, srid=4326),  # Yaoundé
                'city': 'Yaoundé',
                'region': 'Centre'
            },
            {
                'name': 'Car Air Freshener',
                'description': 'Long-lasting car air freshener with natural scents',
                'price': 5000,
                'stock': 100,
                'category': categories[6],  # Automotive
                'location': Point(9.7674, 4.0511, srid=4326),  # Douala
                'city': 'Douala',
                'region': 'Littoral'
            },
            {
                'name': 'Board Game Collection',
                'description': 'Family board game collection including Monopoly, Scrabble, and more',
                'price': 35000,
                'stock': 15,
                'category': categories[7],  # Toys & Games
                'location': Point(11.5021, 3.8474, srid=4326),  # Yaoundé
                'city': 'Yaoundé',
                'region': 'Centre'
            }
        ]

        for product_data in products_data:
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                merchant=merchant,
                defaults=product_data
            )
            
            if created:
                self.stdout.write(f'Created product: {product.name}')
                
                # Create product variants for some products
                if product.name == 'Nike Air Max 270':
                    sizes = ['39', '40', '41', '42', '43']
                    for size in sizes:
                        ProductVariant.objects.create(
                            product=product,
                            name='Size',
                            value=size,
                            price_adjustment=0,
                            stock_quantity=5
                        )
                
                elif product.name == 'Adidas Traditional Dress':
                    sizes = ['S', 'M', 'L', 'XL']
                    for size in sizes:
                        ProductVariant.objects.create(
                            product=product,
                            name='Size',
                            value=size,
                            price_adjustment=0,
                            stock_quantity=3
                        ) 