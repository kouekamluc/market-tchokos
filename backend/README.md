# ChronoConnect Backend - Django 5

A comprehensive Django 5 backend for the ChronoConnect ecosystem, designed to digitize and empower commerce in Cameroon through geolocation-first marketplace, agricultural commerce, and integrated logistics.

## 🚀 Features

### Core Platform
- **Multi-Vertical Marketplace**: Unified platform for retail and agricultural commerce
- **Geolocation-First**: Map-based location services with PostGIS integration
- **Integrated Logistics**: Complete delivery management system
- **Multi-Channel Payments**: Mobile money, cash on delivery, and traditional payments
- **Real-time Notifications**: Push, email, and SMS notifications

### User Management
- **Multi-Role Users**: Customers, Merchants, Farmers, Delivery Agents, Admins
- **Geospatial Profiles**: Location-based user profiles with distance calculations
- **Verification System**: Document verification for merchants and farmers
- **Session Management**: User session tracking and analytics

### Marketplace (Retail)
- **Product Management**: Categories, products, variants, images
- **Advanced Search**: Filtering, sorting, geospatial search
- **Shopping Cart**: Persistent cart with real-time updates
- **Order Management**: Complete order lifecycle
- **Reviews & Ratings**: Customer feedback system

### AgriConnect (Agricultural)
- **Farm Management**: Farm profiles, locations, certifications
- **Harvest Scheduling**: Crop planning and harvest tracking
- **Freshness Tracking**: Harvest date and freshness indicators
- **Organic Certification**: Organic farming support
- **Agricultural Categories**: Specialized product categories

### Logistics Engine
- **Delivery Task Management**: Complete delivery workflow
- **Real-time Tracking**: Agent location updates and route optimization
- **Agent Management**: Availability, ratings, earnings
- **Delivery Zones**: Geographic delivery area management
- **Schedule Management**: Agent availability scheduling

### Payment System
- **Mobile Money Integration**: MTN, Orange, Moov Money support
- **Cash on Delivery**: COD payment processing
- **Settlement Management**: Automated settlements for merchants/farmers/agents
- **Refund Processing**: Complete refund workflow
- **Payment Analytics**: Transaction history and reporting

### Notification System
- **Multi-Channel**: Push, email, and SMS notifications
- **Template System**: Reusable notification templates
- **Preference Management**: User notification preferences
- **Bulk Notifications**: Mass notification capabilities
- **Delivery Tracking**: Real-time delivery status updates

## 🛠 Technology Stack

- **Django 5.2.4**: Latest Django LTS framework
- **Django REST Framework 3.16.0**: API development
- **PostgreSQL with PostGIS**: Geospatial database
- **Redis**: Caching and Celery broker
- **Celery**: Background task processing
- **JWT Authentication**: Secure API authentication
- **Docker**: Containerized deployment

## 📋 Requirements

- Python 3.11+
- PostgreSQL 13+ with PostGIS extension
- Redis 6+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

Use the provided setup script for easy installation:

```bash
cd backend
python setup.py
```

This script will:
- Check dependencies
- Install requirements
- Set up environment variables
- Create database migrations
- Run migrations
- Create a superuser
- Collect static files
- Run basic tests

### Option 2: Manual Setup

#### 1. Clone and Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=chronoconnect
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Mapbox
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Mobile Money APIs
MTN_MOMO_API_URL=your-mtn-api-url
MTN_MOMO_API_KEY=your-mtn-api-key
ORANGE_MONEY_API_URL=your-orange-api-url
ORANGE_MONEY_API_KEY=your-orange-api-key
MOOV_MONEY_API_URL=your-moov-api-url
MOOV_MONEY_API_KEY=your-moov-api-key
```

### 3. Database Setup

```bash
# Create PostgreSQL database with PostGIS
createdb chronoconnect
psql chronoconnect -c "CREATE EXTENSION postgis;"

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 4. Start Services

```bash
# Start Redis (if not using Docker)
redis-server

# Start Celery worker (in new terminal)
celery -A chronoconnect worker -l info

# Start Celery beat (in new terminal)
celery -A chronoconnect beat -l info

# Start Django development server
python manage.py runserver
```

### 5. Docker Setup (Alternative)

```bash
# Build and start all services
docker-compose up --build

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser
```

## 📚 API Documentation

Comprehensive API documentation is available in `API_DOCUMENTATION.md` with detailed endpoint descriptions, request/response examples, and integration guides.

