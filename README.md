# ChronoConnect - Pin and Go Delivery Platform

A comprehensive delivery platform that connects customers, merchants, farmers, and delivery agents through a modern web application.

## 🚀 Features

### Core Platform
- **Multi-role User System**: Customers, Merchants, Farmers, Delivery Agents, and Admins
- **Real-time Order Tracking**: Live updates on delivery status
- **Payment Integration**: Mobile money and card payments
- **Geospatial Features**: Location-based services with PostGIS
- **Notification System**: Real-time notifications for all users

### Marketplace
- **Product Catalog**: Browse and search products
- **Shopping Cart**: Add, update, and manage cart items
- **Order Management**: Complete order lifecycle
- **Reviews & Ratings**: Customer feedback system

### AgriConnect
- **Fresh Produce**: Direct farm-to-customer delivery
- **Harvest Scheduling**: Optimized delivery timing
- **Organic Certification**: Verified organic products
- **Local Sourcing**: 5km radius delivery

### Logistics
- **Delivery Task Management**: Assign and track deliveries
- **Route Optimization**: Efficient delivery routes
- **Agent Location Tracking**: Real-time GPS updates
- **Performance Analytics**: Delivery metrics and earnings

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **UI Library**: Shadcn/ui components
- **State Management**: React Query for server state
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Port**: 8090

### Backend (Django + DRF)
- **Framework**: Django 4.2 with Django REST Framework
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT tokens
- **Geospatial**: GeoDjango with OSGeo4W
- **Port**: 8000

## 🛠️ Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+
- OSGeo4W (for geospatial features)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd pin-and-go-delivery
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy env.example .env

# Edit .env with your database settings
# DB_PASSWORD=kouekam
# DB_PORT=5433

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start backend
python manage.py runserver 8000
```

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
copy env.example .env

# Edit .env with API URL
# VITE_API_BASE_URL=http://localhost:8000/api

# Start frontend
npm run dev
```

### 4. Quick Start Script (Windows)
```bash
# Run the integration script
start-integration.bat
```

## 📁 Project Structure

```
pin-and-go-delivery/
├── backend/                 # Django backend
│   ├── chronoconnect/      # Main Django project
│   ├── users/              # User management
│   ├── marketplace/        # E-commerce features
│   ├── agri_connect/       # Agricultural marketplace
│   ├── logistics/          # Delivery management
│   ├── payments/           # Payment processing
│   ├── notifications/      # Notification system
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts
│   │   └── lib/            # Utilities and API client
│   └── package.json        # Node.js dependencies
└── INTEGRATION_GUIDE.md    # Detailed integration guide
```

## 🔧 Configuration

### Backend Environment Variables
```bash
# Database
DB_NAME=chronoconnect
DB_USER=postgres
DB_PASSWORD=kouekam
DB_HOST=localhost
DB_PORT=5433

# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Redis (for caching and Celery)
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

### Frontend Environment Variables
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=ChronoConnect
VITE_APP_VERSION=1.0.0

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token-here

# Feature Flags
VITE_ENABLE_AGRI_CONNECT=true
VITE_ENABLE_MARKETPLACE=true
VITE_ENABLE_LOGISTICS=true
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_NOTIFICATIONS=true

# Development Settings
VITE_DEBUG=true
VITE_LOG_LEVEL=info
```

## 🧪 Testing the Integration

### 1. Access the Test Page
Navigate to: http://localhost:8090/test-integration

### 2. Test Authentication
- Try logging in with valid credentials
- Check if JWT tokens are stored correctly
- Test logout functionality

### 3. Test API Calls
- Once authenticated, categories and products should load
- Check browser dev tools for API requests
- Verify CORS is working correctly

### 4. Check Backend Admin
- Access: http://localhost:8000/admin
- Login with superuser credentials
- Verify data is being created/updated

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/token/` - Login
- `POST /api/auth/token/refresh/` - Refresh token
- `GET /api/auth/user/` - Get current user

### Marketplace
- `GET /api/marketplace/categories/` - Get categories
- `GET /api/marketplace/products/` - Get products
- `GET /api/marketplace/cart/` - Get cart
- `POST /api/marketplace/orders/` - Create order

### AgriConnect
- `GET /api/agri-connect/categories/` - Get agri categories
- `GET /api/agri-connect/products/` - Get agri products

### Logistics
- `GET /api/logistics/tasks/available/` - Get available tasks
- `GET /api/logistics/tasks/my-tasks/` - Get my tasks

### Users
- `GET /api/users/addresses/` - Get user addresses
- `POST /api/users/addresses/` - Create address

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ALLOWED_ORIGINS in settings.py
   - Ensure frontend URL is included

2. **Database Connection**
   - Verify PostgreSQL is running
   - Check database credentials in .env

3. **GDAL/GeoDjango Issues**
   - Ensure OSGeo4W is installed
   - Check GDAL library paths in settings.py

4. **JWT Token Issues**
   - Clear localStorage in browser
   - Check token expiration settings

5. **API 404 Errors**
   - Verify URL patterns in urls.py
   - Check app is in INSTALLED_APPS

### Debug Commands

```bash
# Backend
python manage.py check
python manage.py showmigrations
python manage.py shell

# Frontend
npm run lint
npm run build
```

## 📚 Documentation

- [Integration Guide](INTEGRATION_GUIDE.md) - Detailed integration instructions
- [API Documentation](backend/API_DOCUMENTATION.md) - Backend API reference
- [Frontend Components](frontend/src/components/) - UI component library

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the integration guide
3. Check browser dev tools for errors
4. Verify environment variables
5. Check database migrations

## 🎯 Roadmap

- [ ] Real-time notifications with WebSockets
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced payment gateways
- [ ] AI-powered route optimization
- [ ] Blockchain integration for transparency 