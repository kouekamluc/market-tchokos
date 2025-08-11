# ChronoConnect Quick Start Guide

## 🚀 Immediate Next Steps (This Week)

Based on your comprehensive project plan and current codebase analysis, here are the immediate steps to begin implementing ChronoConnect:

### Step 1: Environment Setup (Day 1)

#### 1.1 Configure Environment Variables
```bash
# Backend (.env)
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=chronoconnect
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Mapbox (Critical for location features)
MAPBOX_ACCESS_TOKEN=your-mapbox-token

# Mobile Money APIs (For payments)
MTN_MOMO_API_URL=your-mtn-api-url
MTN_MOMO_API_KEY=your-mtn-api-key
ORANGE_MONEY_API_URL=your-orange-api-url
ORANGE_MONEY_API_KEY=your-orange-api-key

# SMS Verification (For phone verification)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
```

```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000/api
VITE_MAPBOX_ACCESS_TOKEN=your-mapbox-token-here
VITE_APP_NAME=ChronoConnect
VITE_APP_VERSION=1.0.0
```

#### 1.2 Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

#### 1.3 Database Setup
```bash
# Create PostgreSQL database with PostGIS
createdb chronoconnect
psql chronoconnect -c "CREATE EXTENSION postgis;"

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Step 2: Core Location System (Day 2-3)

#### 2.1 Backend Location API
Create the location management endpoints:

```python
# backend/users/views.py - Add location views
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import UserAddress
from .serializers import UserAddressSerializer

class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = UserAddressSerializer
    
    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def geocode(self, request):
        # Implement geocoding using Mapbox
        pass
```

#### 2.2 Frontend Location Integration
Connect the LocationPicker component to the backend:

```typescript
// frontend/src/hooks/useLocation.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useLocation() {
  const { data: savedLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get('/locations/').then(res => res.data)
  });

  const saveLocation = useMutation({
    mutationFn: (location: any) => api.post('/locations/', location),
    onSuccess: () => {
      // Invalidate and refetch locations
    }
  });

  return { savedLocations, saveLocation };
}
```

### Step 3: User Authentication Enhancement (Day 4-5)

#### 3.1 Phone Verification System
```python
# backend/users/views.py - Add phone verification
import random
from django.core.cache import cache

@api_view(['POST'])
def send_verification_code(request):
    phone = request.data.get('phone')
    code = str(random.randint(100000, 999999))
    
    # Store code in cache for 10 minutes
    cache.set(f"verification_{phone}", code, 600)
    
    # Send SMS using Twilio
    # twilio_client.messages.create(...)
    
    return Response({'message': 'Verification code sent'})

@api_view(['POST'])
def verify_phone(request):
    phone = request.data.get('phone')
    code = request.data.get('code')
    
    stored_code = cache.get(f"verification_{phone}")
    if stored_code == code:
        # Mark user as verified
        user = request.user
        user.is_verified = True
        user.save()
        return Response({'message': 'Phone verified successfully'})
    
    return Response({'error': 'Invalid code'}, status=400)
```

#### 3.2 Enhanced Registration Form
```typescript
// frontend/src/components/RegisterForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';

export function RegisterForm() {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data: any) => {
    if (step === 1) {
      // Send verification code
      await api.post('/auth/send-verification-code/', { phone: data.phone });
      setStep(2);
    } else if (step === 2) {
      // Verify code and complete registration
      await api.post('/auth/verify-phone/', { 
        phone: data.phone, 
        code: verificationCode 
      });
      // Complete registration
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 1 && (
        <>
          <Input {...register('phone')} placeholder="Phone Number" />
          <Input {...register('email')} placeholder="Email" />
          <Select {...register('user_type')}>
            <option value="customer">Customer</option>
            <option value="merchant">Merchant</option>
            <option value="farmer">Farmer</option>
            <option value="delivery_agent">Delivery Agent</option>
          </Select>
          <Button type="submit">Send Verification Code</Button>
        </>
      )}
      
      {step === 2 && (
        <>
          <Input 
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
          />
          <Button type="submit">Verify & Complete Registration</Button>
        </>
      )}
    </form>
  );
}
```

### Step 4: Basic Marketplace (Day 6-7)

#### 4.1 Product Management
```python
# backend/marketplace/models.py - Enhance product model
class Product(models.Model):
    merchant = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    images = models.ManyToManyField(ProductImage)
    location = models.PointField()  # Store location
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### 4.2 Product Display
```typescript
// frontend/src/components/ProductCard.tsx
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    merchant: {
      name: string;
      rating: number;
    };
  };
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-green-600 font-bold">${product.price}</p>
        <p className="text-sm text-gray-600">by {product.merchant.name}</p>
        <Button onClick={() => onAddToCart(product.id)}>
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
```