## 🔧 Admin Interface

The Django admin interface provides comprehensive management capabilities for all aspects of the ChronoConnect platform:

### Access Admin Interface
- **URL**: `http://localhost:8000/admin/`
- **Login**: Use the superuser credentials created during setup

### Available Admin Sections

#### User Management
- **Users**: Manage all user accounts with role-based filtering
- **User Addresses**: Manage delivery addresses
- **User Verifications**: Handle document verification requests
- **User Sessions**: Monitor user activity

#### Marketplace Management
- **Categories**: Manage product categories
- **Products**: Full product management with image uploads
- **Product Images**: Manage product galleries
- **Product Variants**: Handle product variations
- **Product Reviews**: Moderate customer reviews
- **Carts**: Monitor shopping carts
- **Orders**: Complete order management

#### AgriConnect Management
- **Agri Categories**: Manage agricultural categories
- **Agri Products**: Specialized agricultural product management
- **Farms**: Farm profile management
- **Harvest Schedules**: Crop planning and scheduling
- **Agri Orders**: Agricultural order management

#### Logistics Management
- **Delivery Tasks**: Complete delivery workflow management
- **Agent Locations**: Real-time agent tracking
- **Delivery Routes**: Route optimization
- **Delivery Zones**: Geographic zone management
- **Agent Earnings**: Financial management for agents
- **Agent Ratings**: Performance monitoring

#### Payment Management
- **Payments**: Transaction monitoring
- **Mobile Money Transactions**: Mobile payment tracking
- **Payment Methods**: Payment provider configuration
- **Settlements**: Automated settlement management
- **Refunds**: Refund processing

#### Notification Management
- **Notifications**: System notification management
- **Notification Templates**: Template management
- **Push Notifications**: Mobile push notification tracking
- **Email Notifications**: Email delivery monitoring
- **SMS Notifications**: SMS delivery tracking
- **Notification Preferences**: User preference management

### Authentication

All API endpoints require JWT authentication except where noted:

```bash
# Login
POST /api/auth/token/
{
    "phone_number": "+237612345678",
    "password": "your-password"
}

# Use token in headers
Authorization: Bearer <access_token>
```

### Core Endpoints

#### Users
- `GET /api/users/profile/` - Get user profile
- `PUT /api/users/profile/` - Update profile
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login
- `GET /api/users/delivery-agents/` - List delivery agents
- `GET /api/users/merchants-farmers/` - List merchants/farmers

#### Marketplace
- `GET /api/marketplace/categories/` - List categories
- `GET /api/marketplace/products/` - List products
- `GET /api/marketplace/products/{id}/` - Product details
- `GET /api/marketplace/cart/` - Get cart
- `POST /api/marketplace/cart/` - Add to cart
- `GET /api/marketplace/orders/` - List orders
- `POST /api/marketplace/orders/` - Create order

#### AgriConnect
- `GET /api/agri-connect/categories/` - List agri categories
- `GET /api/agri-connect/products/` - List agri products
- `GET /api/agri-connect/farms/` - List farms
- `GET /api/agri-connect/harvest-schedules/` - List harvest schedules

#### Logistics
- `GET /api/logistics/tasks/` - List delivery tasks
- `GET /api/logistics/agent/available-tasks/` - Available tasks
- `POST /api/logistics/agent/update-location/` - Update location
- `POST /api/logistics/agent/accept-task/` - Accept task
- `POST /api/logistics/agent/tasks/{id}/complete/` - Complete task

#### Payments
- `GET /api/payments/payments/` - List payments
- `POST /api/payments/payments/process/` - Process payment
- `POST /api/payments/mobile-money/process/` - Mobile money payment
- `GET /api/payments/payment-methods/` - List payment methods

#### Notifications
- `GET /api/notifications/notifications/` - List notifications
- `POST /api/notifications/notifications/create/` - Create notification
- `POST /api/notifications/notifications/mark-read/` - Mark as read
- `GET /api/notifications/notifications/unread-count/` - Unread count

## 🏗 Project Structure

