import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Star, MapPin, Shield, Truck, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.getProduct(id!),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: () => apiClient.getProductReviews(id!),
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    try {
      await apiClient.addToCart({
        product_id: parseInt(id!),
        variant_id: selectedVariant ? parseInt(selectedVariant) : undefined,
        quantity,
      });
      toast.success(`${product?.name} added to cart!`, {
        description: `Quantity: ${quantity}`,
        action: {
          label: 'View Cart',
          onClick: () => navigate('/cart')
        }
      });
    } catch (error) {
      toast.error('Failed to add product to cart');
    }
  };

  const handleBuyNow = async () => {
    try {
      await apiClient.addToCart({
        product_id: parseInt(id!),
        variant_id: selectedVariant ? parseInt(selectedVariant) : undefined,
        quantity,
      });
      navigate('/checkout');
    } catch (error) {
      toast.error('Failed to add product to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Product not found</div>
      </div>
    );
  }

  const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
  const salePrice = product.is_on_sale && product.discount_percentage > 0 
    ? product.price * (1 - product.discount_percentage / 100) 
    : product.price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{product.name}</h1>
            <p className="text-gray-400">by {product.merchant.business_name || `${product.merchant.first_name} ${product.merchant.last_name}`}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
              <img 
                src={primaryImage?.image || "/placeholder.svg"} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image) => (
                  <div key={image.id} className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                    <img 
                      src={image.image} 
                      alt={image.alt_text || product.name}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  {salePrice.toLocaleString()} CFA
                </span>
                {product.is_on_sale && (
                  <span className="text-xl text-gray-400 line-through">
                    {product.price.toLocaleString()} CFA
                  </span>
                )}
                {product.is_on_sale && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    {product.discount_percentage}% OFF
                  </Badge>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(product.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} 
                  />
                ))}
              </div>
              <span className="text-gray-300">{product.average_rating.toFixed(1)}</span>
              <span className="text-gray-500">({product.review_count} reviews)</span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">{product.description}</p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Features</h3>
              <div className="flex flex-wrap gap-2">
                {product.fast_delivery && (
                  <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Fast Delivery
                  </Badge>
                )}
                {product.warranty && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {product.warranty} Warranty
                  </Badge>
                )}
                {product.handmade && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Handmade
                  </Badge>
                )}
                {product.stock > 0 ? (
                  <Badge className="bg-green-500 text-white">
                    In Stock ({product.stock})
                  </Badge>
                ) : (
                  <Badge className="bg-red-500 text-white">
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Options</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant === variant.id.toString() ? "default" : "outline"}
                      className="text-white"
                      onClick={() => setSelectedVariant(variant.id.toString())}
                      disabled={variant.stock_quantity === 0}
                    >
                      {variant.name}: {variant.value}
                      {variant.price_adjustment > 0 && ` (+${variant.price_adjustment.toLocaleString()} CFA)`}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Quantity</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-white"
                >
                  -
                </Button>
                <span className="text-white px-4">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-white"
                  disabled={quantity >= product.stock}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </Button>
              <Button variant="outline" size="icon" className="text-white">
                <Heart className="w-4 h-4" />
              </Button>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{product.city}, {product.region}</span>
              {product.distance && (
                <span>• {product.distance.toFixed(1)} km away</span>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-12">
            <Separator className="mb-6" />
            <h2 className="text-2xl font-bold text-white mb-6">Customer Reviews</h2>
            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id} className="bg-gray-800/50 border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {review.user.first_name} {review.user.last_name}
                      </span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-white mb-1">{review.title}</h4>
                  )}
                  <p className="text-gray-300">{review.comment}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;