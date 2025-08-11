from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.db import transaction
from agri_connect.models import AgriCategory, AgriProduct, AgriProductImage
from users.models import User
import uuid


class Command(BaseCommand):
    help = 'Populate AgriConnect with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample AgriConnect data...')
        
        with transaction.atomic():
            # Create categories
            categories = self.create_categories()
            
            # Create sample products
            self.create_sample_products(categories)
            
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample AgriConnect data!')
        )

    def create_categories(self):
        """Create sample AgriConnect categories"""
        categories_data = [
            {
                'name': 'Vegetables',
                'slug': 'vegetables',
                'description': 'Fresh vegetables from local farms',
                'icon': '🥬'
            },
            {
                'name': 'Fruits',
                'slug': 'fruits',
                'description': 'Fresh fruits and berries',
                'icon': '🍎'
            },
            {
                'name': 'Grains & Cereals',
                'slug': 'grains-cereals',
                'description': 'Grains and cereal products',
                'icon': '🌽'
            },
            {
                'name': 'Herbs & Spices',
                'slug': 'herbs-spices',
                'description': 'Fresh herbs and spices',
                'icon': '🌿'
            },
            {
                'name': 'Tubers & Roots',
                'slug': 'tubers-roots',
                'description': 'Root vegetables and tubers',
                'icon': '🥔'
            },
            {
                'name': 'Legumes',
                'slug': 'legumes',
                'description': 'Beans, peas, and legumes',
                'icon': '🫘'
            }
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = AgriCategory.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            categories.append(category)
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        return categories

    def create_sample_products(self, categories):
        """Create sample AgriConnect products"""
        # Get or create a farmer user
        farmer, created = User.objects.get_or_create(
            username='sample_farmer',
            defaults={
                'email': 'farmer@example.com',
                'phone_number': '+237612345679',
                'first_name': 'Sample',
                'last_name': 'Farmer',
                'user_type': 'farmer',
                'business_name': 'Green Valley Farm',
                'is_verified': True,
                'is_active': True
            }
        )
        
        if created:
            farmer.set_password('password123')
            farmer.save()
            self.stdout.write(f'Created farmer: {farmer.business_name}')

        products_data = [
            {
                'name': 'Fresh Tomatoes',
                'description': 'Fresh, juicy tomatoes perfect for cooking and salads',
                'price_per_unit': 500,
                'category': categories[0],  # Vegetables
                'farmer': farmer,
                'available_quantity': 50,
                'unit': 'kg',
                'harvest_date': '2024-01-15',
                'is_organic': True,
                'is_active': True,
                'farm_location': Point(9.7674, 4.0511, srid=4326),  # Douala
                'farm_name': 'Green Valley Farm',
                'farming_method': 'Organic',
                'quality_grade': 'A'
            },
            {
                'name': 'Sweet Plantains',
                'description': 'Ripe plantains ready for cooking',
                'price_per_unit': 200,
                'category': categories[1],  # Fruits
                'farmer': farmer,
                'available_quantity': 30,
                'unit': 'bunch',
                'harvest_date': '2024-01-14',
                'is_organic': False,
                'is_active': True,
                'farm_location': Point(11.5021, 3.8474, srid=4326),  # Yaoundé
                'farm_name': 'Green Valley Farm',
                'farming_method': 'Traditional',
                'quality_grade': 'A'
            },
            {
                'name': 'Fresh Spinach',
                'description': 'Organic spinach rich in iron and vitamins',
                'price_per_unit': 300,
                'category': categories[0],  # Vegetables
                'farmer': farmer,
                'available_quantity': 25,
                'unit': 'kg',
                'harvest_date': '2024-01-15',
                'is_organic': True,
                'is_active': True,
                'farm_location': Point(10.1553, 5.9597, srid=4326),  # Bamenda
                'farm_name': 'Green Valley Farm',
                'farming_method': 'Organic',
                'quality_grade': 'A'
            },
            {
                'name': 'Red Onions',
                'description': 'Sweet red onions from the north',
                'price_per_unit': 400,
                'category': categories[0],  # Vegetables
                'farmer': farmer,
                'available_quantity': 40,
                'unit': 'kg',
                'harvest_date': '2024-01-12',
                'is_organic': False,
                'is_active': False,
                'farm_location': Point(9.3004, 13.3976, srid=4326),  # Garoua
                'farm_name': 'Green Valley Farm',
                'farming_method': 'Traditional',
                'quality_grade': 'B'
            },
            {
                'name': 'Cassava Roots',
                'description': 'Fresh cassava roots for traditional dishes',
                'price_per_unit': 150,
                'category': categories[4],  # Tubers
                'farmer': farmer,
                'available_quantity': 60,
                'unit': 'kg',
                'harvest_date': '2024-01-14',
                'is_organic': False,
                'is_active': True,
                'farm_location': Point(9.7674, 4.0511, srid=4326),  # Douala
                'farm_name': 'Green Valley Farm',
                'farming_method': 'Traditional',
                'quality_grade': 'A'
            },
            {
                'name': 'Fresh Mangoes',
                'description': 'Sweet and juicy mangoes from the tropics',
                'price_per_unit': 100,
                'category': categories[1],  # Fruits
                'farmer': farmer,
                'available_quantity': 35,
                'unit': 'kg',
                'harvest_date': '2024-01-15',
                'is_organic': True,
                'is_active': True,
                'farm_location': Point(4.0097, 9.1907, srid=4326),  # Limbe
                'farm_name': 'Green Valley Farm',
                'farming_method': 'Organic',
                'quality_grade': 'A'
            },
            {
                'name': 'Green Beans',
                'description': 'Fresh green beans rich in nutrients',
                'price_per_unit': 250,
                'category': categories[5],  # Legumes
                'farmer': farmer,
                'available_quantity': 20,
                'unit': 'kg',
                'harvest_date': '2024-01-13',
                'is_organic': True,
                'is_active': True,
                'farm_location': Point(11.5021, 3.8474, srid=4326),  # Yaoundé
                'farm_name': 'Green Valley Farm',
                'farming_method': 'Organic',
                'quality_grade': 'A'
            },
            {
                'name': 'Fresh Basil',
                'description': 'Aromatic basil for cooking and garnishing',
                'price_per_unit': 150,
                'category': categories[3],  # Herbs
                'farmer': farmer,
                'available_quantity': 15,
                'unit': 'bunch',
                'harvest_date': '2024-01-15',
                'is_organic': True,
                'is_active': True,
                'farm_location': Point(9.7674, 4.0511, srid=4326),  # Douala
                'farm_name': 'Green Valley Farm',
                'farming_method': 'Organic',
                'quality_grade': 'A'
            }
        ]

        for product_data in products_data:
            product, created = AgriProduct.objects.get_or_create(
                name=product_data['name'],
                farmer=farmer,
                defaults=product_data
            )
            
            if created:
                self.stdout.write(f'Created product: {product.name}')
                
                # Create a primary image for the product
                AgriProductImage.objects.create(
                    product=product,
                    image='/placeholder.svg',
                    is_primary=True,
                    alt_text=f'{product.name} image'
                ) 