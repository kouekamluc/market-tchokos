import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  landmark?: string;
  contactNumber?: string;
  isDefault?: boolean;
}

export interface DeliveryLocation extends Location {
  id: string;
  name: string;
  createdAt: Date;
}

interface LocationContextType {
  currentLocation: Location | null;
  savedLocations: DeliveryLocation[];
  selectedLocation: DeliveryLocation | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<void>;
  saveLocation: (location: Omit<DeliveryLocation, 'id' | 'createdAt'>) => void;
  selectLocation: (location: DeliveryLocation) => void;
  updateLocation: (id: string, updates: Partial<DeliveryLocation>) => void;
  deleteLocation: (id: string) => void;
  setDefaultLocation: (id: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [savedLocations, setSavedLocations] = useState<DeliveryLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved locations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chronoconnect_saved_locations');
    if (saved) {
      try {
        const locations = JSON.parse(saved).map((loc: Record<string, unknown>) => ({
          ...loc,
          createdAt: new Date(loc.createdAt)
        }));
        setSavedLocations(locations);
        
        // Set default location as selected
        const defaultLocation = locations.find((loc: DeliveryLocation) => loc.isDefault);
        if (defaultLocation) {
          setSelectedLocation(defaultLocation);
        }
      } catch (err) {
        console.error('Error loading saved locations:', err);
      }
    }
  }, []);

  // Save locations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chronoconnect_saved_locations', JSON.stringify(savedLocations));
  }, [savedLocations]);

  const getCurrentLocation = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      setCurrentLocation(location);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      console.error('Location error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocation = (locationData: Omit<DeliveryLocation, 'id' | 'createdAt'>) => {
    const newLocation: DeliveryLocation = {
      ...locationData,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    setSavedLocations(prev => {
      // If this is set as default, remove default from others
      if (newLocation.isDefault) {
        prev = prev.map(loc => ({ ...loc, isDefault: false }));
      }
      return [...prev, newLocation];
    });

    setSelectedLocation(newLocation);
  };

  const selectLocation = (location: DeliveryLocation) => {
    setSelectedLocation(location);
  };

  const updateLocation = (id: string, updates: Partial<DeliveryLocation>) => {
    setSavedLocations(prev => {
      const updated = prev.map(loc => {
        if (loc.id === id) {
          const updatedLoc = { ...loc, ...updates };
          
          // If setting as default, remove default from others
          if (updates.isDefault) {
            prev.forEach(otherLoc => {
              if (otherLoc.id !== id) {
                otherLoc.isDefault = false;
              }
            });
          }
          
          return updatedLoc;
        }
        return loc;
      });
      return updated;
    });

    // Update selected location if it's the one being updated
    if (selectedLocation?.id === id) {
      setSelectedLocation(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteLocation = (id: string) => {
    setSavedLocations(prev => prev.filter(loc => loc.id !== id));
    
    // If deleted location was selected, clear selection
    if (selectedLocation?.id === id) {
      setSelectedLocation(null);
    }
  };

  const setDefaultLocation = (id: string) => {
    updateLocation(id, { isDefault: true });
  };

  const value: LocationContextType = {
    currentLocation,
    savedLocations,
    selectedLocation,
    isLoading,
    error,
    getCurrentLocation,
    saveLocation,
    selectLocation,
    updateLocation,
    deleteLocation,
    setDefaultLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}; 