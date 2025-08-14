import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, MapPin, Leaf, Clock, ArrowLeft, X, SlidersHorizontal } from 'lucide-react';
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
import { useCart } from '@/contexts/CartContext';

const AgriConnect = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    organic: false,
    harvestedToday: false,
    within5km: false,
    topRated: false,
    priceRange: [0, 5000],
    inStock: false
  });

  // Fetch AgriConnect categories
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['agri-categories'],
    queryFn: () => apiClient.getAgriCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch AgriConnect products with filters
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['agri-products', searchQuery, selectedCategory, filters],
    queryFn: () => apiClient.getAgriProducts({
      search: searchQuery || undefined,
      category: selectedCategory !== 'all' ? parseInt(selectedCategory) : undefined,
      min_price: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
      max_price: filters.priceRange[1] < 5000 ? filters.priceRange[1] : undefined,
      organic: filters.organic || undefined,
      harvested_today: filters.harvestedToday || undefined,
      within_5km: filters.within5km || undefined,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const products = productsData?.results || [];

  // Transform categories for display
  const categoriesArray = Array.isArray(categories) ? categories : (categories?.results || []);
  const displayCategories = [
    { id: 'all', name: 'All Products', count: productsData?.count || 0, icon: '🌾' },
    ...categoriesArray.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: cat.product_count || 0,
      icon: cat.icon || '🌾'
    }))
  ];

  // Transform products for display
  const displayProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price_per_unit,
    originalPrice: product.sale_price || product.price_per_unit,
    farmer: product.farmer.business_name || `${product.farmer.first_name} ${product.farmer.last_name}`,
    location: `${product.farm_location?.latitude}, ${product.farm_location?.longitude}`,
    rating: product.average_rating || 0,
    reviews: product.review_count || 0,
    distance: product.distance || null,
    image: product.images.find(img => img.is_primary)?.image || "/placeholder.svg",
    inStock: product.available_quantity > 0,
    organic: product.is_organic,
    harvestDate: product.harvest_date,
    category: product.category.slug,
    description: product.description
  }));

  const filteredProducts = useMemo(() => {
    return displayProducts.filter((product) => {
      // Additional client-side filters
      if (filters.topRated && product.rating < 4.5) return false;
      if (filters.inStock && !product.inStock) return false;
      
      return true;
    });
  }, [displayProducts, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Record<string, unknown>) => {
    e.stopPropagation(); // Prevent card click
    try {
      await addToCart(product, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      organic: false,
      harvestedToday: false,
      within5km: false,
      topRated: false,
      priceRange: [0, 5000],
      inStock: false
    });
    setSelectedCategory('all');
    setSearchQuery('');
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
                <Leaf className="w-8 h-8" />
                AgriConnect
              </h1>
              <p className="text-gray-300 mt-2">Fresh produce directly from local farmers</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <SearchBar 
            placeholder="Search for fresh vegetables, fruits, grains..."
            onSearch={handleSearch}
            className="mb-6"
          />
          
          {/* Filters Button */}
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
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Quick Filters</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="organic" 
                        checked={filters.organic}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, organic: checked as boolean }))}
                      />
                      <Label htmlFor="organic">Organic Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="harvestedToday" 
                        checked={filters.harvestedToday}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, harvestedToday: checked as boolean }))}
                      />
                      <Label htmlFor="harvestedToday">Harvested Today</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="within5km" 
                        checked={filters.within5km}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, within5km: checked as boolean }))}
                      />
                      <Label htmlFor="within5km">Within 5km</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="topRated" 
                        checked={filters.topRated}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, topRated: checked as boolean }))}
                      />
                      <Label htmlFor="topRated">Top Rated (4.5+)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inStock" 
                        checked={filters.inStock}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStock: checked as boolean }))}
                      />
                      <Label htmlFor="inStock">In Stock Only</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Price Range (CFA)</Label>
                  <div className="px-2">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                      max={5000}
                      min={0}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>{filters.priceRange[0]} CFA</span>
                      <span>{filters.priceRange[1]} CFA</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64">
            <Card className="p-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <h3 className="font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {displayCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id.toString())}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedCategory === category.id.toString()
                        ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                        : 'hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                      <span className="text-sm opacity-70">({category.count})</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <Card className="p-6 mt-6 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Active Filters</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-300 hover:text-white hover:bg-gray-700">
                    Clear All
                  </Button>
                </div>
                <div className="space-y-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border-green-500/30">
                      Search: "{searchQuery}"
                    </Badge>
                  )}
                  {selectedCategory !== 'all' && (
                    <Badge variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border-green-500/30">
                      Category: {displayCategories.find(c => c.id === selectedCategory)?.name}
                    </Badge>
                  )}
                  {filters.organic && <Badge variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border-green-500/30">Organic</Badge>}
                  {filters.harvestedToday && <Badge variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border-green-500/30">Harvested Today</Badge>}
                  {filters.within5km && <Badge variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border-green-500/30">Within 5km</Badge>}
                  {filters.topRated && <Badge variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border-green-500/30">Top Rated</Badge>}
                  {filters.inStock && <Badge variant="secondary" className="mr-1 mb-1 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-white border-green-500/30">In Stock</Badge>}
                </div>
              </Card>
            )}
          </aside>

          {/* Main Content - Products Grid */}
          <main className="flex-1">
            {/* Error Handling */}
            {(categoriesError || productsError) && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">
                  {categoriesError ? 'Error loading categories: ' + categoriesError.message : ''}
                  {productsError ? 'Error loading products: ' + productsError.message : ''}
                </p>
              </div>
            )}

            {/* Loading States */}
            {(categoriesLoading || productsLoading) ? (
              <Card className="p-12 text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <div className="text-gray-300">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium mb-2 text-white">Loading products...</h3>
                  <p className="text-sm text-gray-400">Please wait while we fetch the latest products</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Fresh Produce ({filteredProducts.length} items)
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
                    <option>Harvest Date: Latest</option>
                  </select>
                </div>

            {filteredProducts.length === 0 ? (
              <Card className="p-12 text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <div className="text-gray-300">
                  <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                    onClick={() => handleProductClick(product.id.toString())}
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
                        {product.organic && (
                          <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                            <Leaf className="w-3 h-3 mr-1" />
                            Organic
                          </Badge>
                        )}
                        {product.harvestDate === 'Today' && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                            Fresh Today
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
                        <span className="text-lg font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">{product.price} CFA</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">{product.originalPrice} CFA</span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">{product.farmer}</p>
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

                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                        <Clock className="w-3 h-3" />
                        <span>Harvested {product.harvestDate}</span>
                      </div>

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
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AgriConnect;