# ChronoConnect API Documentation

## Overview

The ChronoConnect API is a comprehensive REST API built with Django REST Framework that powers the ChronoConnect ecosystem. It provides endpoints for user management, marketplace operations, agricultural commerce, logistics, payments, and notifications.

## Base URL

- **Development**: `http://localhost:8000/api/`
- **Production**: `https://api.chronoconnect.com/api/`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Obtaining Tokens

**POST** `/api/auth/token/`

Request body:
```json
{
    "username": "user@example.com",
    "password": "password123"
}
```

Response:
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Refreshing Tokens

**POST** `/api/auth/token/refresh/`

Request body:
```json
{
    "refresh": "your-refresh-token"
}
```

### Using Tokens

Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## API Endpoints

### 1. User Management (`/api/users/`)

#### User Registration
**POST** `/api/users/register/`
```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "phone_number": "+237612345678",
    "password": "securepassword123",
    "user_type": "customer",
    "first_name": "John",
    "last_name": "Doe"
}
```

#### User Login
**POST** `/api/users/login/`
```json
{
    "username": "john_doe",
    "password": "securepassword123"
}
```

#### User Profile
**GET** `/api/users/profile/`
**PUT** `/api/users/profile/`

#### Address Management
**GET** `/api/users/addresses/`
**POST** `/api/users/addresses/`
**PUT** `/api/users/addresses/{id}/`
**DELETE** `/api/users/addresses/{id}/`

#### Delivery Agents
**GET** `/api/users/delivery-agents/`
**GET** `/api/users/delivery-agents/{id}/`

#### Merchants & Farmers
**GET** `/api/users/merchants/`
**GET** `/api/users/farmers/`

### 2. Marketplace (`/api/marketplace/`)

#### Categories
**GET** `/api/marketplace/categories/`
**GET** `/api/marketplace/categories/{id}/`

#### Products
**GET** `/api/marketplace/products/`
**GET** `/api/marketplace/products/{id}/`
**POST** `/api/marketplace/products/` (Merchant only)
**PUT** `/api/marketplace/products/{id}/` (Merchant only)
**DELETE** `/api/marketplace/products/{id}/` (Merchant only)

Query parameters:
- `search`: Search in product name and description
- `category`: Filter by category ID
- `merchant`: Filter by merchant ID
- `min_price`, `max_price`: Price range
- `in_stock`: Filter by stock availability
- `on_sale`: Filter by sale status

#### Product Reviews
**GET** `/api/marketplace/products/{id}/reviews/`
**POST** `/api/marketplace/products/{id}/reviews/`

#### Cart Management
**GET** `/api/marketplace/cart/`
**POST** `/api/marketplace/cart/add/`
**PUT** `/api/marketplace/cart/update/{item_id}/`
**DELETE** `/api/marketplace/cart/remove/{item_id}/`

#### Orders
**GET** `/api/marketplace/orders/`
**POST** `/api/marketplace/orders/create/`
**GET** `/api/marketplace/orders/{id}/`
**PUT** `/api/marketplace/orders/{id}/request-delivery/`

### 3. AgriConnect (`/api/agri-connect/`)

#### Agri Categories
**GET** `/api/agri-connect/categories/`
**GET** `/api/agri-connect/categories/{id}/`

#### Agri Products
**GET** `/api/agri-connect/products/`
**GET** `/api/agri-connect/products/{id}/`
**POST** `/api/agri-connect/products/` (Farmer only)
**PUT** `/api/agri-connect/products/{id}/` (Farmer only)
**DELETE** `/api/agri-connect/products/{id}/` (Farmer only)

Query parameters:
- `search`: Search in product name and description
- `category`: Filter by category ID
- `farmer`: Filter by farmer ID
- `organic`: Filter by organic status
- `harvested_today`: Filter by harvest date
- `min_price`, `max_price`: Price range

#### Agri Product Reviews
**GET** `/api/agri-connect/products/{id}/reviews/`
**POST** `/api/agri-connect/products/{id}/reviews/`

#### Agri Cart Management
**GET** `/api/agri-connect/cart/`
**POST** `/api/agri-connect/cart/add/`
**PUT** `/api/agri-connect/cart/update/{item_id}/`
**DELETE** `/api/agri-connect/cart/remove/{item_id}/`

#### Agri Orders
**GET** `/api/agri-connect/orders/`
**POST** `/api/agri-connect/orders/create/`
**GET** `/api/agri-connect/orders/{id}/`
**PUT** `/api/agri-connect/orders/{id}/request-delivery/`

#### Farm Management
**GET** `/api/agri-connect/farms/`
**POST** `/api/agri-connect/farms/` (Farmer only)
**GET** `/api/agri-connect/farms/{id}/`
**PUT** `/api/agri-connect/farms/{id}/` (Farmer only)

#### Harvest Schedules
**GET** `/api/agri-connect/harvest-schedules/`
**POST** `/api/agri-connect/harvest-schedules/` (Farmer only)
**GET** `/api/agri-connect/harvest-schedules/{id}/`
**PUT** `/api/agri-connect/harvest-schedules/{id}/` (Farmer only)

