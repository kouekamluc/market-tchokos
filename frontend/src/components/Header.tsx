import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  User, 
  Menu, 
  X, 
  ChevronRight, 
  Home, 
  ShoppingCart, 
  LogOut, 
  Settings,
  Package,
  Truck,
  Store,
  Sprout
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth, useIsMerchant, useIsFarmer, useIsDeliveryAgent, useIsCustomer } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useApi';
import NotificationDropdown from './NotificationDropdown';
import logo from '@/assets/logo.png';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const isMerchant = useIsMerchant();
  const isFarmer = useIsFarmer();
  const isDeliveryAgent = useIsDeliveryAgent();
  const isCustomer = useIsCustomer();
  
  // Get cart data for cart count
  const { data: cart } = useCart();

  const isActive = (path: string) => location.pathname === path;

  // Base navigation items - only show to authenticated users
  const baseNavItems = [
    { path: '/', label: 'Home' },
    { path: '/agri-connect', label: 'AgriConnect' },
  ];

  // Role-specific navigation items - only show to authenticated users
  const getRoleNavItems = () => {
    if (isMerchant) {
      return [
        { path: '/merchant', label: 'Business Hub', icon: Store },
      ];
    }
    if (isFarmer) {
      return [
        { path: '/farmer', label: 'Farm Hub', icon: Sprout },
      ];
    }
    if (isDeliveryAgent) {
      return [
        { path: '/delivery-agent', label: 'Delivery Hub', icon: Package },
      ];
    }
    return [];
  };

  // Only show navigation items to authenticated users
  const navItems = isAuthenticated ? [...baseNavItems, ...getRoleNavItems()] : [];

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ path: '/', label: 'Home', icon: Home }];
    
    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segment.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      breadcrumbs.push({ path, label });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeVariant = () => {
    if (!user) return 'secondary';
    switch (user.user_type) {
      case 'admin': return 'destructive';
      case 'merchant': return 'default';
      case 'farmer': return 'default';
      case 'delivery_agent': return 'secondary';
      case 'customer': return 'outline';
      default: return 'secondary';
    }
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="ChronoConnect" className="w-10 h-10" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                ChronoConnect
              </h1>
            </Link>

            {/* Desktop Navigation - Only show to authenticated users */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive(item.path)
                        ? 'text-white bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10'
                    }`}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications - Only show to authenticated users */}
              {isAuthenticated && <NotificationDropdown />}

              {/* Cart - Only show to authenticated users */}
              {isAuthenticated && (
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 relative transition-all duration-200" asChild>
                  <Link to="/cart">
                    <ShoppingCart className="w-5 h-5" />
                    {cart && cart.item_count > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                      >
                        {cart.item_count}
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}

              {/* User Menu */}
              {isLoading ? (
                <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 transition-all duration-200">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.profile_picture} alt={user?.first_name} />
                        <AvatarFallback className="text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
                    <DropdownMenuLabel className="font-normal text-gray-200">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-white">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs leading-none text-gray-400">
                          {user?.email}
                        </p>
                        <Badge variant={getRoleBadgeVariant()} className="w-fit text-xs">
                          {user?.user_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem asChild className="text-gray-200 hover:bg-gray-700 hover:text-white">
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-200 hover:bg-gray-700 hover:text-white">
                      <Link to="/orders" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-200 hover:bg-gray-700 hover:text-white">
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-gray-200 hover:bg-gray-700 hover:text-white">
                      <Link to="/settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 transition-all duration-200">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg transition-all duration-200">
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu - Only show to authenticated users */}
          {isMobileMenuOpen && isAuthenticated && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
              <nav className="flex flex-col space-y-2 pt-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive(item.path)
                        ? 'text-white bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30'
                        : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/cart"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                  {cart && cart.item_count > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {cart.item_count}
                    </Badge>
                  )}
                </Link>
                
                {/* Mobile User Menu */}
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Signed in as {user?.first_name} {user?.last_name}
                  </div>
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/orders"
                    className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Package className="w-4 h-4" />
                    My Orders
                  </Link>
                  <Link
                    to="/profile"
                    className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-900/20 flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          )}

          {/* Mobile Menu for unauthenticated users */}
          {isMobileMenuOpen && !isAuthenticated && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
              <nav className="flex flex-col space-y-2 pt-4">
                <div className="text-center py-4">
                  <p className="text-gray-300 mb-4">Welcome to ChronoConnect</p>
                  <div className="flex flex-col gap-2">
                    <Button asChild className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                      <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                        Create Account
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                  </div>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      {location.pathname !== '/' && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.path}>
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-500" />}
                  <Link
                    to={breadcrumb.path}
                    className={`flex items-center gap-1 transition-colors ${
                      index === breadcrumbs.length - 1
                        ? 'text-white font-medium'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {breadcrumb.icon && <breadcrumb.icon className="w-4 h-4" />}
                    {breadcrumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;