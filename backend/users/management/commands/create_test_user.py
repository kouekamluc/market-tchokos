from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a test user for authentication testing'

    def handle(self, *args, **options):
        # Check if test user already exists
        if User.objects.filter(phone_number='+237600000000').exists():
            self.stdout.write(
                self.style.WARNING('Test user already exists')
            )
            return

        # Create test user
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            phone_number='+237600000000',
            password='testpass123',
            first_name='Test',
            last_name='User',
            user_type='customer'
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created test user: {user.get_full_name()}')
        )
        self.stdout.write(f'Phone: {user.phone_number}')
        self.stdout.write(f'Password: testpass123') 