### 4. Logistics (`/api/logistics/`)

#### Delivery Tasks
**GET** `/api/logistics/tasks/`
**GET** `/api/logistics/tasks/{id}/`
**PUT** `/api/logistics/tasks/{id}/accept/` (Delivery Agent only)
**PUT** `/api/logistics/tasks/{id}/update-status/` (Delivery Agent only)
**PUT** `/api/logistics/tasks/{id}/complete/` (Delivery Agent only)

#### Agent Tasks
**GET** `/api/logistics/agent/available-tasks/` (Delivery Agent only)
**GET** `/api/logistics/agent/current-tasks/` (Delivery Agent only)
**GET** `/api/logistics/agent/completed-tasks/` (Delivery Agent only)

#### Location Updates
**POST** `/api/logistics/agent/update-location/` (Delivery Agent only)

#### Agent Dashboard
**GET** `/api/logistics/agent/dashboard/` (Delivery Agent only)

#### Earnings & Ratings
**GET** `/api/logistics/agent/earnings/` (Delivery Agent only)
**GET** `/api/logistics/agent/ratings/` (Delivery Agent only)

### 5. Payments (`/api/payments/`)

#### Payment Methods
**GET** `/api/payments/methods/`

#### Process Payment
**POST** `/api/payments/process/`
```json
{
    "order_reference": "ORD-123456",
    "payment_method": "mobile_money",
    "amount": 15000,
    "provider": "mtn",
    "phone_number": "+237612345678"
}
```

#### Mobile Money Payment
**POST** `/api/payments/mobile-money/`
```json
{
    "order_reference": "ORD-123456",
    "provider": "mtn",
    "phone_number": "+237612345678",
    "amount": 15000
}
```

#### Cash on Delivery
**POST** `/api/payments/cash-on-delivery/`
```json
{
    "order_reference": "ORD-123456",
    "amount": 15000
}
```

#### Payment Status
**GET** `/api/payments/{payment_number}/status/`

#### Refunds
**POST** `/api/payments/refunds/`
**GET** `/api/payments/refunds/`

#### Settlements
**GET** `/api/payments/settlements/`
**POST** `/api/payments/settlements/request/`

### 6. Notifications (`/api/notifications/`)

#### User Notifications
**GET** `/api/notifications/`
**GET** `/api/notifications/{id}/`
**PUT** `/api/notifications/{id}/mark-read/`
**GET** `/api/notifications/unread-count/`

#### Notification Preferences
**GET** `/api/notifications/preferences/`
**PUT** `/api/notifications/preferences/`

#### Push Token Registration
**POST** `/api/notifications/push-token/`
```json
{
    "device_token": "device_token_here",
    "platform": "android"
}
```

## Error Handling

The API returns standard HTTP status codes and error messages in JSON format.

### Common Error Responses

**400 Bad Request**
```json
{
    "error": "Validation error",
    "details": {
        "field_name": ["Error message"]
    }
}
```

**401 Unauthorized**
```json
{
    "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden**
```json
{
    "detail": "You do not have permission to perform this action."
}
```

**404 Not Found**
```json
{
    "detail": "Not found."
}
```

**500 Internal Server Error**
```json
{
    "detail": "Internal server error."
}
```

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Response format:
```json
{
    "count": 100,
    "next": "http://api.example.com/endpoint/?page=3",
    "previous": "http://api.example.com/endpoint/?page=1",
    "results": [...]
}
```

## Filtering & Search

Most list endpoints support filtering and search:

### Text Search
- `search`: Search in relevant text fields

### Date Filtering
- `created_after`: Filter by creation date (ISO format)
- `created_before`: Filter by creation date (ISO format)

### Status Filtering
- `status`: Filter by status (varies by endpoint)

### Geographic Filtering
- `latitude`, `longitude`, `radius`: Filter by location proximity

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

The API supports webhooks for real-time notifications:

### Available Webhooks
- `order.created`: When a new order is created
- `order.status_changed`: When order status changes
- `payment.completed`: When payment is completed
- `delivery.task_assigned`: When delivery task is assigned
- `delivery.completed`: When delivery is completed

### Webhook Format
```json
{
    "event": "order.created",
    "timestamp": "2024-01-01T12:00:00Z",
    "data": {
        "order_id": "ORD-123456",
        "customer_id": "user-uuid",
        "total_amount": 15000
    }
}
```

## SDKs & Libraries

### Python
```bash
pip install chronoconnect-sdk
```

### JavaScript/TypeScript
```bash
npm install @chronoconnect/sdk
```

### React Native
```bash
npm install @chronoconnect/react-native
```

## Support

For API support and questions:
- **Documentation**: https://docs.chronoconnect.com
- **Email**: api-support@chronoconnect.com
- **Discord**: https://discord.gg/chronoconnect

## Changelog

### v1.0.0 (2024-01-01)
- Initial API release
- User management
- Marketplace functionality
- AgriConnect integration
- Logistics system
- Payment processing
- Notification system 