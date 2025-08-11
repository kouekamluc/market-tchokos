import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Star, ShoppingCart, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  merchant: {
    id: string;
    name: string;
    rating: number;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  is_available: boolean;
  stock_quantity?: number;
  rating?: number;
  review_count?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string, quantity?: number) => void;
  onProductClick?: (productId: string) => void;
  showMerchantInfo?: boolean;
  className?: string;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onProductClick,
  showMerchantInfo = true,
  className = '' 
}: ProductCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.is_available) {
      toast.error('Product is currently unavailable');
      return;
    }
    onAddToCart(product.id, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(product.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderRating = () => {
    if (!product.rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-xs text-gray-600">
          {product.rating.toFixed(1)}
          {product.review_count && ` (${product.review_count})`}
        </span>
      </div>
    );
  };

  const renderStockStatus = () => {
    if (!product.is_available) {
      return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
    }
    
    if (product.stock_quantity !== undefined) {
      if (product.stock_quantity <= 0) {
        return <Badge variant="destructive" className="text-xs">Out of Stock</Badge>;
      }
      if (product.stock_quantity <= 5) {
        return <Badge variant="secondary" className="text-xs">Low Stock</Badge>;
      }
    }
    
    return <Badge variant="default" className="text-xs">In Stock</Badge>;
  };

  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}
      onClick={handleProductClick}
    >
      <CardHeader className="p-0">
        <div className="relative">
          <img 
            src={product.image || '/placeholder.svg'} 
            alt={product.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-2 left-2">
            {renderStockStatus()}
          </div>
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs bg-white/90">
              {product.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">
                {formatPrice(product.price)}
              </span>
              {renderRating()}
            </div>
          </div>
          
          {showMerchantInfo && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>by {product.merchant.name}</span>
              </div>
              {product.merchant.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{product.merchant.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={handleAddToCart}
            disabled={!product.is_available || (product.stock_quantity !== undefined && product.stock_quantity <= 0)}
            className="w-full mt-2"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.is_available && (product.stock_quantity === undefined || product.stock_quantity > 0)
              ? 'Add to Cart'
              : 'Out of Stock'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 