```
backend/
├── chronoconnect/          # Main project settings
│   ├── settings.py        # Django settings
│   ├── urls.py           # Main URL configuration
│   ├── celery.py         # Celery configuration
│   └── wsgi.py           # WSGI configuration
├── users/                 # User management app
│   ├── models.py         # User, Address, Verification models
│   ├── serializers.py    # User serializers
│   ├── views.py          # User API views
│   ├── admin.py          # Django admin interface
│   └── urls.py           # User URL patterns
├── marketplace/           # Retail marketplace app
│   ├── models.py         # Product, Order, Cart models
│   ├── serializers.py    # Marketplace serializers
│   ├── views.py          # Marketplace API views
│   ├── admin.py          # Django admin interface
│   └── urls.py           # Marketplace URL patterns
├── agri_connect/          # Agricultural marketplace app
│   ├── models.py         # Agri products, farms, harvest models
│   ├── serializers.py    # Agri serializers
│   ├── views.py          # Agri API views
│   ├── admin.py          # Django admin interface
│   └── urls.py           # Agri URL patterns
├── logistics/             # Delivery management app
│   ├── models.py         # Delivery tasks, routes, zones
│   ├── serializers.py    # Logistics serializers
│   ├── views.py          # Logistics API views
│   ├── admin.py          # Django admin interface
│   └── urls.py           # Logistics URL patterns
├── payments/              # Payment processing app
│   ├── models.py         # Payment, settlement, refund models
│   ├── serializers.py    # Payment serializers
│   ├── views.py          # Payment API views
│   ├── admin.py          # Django admin interface
│   └── urls.py           # Payment URL patterns
├── notifications/         # Notification system app
│   ├── models.py         # Notification, templates, preferences
│   ├── serializers.py    # Notification serializers
│   ├── views.py          # Notification API views
│   ├── admin.py          # Django admin interface
│   └── urls.py           # Notification URL patterns
├── logs/                  # Application logs
├── media/                 # User uploaded files
├── static/                # Static files
├── requirements.txt       # Python dependencies
├── setup.py              # Automated setup script
├── API_DOCUMENTATION.md   # Comprehensive API docs
├── docker-compose.yml     # Docker services
├── Dockerfile            # Docker configuration
└── README.md             # This file
```

## 🔧 Configuration

### Business Logic Constants

Key business parameters in `settings.py`:

```python
# Commission and pricing
COMMISSION_RATE = 0.12  # 12% commission
DELIVERY_AGENT_BASE_RATE = 500  # 500 CFA base rate
DELIVERY_AGENT_COMMISSION_RATE = 0.30  # 30% of delivery fee
FREE_DELIVERY_THRESHOLD = 10000  # 10,000 CFA for free delivery
DEFAULT_DELIVERY_RADIUS = 5000  # 5km default radius
```

### Geospatial Configuration

PostGIS integration for location services:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'chronoconnect',
        # ... other settings
    }
}
```

### Celery Configuration

Background task processing:

```python
CELERY_BROKER_URL = 'redis://127.0.0.1:6379/0'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/0'
CELERY_TIMEZONE = 'Africa/Douala'
```

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users
python manage.py test marketplace
python manage.py test agri_connect
python manage.py test logistics
python manage.py test payments
python manage.py test notifications
```

## 📊 Monitoring

### Logging

Configured logging in `settings.py`:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
```

### Performance Monitoring

- Django Debug Toolbar (development)
- Cacheops for query optimization
- Redis caching for improved performance

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set `DEBUG=False`
   - Configure production database
   - Set secure `SECRET_KEY`
   - Configure production email settings

2. **Database**
   - Run migrations
   - Create database indexes
   - Configure database backups

3. **Static Files**
   ```bash
   python manage.py collectstatic
   ```

4. **Security**
   - Configure HTTPS
   - Set up CORS properly
   - Configure rate limiting
   - Set up monitoring

### Docker Production

```bash
# Build production image
docker build -t chronoconnect:latest .

# Run with production settings
docker run -d \
  -e DEBUG=False \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -p 8000:8000 \
  chronoconnect:latest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is proprietary software for ChronoConnect.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### Django 5.2.4 Upgrade (Latest)
- Upgraded to Django 5.2.4 (Latest LTS)
- Updated all dependencies to latest compatible versions
- Enhanced API serializers and views with comprehensive admin interfaces
- Improved geospatial functionality with PostGIS integration
- Added comprehensive notification system with multi-channel support
- Enhanced payment processing with mobile money integration
- Improved logistics management with real-time tracking
- Added automated setup script for easy installation
- Comprehensive API documentation
- Enhanced business logic with configurable constants

### Previous Versions
- Django 5.0.2 implementation
- Basic marketplace functionality
- User management system
- Payment integration
- Delivery management 