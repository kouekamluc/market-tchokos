import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Star, MapPin, ShoppingBag, Zap, ArrowLeft, X, SlidersHorizontal, Shield, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import SearchBar from '@/components/SearchBar';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Product, Category } from '@/lib/api';

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    fastDelivery: false,
    inStock: false,
    withWarranty: false,
    topRated: false,
    onSale: false,
    priceRange: [0, 1000000],
    handmade: false
  });

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch products with filters
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory, filters],
    queryFn: () => apiClient.getProducts({
      search: searchQuery || undefined,
      category: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
      min_price: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
      max_price: filters.priceRange[1] < 1000000 ? filters.priceRange[1] : undefined,
      in_stock: filters.inStock || undefined,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const products = productsData?.results || [];

  // Transform categories for display
  const categoriesArray = Array.isArray(categories) ? categories : (categories?.results || []);
  const displayCategories = [
    { id: 'all', name: 'All Products', count: productsData?.count || 0, icon: '🛍️' },
    ...categoriesArray.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: cat.product_count || 0,
      icon: cat.icon || '📦'
    }))
  ];

  // Transform products for display
  const displayProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.sale_price || product.price,
    merchant: product.merchant.business_name || `${product.merchant.first_name} ${product.merchant.last_name}`,
    location: `${product.city}, ${product.region}`,
    rating: product.average_rating || 0,
    reviews: product.review_count || 0,
    distance: product.distance || null,
    image: product.primary_image?.image || "/placeholder.svg",
    inStock: product.is_in_stock,
    category: product.category.slug,
    fastDelivery: product.fast_delivery,
    warranty: product.warranty,
    handmade: product.handmade,
    description: product.description
  }));

  const filteredProducts = useMemo(() => {
    return displayProducts.filter((product) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      // Additional client-side filters
      if (filters.fastDelivery && !product.fastDelivery) return false;
      if (filters.inStock && !product.inStock) return false;
      if (filters.withWarranty && !product.warranty) return false;
      if (filters.topRated && product.rating < 4.5) return false;
      if (filters.onSale && product.originalPrice >= product.price) return false;
      if (filters.handmade && !product.handmade) return false;
      
      // Price range filter
      const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [displayProducts, searchQuery, selectedCategory, filters]);

  const clearFilters = () => {
    setFilters({
      fastDelivery: false,
      inStock: false,
      withWarranty: false,
      topRated: false,
      onSale: false,
      priceRange: [0, 1000000],
      handmade: false
    });
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation(); // Prevent card click
    toast.success(`${product.name} added to cart!`);
    // Here you would typically add to cart context
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + 
    (selectedCategory !== 'all' ? 1 : 0) + 
    (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent animate-pulse">
                <ShoppingBag className="w-8 h-8" />
                Marketplace
              </h1>
              <p className="text-gray-300 mt-2">Electronics, fashion, and everything you need</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <SearchBar 
            placeholder="Search for electronics, fashion, home goods..."
            onSearch={handleSearch}
            className="mb-6"
          />

          {/* Error Handling */}
          {(categoriesError || productsError) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">
                {categoriesError ? 'Error loading categories: ' + categoriesError.message : ''}
                {productsError ? 'Error loading products: ' + productsError.message : ''}
              </p>
            </div>
          )}

          {/* Filters Button */}
          <div className="flex justify-center mb-6">
            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                      max={1000000}
                      step={10000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>{filters.priceRange[0].toLocaleString()} CFA</span>
                      <span>{filters.priceRange[1].toLocaleString()} CFA</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="fastDelivery"
                        checked={filters.fastDelivery}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, fastDelivery: !!checked }))}
                      />
                      <Label htmlFor="fastDelivery">Fast Delivery</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inStock"
                        checked={filters.inStock}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStock: !!checked }))}
                      />
                      <Label htmlFor="inStock">In Stock Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="withWarranty"
                        checked={filters.withWarranty}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, withWarranty: !!checked }))}
                      />
                      <Label htmlFor="withWarranty">With Warranty</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="topRated"
                        checked={filters.topRated}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, topRated: !!checked }))}
                      />
                      <Label htmlFor="topRated">Top Rated (4.5+)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="onSale"
                        checked={filters.onSale}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onSale: !!checked }))}
                      />
                      <Label htmlFor="onSale">On Sale</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="handmade"
                        checked={filters.handmade}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, handmade: !!checked }))}
                      />
                      <Label htmlFor="handmade">Handmade</Label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={clearFilters} variant="outline" className="flex-1">
                      Clear All
                    </Button>
                    <Button onClick={() => setShowFilters(false)} className="flex-1">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex gap-8">
          {/* Sidebar - Categories */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-4">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {displayCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border border-green-500/30'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content - Products Grid */}
          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  All Products ({filteredProducts.length} items)
                </h2>
                {searchQuery && (
                  <p className="text-sm text-gray-300 mt-1">
                    Search results for "{searchQuery}"
                  </p>
                )}
              </div>
              <select className="border border-gray-600 rounded-lg px-3 py-2 bg-gray-700/50 text-white">
                <option>Sort by: Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Distance: Nearest</option>
                <option>Rating: Highest</option>
                <option>Newest First</option>
              </select>
            </div>

            {(categoriesLoading || productsLoading) ? (
              <Card className="p-12 text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <div className="text-gray-300">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium mb-2 text-white">Loading products...</h3>
                  <p className="text-sm text-gray-400">Please wait while we fetch the latest products</p>
                </div>
              </Card>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-12 text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <div className="text-gray-300">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2 text-white">No products found</h3>
                  <p className="mb-4">Try adjusting your search or filters</p>
                  <Button onClick={clearFilters} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                    Clear All Filters
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 group cursor-pointer hover:scale-105"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <div className="relative">
                      <div className="aspect-square bg-gray-700 flex items-center justify-center">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.fastDelivery && (
                          <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Fast Delivery
                          </Badge>
                        )}
                        {product.originalPrice && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                            Sale
                          </Badge>
                        )}
                        {product.handmade && (
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                            Handmade
                          </Badge>
                        )}
                        {product.warranty && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Warranty
                          </Badge>
                        )}
                      </div>

                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">{product.price.toLocaleString()} CFA</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">{product.originalPrice.toLocaleString()} CFA</span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">{product.merchant}</p>
                      <p className="text-xs text-gray-400 mb-3">{product.location}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating} ({product.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{product.distance} km</span>
                        </div>
                      </div>

                      {product.warranty && (
                        <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span>Warranty: {product.warranty}</span>
                        </div>
                      )}

                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                        disabled={!product.inStock}
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        {product.inStock ? "Add to Cart" : "Notify When Available"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;