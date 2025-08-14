import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from 'next-themes'
import { LoginForm } from './components/LoginForm'
import { AuthProvider } from './contexts/AuthContext'
import { LocationProvider } from './contexts/LocationContext'
import { OrderProvider } from './contexts/OrderContext'
import { CartProvider } from './contexts/CartContext'
import { 
  ProtectedRoute, 
  CustomerRoute, 
  MerchantRoute, 
  FarmerRoute, 
  DeliveryAgentRoute,
  AuthenticatedRoute 
} from './components/ProtectedRoute'

// Pages
import Index from './pages/Index'
import About from './pages/About'
import Contact from './pages/Contact'
import Help from './pages/Help'
import Terms from './pages/Terms'
import Careers from './pages/Careers'
import AgriConnect from './pages/AgriConnect'

import Checkout from './pages/Checkout'
import OrderTracking from './pages/OrderTracking'
import NotFound from './pages/NotFound'
import TestIntegration from './pages/TestIntegration'
import MerchantDashboard from './pages/MerchantDashboard'
import FarmerDashboard from './pages/FarmerDashboard'
import DeliveryAgent from './pages/DeliveryAgent'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import UserDashboard from './pages/UserDashboard'
import Orders from './pages/Orders'

import { RegisterForm } from './components/RegisterForm'
// Components
import Header from './components/Header'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <LocationProvider>
            <OrderProvider>
              <CartProvider>
                <Router>
                <div className="min-h-screen bg-background">
                  <Header />
                  <main>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/help" element={<Help />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/careers" element={<Careers />} />
                      <Route path="/login" element={<LoginForm />} />
                      <Route path="/register" element={<RegisterForm />} />
                      
                      {/* Protected Routes - Require Authentication */}
                      <Route path="/agri-connect" element={
                        <AuthenticatedRoute>
                          <AgriConnect />
                        </AuthenticatedRoute>
                      } />

                      <Route path="/product/:id" element={
                        <AuthenticatedRoute>
                          <ProductDetail />
                        </AuthenticatedRoute>
                      } />
                      <Route path="/cart" element={
                        <AuthenticatedRoute>
                          <Cart />
                        </AuthenticatedRoute>
                      } />
                      <Route path="/checkout" element={
                        <CustomerRoute>
                          <Checkout />
                        </CustomerRoute>
                      } />
                      <Route path="/order/:orderId" element={
                        <AuthenticatedRoute>
                          <OrderTracking />
                        </AuthenticatedRoute>
                      } />
                      
                      {/* User Dashboard and Orders */}
                      <Route path="/dashboard" element={
                        <AuthenticatedRoute>
                          <UserDashboard />
                        </AuthenticatedRoute>
                      } />
                      <Route path="/orders" element={
                        <AuthenticatedRoute>
                          <Orders />
                        </AuthenticatedRoute>
                      } />
                      <Route path="/orders/:orderId" element={
                        <AuthenticatedRoute>
                          <Orders />
                        </AuthenticatedRoute>
                      } />
                      
                      {/* Role-Specific Routes */}
                      <Route path="/merchant" element={
                        <MerchantRoute>
                          <MerchantDashboard />
                        </MerchantRoute>
                      } />
                      <Route path="/farmer" element={
                        <FarmerRoute>
                          <FarmerDashboard />
                        </FarmerRoute>
                      } />
                      <Route path="/delivery-agent" element={
                        <DeliveryAgentRoute>
                          <DeliveryAgent />
                        </DeliveryAgentRoute>
                      } />
                      
                      {/* Test Route */}
                      <Route path="/test-integration" element={<TestIntegration />} />
                      
                      {/* 404 Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Toaster />
                </div>
              </Router>
              </CartProvider>
            </OrderProvider>
          </LocationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
