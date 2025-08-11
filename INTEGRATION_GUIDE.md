# ChronoConnect Frontend-Backend Integration Guide

## Overview
This guide explains how to integrate the React frontend with the Django backend for the ChronoConnect delivery platform.

## Architecture

### Frontend (React + Vite)
- **Port**: 8090 (configurable in vite.config.ts)
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components
- **State Management**: React Query for server state
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS

### Backend (Django + DRF)
- **Port**: 8000 (configurable in settings.py)
- **Framework**: Django 4.2 with Django REST Framework
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT tokens
- **CORS**: django-cors-headers

## Setup Instructions

### 1. Backend Setup

#### Environment Configuration
Create `.env` file in the backend directory:
```bash
# Database Configuration
DB_NAME=chronoconnect
DB_USER=postgres
DB_PASSWORD=kouekam
DB_HOST=localhost
DB_PORT=5433

# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Redis Configuration (for caching and Celery)
REDIS_URL=redis://127.0.0.1:6379

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Mapbox Configuration
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Mobile Money API Keys
MTN_MOMO_API_URL=your-mtn-api-url
MTN_MOMO_API_KEY=your-mtn-api-key
ORANGE_MONEY_API_URL=your-orange-api-url
ORANGE_MONEY_API_KEY=your-orange-api-key
MOOV_MONEY_API_URL=your-moov-api-url
MOOV_MONEY_API_KEY=your-moov-api-key
```

#### Database Setup
```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
```

#### Run Backend
```bash
cd backend
python manage.py runserver 8000
```

### 2. Frontend Setup

#### Environment Configuration
Copy `env.example` to `.env` in the frontend directory:
```bash
cd frontend
cp env.example .env
```

Edit `.env` with your configuration:
```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token-here
```

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Run Frontend
```bash
npm run dev
```

## API Integration

### Authentication Flow
1. User logs in via `/api/auth/token/`
2. Frontend stores JWT tokens in localStorage
3. API client automatically includes Authorization header
4. Token refresh handled automatically

### API Endpoints

#### Authentication
- `POST /api/auth/token/` - Login
- `POST /api/auth/token/refresh/` - Refresh token
- `GET /api/auth/user/` - Get current user

#### Users
- `GET /api/users/addresses/` - Get user addresses
- `POST /api/users/addresses/` - Create address
- `PATCH /api/users/addresses/{id}/` - Update address
- `DELETE /api/users/addresses/{id}/` - Delete address

#### Marketplace
- `GET /api/marketplace/categories/` - Get categories
- `GET /api/marketplace/products/` - Get products
- `GET /api/marketplace/products/{id}/` - Get product details
- `GET /api/marketplace/cart/` - Get cart
- `POST /api/marketplace/cart/add/` - Add to cart
- `POST /api/marketplace/orders/` - Create order

#### AgriConnect
- `GET /api/agri-connect/categories/` - Get agri categories
- `GET /api/agri-connect/products/` - Get agri products
- `GET /api/agri-connect/products/{id}/` - Get agri product details

#### Logistics
- `GET /api/logistics/tasks/available/` - Get available tasks
- `GET /api/logistics/tasks/my-tasks/` - Get my tasks
- `POST /api/logistics/tasks/{id}/accept/` - Accept task
- `PATCH /api/logistics/tasks/{id}/status/` - Update task status

#### Payments
- `POST /api/payments/process/` - Process payment
- `GET /api/payments/history/` - Get payment history

#### Notifications
- `GET /api/notifications/` - Get notifications
- `POST /api/notifications/{id}/mark-read/` - Mark as read

## Development Workflow

### 1. Start Both Services
```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. API Development
- Backend API changes require restart
- Frontend hot-reloads automatically
- Use browser dev tools to monitor API calls
- Check Django admin at http://localhost:8000/admin/

### 3. Database Changes
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 4. Frontend Build
```bash
cd frontend
npm run build
```

## CORS Configuration

The backend is configured to allow requests from:
- http://localhost:8090 (Frontend default)
- http://127.0.0.1:8090
- http://localhost:3000 (Alternative)
- http://127.0.0.1:3000

## Environment Variables

### Frontend (.env)
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_MAPBOX_ACCESS_TOKEN`: Mapbox token for maps
- `VITE_APP_NAME`: Application name
- `VITE_DEBUG`: Enable debug mode

### Backend (.env)
- Database configuration
- Django secret key
- Email settings
- API keys for external services

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ALLOWED_ORIGINS in settings.py
   - Ensure frontend URL is included

2. **Database Connection**
   - Verify PostgreSQL is running
   - Check database credentials in .env

3. **JWT Token Issues**
   - Clear localStorage in browser
   - Check token expiration settings

4. **API 404 Errors**
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

## Production Deployment

### Backend
- Set DEBUG=False
- Configure production database
- Set up static file serving
- Configure HTTPS

### Frontend
- Build with `npm run build`
- Serve static files
- Configure environment variables
- Set up reverse proxy

## Security Considerations

1. **JWT Tokens**
   - Store in httpOnly cookies in production
   - Implement token refresh
   - Set appropriate expiration times

2. **CORS**
   - Restrict allowed origins in production
   - Use HTTPS in production

3. **API Security**
   - Implement rate limiting
   - Add request validation
   - Use HTTPS for all API calls

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Monitoring

- Django admin for backend monitoring
- Browser dev tools for frontend debugging
- Django logging configuration
- React Query dev tools

## Support

For issues:
1. Check the logs in backend/logs/
2. Use browser dev tools for frontend issues
3. Verify environment variables
4. Check database migrations 