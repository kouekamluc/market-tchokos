import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'merchant' | 'farmer' | 'delivery_agent' | 'admin';
  allowedRoles?: ('customer' | 'merchant' | 'farmer' | 'delivery_agent' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  allowedRoles 
}) => {
  const authContext = useAuth();
  const location = useLocation();
  
  // If AuthContext is not available, show loading
  if (!authContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Initializing...</p>
        </div>
      </div>
    );
  }

  const { isAuthenticated, isLoading, user } = authContext;

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && user.user_type !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    switch (user.user_type) {
      case 'merchant':
        return <Navigate to="/merchant" replace />;
      case 'farmer':
        return <Navigate to="/farmer" replace />;
      case 'delivery_agent':
        return <Navigate to="/delivery-agent" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Check if user has any of the allowed roles
  if (allowedRoles && !allowedRoles.includes(user.user_type)) {
    // Redirect to appropriate dashboard based on user role
    switch (user.user_type) {
      case 'merchant':
        return <Navigate to="/merchant" replace />;
      case 'farmer':
        return <Navigate to="/farmer" replace />;
      case 'delivery_agent':
        return <Navigate to="/delivery-agent" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

// Specific route guards
export const CustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="customer">{children}</ProtectedRoute>
);

export const MerchantRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="merchant">{children}</ProtectedRoute>
);

export const FarmerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="farmer">{children}</ProtectedRoute>
);

export const DeliveryAgentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="delivery_agent">{children}</ProtectedRoute>
);

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
);

// Routes that require any authenticated user
export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
); 