## 🎯 Week 1 Deliverables

By the end of Week 1, you should have:

### ✅ Completed
- [ ] Environment setup and configuration
- [ ] Database setup with PostGIS
- [ ] Location picker component working with Mapbox
- [ ] Phone verification system
- [ ] Enhanced user registration with role selection
- [ ] Basic product display functionality
- [ ] Location saving and retrieval

### 🔄 In Progress
- [ ] User profile management
- [ ] Product creation interface
- [ ] Shopping cart functionality
- [ ] Basic order management

## 🚀 Week 2 Focus Areas

### Priority 1: Complete Marketplace Core
- Product CRUD operations
- Category management
- Shopping cart system
- Basic checkout flow

### Priority 2: Order Management
- Order creation
- Order status tracking
- Basic payment integration

### Priority 3: Delivery System Foundation
- Delivery task creation
- Basic agent assignment
- Delivery status updates

## 🛠️ Development Commands

### Backend Development
```bash
# Start development server
python manage.py runserver 8000

# Create new app
python manage.py startapp new_app

# Make migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Shell
python manage.py shell
```

### Frontend Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

### Database Management
```bash
# Connect to database
psql -U postgres -d chronoconnect

# Backup database
pg_dump chronoconnect > backup.sql

# Restore database
psql -U postgres -d chronoconnect < backup.sql
```

## 🔧 Configuration Checklist

### Required Services
- [ ] **Mapbox Account**: Get access token for maps
- [ ] **Twilio Account**: For SMS verification
- [ ] **PostgreSQL**: With PostGIS extension
- [ ] **Mobile Money APIs**: MTN, Orange, Moov
- [ ] **Payment Gateway**: Local payment processor

### Environment Variables
- [ ] Backend `.env` file configured
- [ ] Frontend `.env` file configured
- [ ] Database connection working
- [ ] Mapbox integration working
- [ ] SMS verification working

### Development Tools
- [ ] Git repository set up
- [ ] IDE/Editor configured
- [ ] Database client installed
- [ ] API testing tool (Postman/Insomnia)
- [ ] Browser dev tools ready

## 🎯 Success Criteria

### Week 1 Success
- [ ] User can register with phone verification
- [ ] User can save and select delivery locations
- [ ] Basic product browsing works
- [ ] Location picker integrates with backend
- [ ] Database stores all data correctly

### Week 2 Success
- [ ] Complete product management
- [ ] Shopping cart functionality
- [ ] Basic order creation
- [ ] Payment integration started
- [ ] Delivery task creation

## 🚨 Common Issues & Solutions

### Mapbox Integration
**Issue**: Map not loading
**Solution**: Check Mapbox access token and ensure it's valid

### Database Connection
**Issue**: PostGIS extension not found
**Solution**: Install PostGIS: `sudo apt-get install postgresql-12-postgis-3`

### CORS Errors
**Issue**: Frontend can't connect to backend
**Solution**: Check CORS settings in Django settings.py

### Phone Verification
**Issue**: SMS not sending
**Solution**: Verify Twilio credentials and phone number format

## 📞 Next Steps

1. **Start with Step 1**: Set up your environment and get the basic system running
2. **Focus on Location System**: This is your core differentiator
3. **Build Authentication**: Ensure secure user registration and verification
4. **Create Basic Marketplace**: Get products displaying and cart working
5. **Iterate Quickly**: Test with real users and gather feedback

Remember: **Start simple, iterate fast, and focus on the core value proposition** - geolocation-based delivery. Everything else can be built on top of this foundation.

Good luck with your ChronoConnect implementation! 🚀 