import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import ProductFeed from '@/components/ProductFeed';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Your Agricultural Marketplace
            <span className="block bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent animate-pulse">
              Fresh from Farm to Table
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Shop fresh produce directly from local farmers. 
            All delivered precisely to your pin-dropped location.
          </p>
          
          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Get Started
                </Link>
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 font-semibold rounded-lg transition-all duration-200"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <div className="w-full max-w-2xl mx-auto">
                <SearchBar />
              </div>
            )}
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">100+</div>
              <div className="text-gray-400 mt-2">Local Farmers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">5K+</div>
              <div className="text-gray-400 mt-2">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">24/7</div>
              <div className="text-gray-400 mt-2">Delivery Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* AgriConnect Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Fresh from the Farm</h2>
          <p className="text-gray-300 text-lg">
            Connect directly with local farmers for the freshest produce
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 p-8 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
              <div className="text-4xl mb-4">🌾</div>
              <h3 className="text-xl font-semibold text-white mb-3">Fresh Produce</h3>
              <p className="text-gray-300 mb-4">
                Get the freshest fruits, vegetables, and grains directly from local farms
              </p>
              <Link 
                to="/agri-connect" 
                className="inline-flex items-center text-green-400 hover:text-green-300 font-medium"
              >
                Browse Products →
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-green-500/10 p-8 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold text-white mb-3">Fast Delivery</h3>
              <p className="text-gray-300 mb-4">
                Same-day delivery to your exact location with real-time tracking
              </p>
              <Link 
                to="/agri-connect" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
              >
                Order Now →
              </Link>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
              <div className="text-4xl mb-4">👨‍🌾</div>
              <h3 className="text-xl font-semibold text-white mb-3">Support Farmers</h3>
              <p className="text-gray-300 mb-4">
                Help local farmers grow their business while getting quality produce
              </p>
              <Link 
                to="/agri-connect" 
                className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium"
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product Feed */}
      <section className="py-16 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <ProductFeed />
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-12 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              ChronoConnect
            </h3>
            <p className="text-gray-300">
              Connecting communities through fresh, local agricultural commerce
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <h4 className="font-semibold mb-3 text-white">Shop</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/marketplace" className="hover:text-green-400 transition-colors">Fresh Produce</Link></li>
                <li><Link to="/marketplace" className="hover:text-green-400 transition-colors">Electronics</Link></li>
                <li><Link to="/marketplace" className="hover:text-green-400 transition-colors">Fashion</Link></li>
                <li><Link to="/marketplace" className="hover:text-green-400 transition-colors">Home & Garden</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white">Sell</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/merchant" className="hover:text-blue-400 transition-colors">Become a Merchant</Link></li>
                <li><Link to="/merchant" className="hover:text-blue-400 transition-colors">Farmer Registration</Link></li>
                <li><Link to="/delivery-agent" className="hover:text-blue-400 transition-colors">Delivery Partner</Link></li>
                <li><Link to="/merchant" className="hover:text-blue-400 transition-colors">Business Tools</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/help" className="hover:text-green-400 transition-colors">Help Center</Link></li>
                <li><Link to="/order/1" className="hover:text-green-400 transition-colors">Track Order</Link></li>
                <li><Link to="/contact" className="hover:text-green-400 transition-colors">Contact Us</Link></li>
                <li><Link to="/safety" className="hover:text-green-400 transition-colors">Safety</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-gray-400">
            <p>&copy; 2025 ChronoConnect. Made with ❤️ for African commerce.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
