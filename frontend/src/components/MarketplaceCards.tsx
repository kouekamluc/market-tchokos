import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Leaf, ShoppingBag, ArrowRight } from 'lucide-react';
import agriHero from '@/assets/agri-hero.jpg';
import marketplaceHero from '@/assets/marketplace-hero.jpg';

const MarketplaceCards = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 max-w-6xl mx-auto">
      {/* AgriConnect Card */}
      <Card className="overflow-hidden shadow-medium hover:shadow-glow transition-all duration-300 group">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={agriHero} 
            alt="Fresh produce marketplace"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-4 left-4">
            <div className="bg-agri-green text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Fresh & Local
            </div>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-2">Shop Fresh Produce</h3>
          <p className="text-muted-foreground mb-4">
            Connect directly with local farmers. Fresh vegetables, fruits, and organic produce delivered to your doorstep.
          </p>
          <Link to="/agri-connect">
            <Button variant="agri" className="w-full">
              <Leaf className="w-4 h-4" />
              Browse AgriConnect
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Marketplace Card */}
      <Card className="overflow-hidden shadow-medium hover:shadow-glow transition-all duration-300 group">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={marketplaceHero} 
            alt="Retail marketplace"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-4 left-4">
            <div className="bg-marketplace-blue text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Retail & More
            </div>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-2">Shop Retail</h3>
          <p className="text-muted-foreground mb-4">
            Discover electronics, fashion, home goods, and everything you need from trusted local businesses.
          </p>
          <Link to="/marketplace">
            <Button variant="marketplace" className="w-full">
              <ShoppingBag className="w-4 h-4" />
              Browse Marketplace
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default MarketplaceCards;