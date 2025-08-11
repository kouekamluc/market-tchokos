# ChronoConnect Development Guide

## 🚀 **Quick Start for Testing**

### **1. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (if not already done)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Start the backend server
python manage.py runserver 8000
```

### **2. Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Start the frontend development server
npm run dev
```

## 🔧 **Environment Configuration**

### **Backend (.env)**
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/chronoconnect

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True

# External APIs
MAPBOX_ACCESS_TOKEN=your-mapbox-token
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Mobile Money APIs (for production)
MTN_MOBILE_MONEY_API_KEY=your-mtn-api-key
ORANGE_MONEY_API_KEY=your-orange-api-key
MOOV_MONEY_API_KEY=your-moov-api-key
```

### **Frontend (.env)**
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Mapbox (for maps and geocoding)
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Feature Flags
VITE_ENABLE_PHONE_VERIFICATION=true
VITE_ENABLE_LOCATION_PICKER=true
```

## 🧪 **Testing the Implementation**

### **1. Test User Registration**
1. Navigate to `http://localhost:5173/register`
2. Fill out the registration form
3. Test phone verification (in development, the code is returned in the response)
4. Verify user is created and logged in

### **2. Test Location Picker**
1. After registration, try to save a location
2. Test the map interface
3. Verify location is saved to the database

### **3. Test API Endpoints**
```bash
# Test phone verification
curl -X POST http://localhost:8000/api/users/send-verification-code/ \
  -H "Content-Type: application/json" \
  -d '{"phone": "+237612345678"}'

# Test geocoding
curl -X POST http://localhost:8000/api/users/geocode/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"address": "Douala, Cameroon"}'
```

## 🐛 **Common Issues & Solutions**

### **401 Unauthorized Errors**
- **Cause**: User not authenticated or backend server not running
- **Solution**: 
  - Ensure backend server is running on port 8000
  - Check if user is logged in
  - Verify JWT token is valid

### **404 Route Errors**
- **Cause**: Route not defined in App.tsx
- **Solution**: Add missing route to the router configuration

### **CORS Errors**
- **Cause**: Frontend trying to access backend from different origin
- **Solution**: Ensure CORS is properly configured in Django settings

### **Database Connection Errors**
- **Cause**: PostgreSQL not running or wrong credentials
- **Solution**: 
  - Start PostgreSQL service
  - Check database credentials in .env
  - Ensure database exists

## 📱 **Testing User Flows**

### **Customer Flow**
1. **Registration**: `/register` → Phone verification → Complete profile
2. **Location Setup**: Save delivery locations with landmarks
3. **Browse Products**: `/marketplace` or `/agri-connect`
4. **Add to Cart**: Test shopping cart functionality
5. **Checkout**: `/checkout` → Select location → Payment method
6. **Order Tracking**: `/order/:orderId`

### **Merchant Flow**
1. **Registration**: Register as merchant
2. **Dashboard**: `/merchant` → Add products → Manage orders
3. **Order Management**: View and fulfill orders
4. **Request Delivery**: Test delivery assignment

### **Delivery Agent Flow**
1. **Registration**: Register as delivery agent
2. **Dashboard**: `/delivery-agent` → View available tasks
3. **Task Management**: Accept and complete delivery tasks
4. **Location Updates**: Update current location

## 🔍 **Debugging Tips**

### **Frontend Debugging**
```javascript
// Check authentication status
console.log('Token:', localStorage.getItem('access_token'));

// Check API responses
// Add console.log in API calls to see responses

// Check React Query cache
// Use React Query DevTools in browser
```

### **Backend Debugging**
```python
# Check Django logs
tail -f backend/logs/django.log

# Check database
python manage.py dbshell

# Test API endpoints
python manage.py shell
```

### **Network Debugging**
- Use browser DevTools Network tab
- Check request/response headers
- Verify API endpoints are correct

## 🚀 **Next Steps**

### **Week 2 Priorities**
1. **Complete Marketplace Core**
   - Product management system
   - Shopping cart persistence
   - Basic checkout flow

2. **Order Management**
   - Order creation
   - Order status tracking
   - Basic payment integration

3. **Delivery System Foundation**
   - Delivery task creation
   - Basic agent assignment
   - Delivery status updates

### **Testing Checklist**
- [ ] User registration with phone verification
- [ ] Location picker functionality
- [ ] Product browsing and cart
- [ ] Basic checkout flow
- [ ] API error handling
- [ ] Authentication flow
- [ ] Route navigation

## 📞 **Support**

If you encounter issues:
1. Check the browser console for errors
2. Check the backend logs
3. Verify environment configuration
4. Test API endpoints directly
5. Check database connectivity

The implementation is designed to be robust and provide clear error messages for debugging. 