import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onLocationChange?: (location: string) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Search for fresh produce, electronics, fashion...",
  onSearch,
  onLocationChange,
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Douala, Cameroon');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleLocationClick = () => {
    // In a real app, this would open a location picker
    const newLocation = prompt('Enter your location:', location);
    if (newLocation && newLocation.trim()) {
      setLocation(newLocation.trim());
      if (onLocationChange) {
        onLocationChange(newLocation.trim());
      }
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto px-4 ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center bg-white rounded-xl shadow-soft border border-input p-3 gap-3">
          <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-black placeholder:text-gray-500 text-base"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={handleLocationClick}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">{location}</span>
          </Button>
          <Button 
            type="submit"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Search
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;