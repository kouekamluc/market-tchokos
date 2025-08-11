import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock } from 'lucide-react';

const ProductFeed = () => {
  const popularProducts = [
    {
      id: 1,
      name: "Fresh Tomatoes",
      price: "500 CFA/kg",
      vendor: "Mama Ngozi's Farm",
      rating: 4.8,
      distance: "2.3 km",
      category: "agri",
      image: "/placeholder.svg",
      inStock: true
    },
    {
      id: 2,
      name: "Samsung Galaxy A54",
      price: "285,000 CFA",
      vendor: "TechHub Cameroon",
      rating: 4.6,
      distance: "1.8 km",
      category: "marketplace",
      image: "/placeholder.svg",
      inStock: true
    },
    {
      id: 3,
      name: "Fresh Plantains",
      price: "200 CFA/piece",
      vendor: "Joseph's Garden",
      rating: 4.9,
      distance: "0.8 km",
      category: "agri",
      image: "/placeholder.svg",
      inStock: true
    },
    {
      id: 4,
      name: "Nike Air Max",
      price: "125,000 CFA",
      vendor: "Fashion Forward",
      rating: 4.4,
      distance: "3.2 km",
      category: "marketplace",
      image: "/placeholder.svg",
      inStock: false
    }
  ];

  const popularStores = [
    {
      id: 1,
      name: "Green Valley Farms",
      category: "Fresh Produce",
      rating: 4.9,
      products: "150+ products",
      badge: "Top Rated",
      badgeColor: "bg-agri-green"
    },
    {
      id: 2,
      name: "Digital World",
      category: "Electronics",
      rating: 4.7,
      products: "500+ products",
      badge: "Fast Delivery",
      badgeColor: "bg-marketplace-blue"
    },
    {
      id: 3,
      name: "Style Avenue",
      category: "Fashion",
      rating: 4.5,
      products: "200+ products",
      badge: "New Store",
      badgeColor: "bg-warning-orange"
    }
  ];

  return (
    <div className="space-y-8 px-4 max-w-6xl mx-auto">
      {/* Popular Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Popular Products</h2>
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden shadow-soft hover:shadow-medium transition-all duration-200 group cursor-pointer">
              <div className="relative">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-medium">Out of Stock</span>
                  </div>
                )}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white ${
                  product.category === 'agri' ? 'bg-agri-green' : 'bg-marketplace-blue'
                }`}>
                  {product.category === 'agri' ? 'Fresh' : 'Retail'}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-1 truncate">{product.name}</h3>
                <p className="text-lg font-bold text-primary mb-2">{product.price}</p>
                <p className="text-sm text-muted-foreground mb-2 truncate">{product.vendor}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-warning-orange text-warning-orange" />
                    <span>{product.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{product.distance}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular Stores */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Featured Stores</h2>
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {popularStores.map((store) => (
            <Card key={store.id} className="p-6 shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {store.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{store.category}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${store.badgeColor}`}>
                  {store.badge}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-warning-orange text-warning-orange" />
                  <span className="font-medium">{store.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{store.products}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProductFeed;