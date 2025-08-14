from django.core.management.base import BaseCommand
from django.db import connection
from django.db import transaction


class Command(BaseCommand):
    help = 'Reset the database schema for agri_connect tables'

    def handle(self, *args, **options):
        self.stdout.write('Resetting agri_connect database schema...')
        
        with connection.cursor() as cursor:
            # Drop existing tables
            self.stdout.write('Dropping existing tables...')
            
            # Drop tables in reverse dependency order
            tables_to_drop = [
                'agri_cart_items',
                'agri_carts', 
                'agri_order_items',
                'agri_orders',
                'agri_product_reviews',
                'agri_product_images',
                'agri_products',
                'agri_categories',
                'farms',
                'harvest_schedules'
            ]
            
            for table in tables_to_drop:
                try:
                    cursor.execute(f'DROP TABLE IF EXISTS {table} CASCADE')
                    self.stdout.write(f'Dropped table: {table}')
                except Exception as e:
                    self.stdout.write(f'Error dropping {table}: {e}')
            
            # Commit the changes
            connection.commit()
            
        self.stdout.write(self.style.SUCCESS('Database schema reset completed!'))
        self.stdout.write('Now run: python manage.py migrate agri_connect')


