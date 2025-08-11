import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Save, Navigation, X } from 'lucide-react';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  landmark: string;
  isDefault: boolean;
}

interface LocationPickerProps {
  onLocationSelect: (location: Omit<Location, 'id'>) => void;
  onLocationSave?: (location: Location) => void;
  savedLocations?: Location[];
  initialLocation?: { latitude: number; longitude: number };
  showSavedLocations?: boolean;
  className?: string;
}

export function LocationPicker({
  onLocationSelect,
  onLocationSave,
  savedLocations = [],
  initialLocation,
  showSavedLocations = true,
  className = ''
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [locationName, setLocationName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      toast.error('Mapbox access token not configured');
      return;
    }

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialLocation 
        ? [initialLocation.longitude, initialLocation.latitude]
        : [9.0820, 8.6753], // Default to Nigeria center
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocate, 'top-left');

    // Handle map clicks
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ latitude: lat, longitude: lng });
      
      // Update or create marker
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([lng, lat])
          .addTo(map.current!);
      }
    });

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          // If no initial location, center on user location
          if (!initialLocation) {
            map.current?.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });
          }
        },
        (error) => {
          console.warn('Error getting location:', error);
          toast.warning('Unable to get your current location');
        }
      );
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [initialLocation]);

  // Set initial marker if provided
  useEffect(() => {
    if (initialLocation && map.current && !marker.current) {
      marker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([initialLocation.longitude, initialLocation.latitude])
        .addTo(map.current);
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation, map.current]);

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setSelectedLocation(userLocation);
      
      if (marker.current) {
        marker.current.setLngLat([userLocation.longitude, userLocation.latitude]);
      } else {
        marker.current = new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(map.current!);
      }

      map.current?.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 16
      });
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location on the map first');
      return;
    }

    if (!locationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    setIsLoading(true);

    try {
      const newLocation: Location = {
        id: Date.now().toString(),
        name: locationName.trim(),
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        landmark: landmark.trim(),
        isDefault: savedLocations.length === 0
      };

      if (onLocationSave) {
        await onLocationSave(newLocation);
      }

      toast.success('Location saved successfully!');
      setLocationName('');
      setLandmark('');
    } catch (error) {
      toast.error('Failed to save location');
      console.error('Error saving location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = () => {
    if (!selectedLocation) {
      toast.error('Please select a location on the map first');
      return;
    }

    onLocationSelect({
      name: locationName || 'Selected Location',
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      landmark: landmark,
      isDefault: false
    });

    toast.success('Location selected!');
  };

  const handleSavedLocationClick = (location: Location) => {
    setSelectedLocation({ latitude: location.latitude, longitude: location.longitude });
    
    if (marker.current) {
      marker.current.setLngLat([location.longitude, location.latitude]);
    } else {
      marker.current = new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current!);
    }

    map.current?.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 16
    });

    onLocationSelect(location);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Your Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Map */}
            <div 
              ref={mapContainer} 
              className="w-full h-96 rounded-lg border-2 border-dashed border-gray-300"
            />
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleUseCurrentLocation}
                disabled={!userLocation}
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Use Current Location
              </Button>
              
              {selectedLocation && (
                <Button
                  onClick={handleSelectLocation}
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Select This Location
                </Button>
              )}
            </div>

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Selected:</strong> {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Location Form */}
      {onLocationSave && (
        <Card>
          <CardHeader>
            <CardTitle>Save This Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="locationName">Location Name *</Label>
              <Input
                id="locationName"
                placeholder="e.g., Home, Office, Shop"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="landmark">Landmark Description</Label>
              <Input
                id="landmark"
                placeholder="e.g., Blue gate opposite the bakery"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSaveLocation}
              disabled={!selectedLocation || !locationName.trim() || isLoading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Location'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Saved Locations */}
      {showSavedLocations && savedLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSavedLocationClick(location)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{location.name}</h4>
                      {location.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    {location.landmark && (
                      <p className="text-sm text-gray-600">{location.landmark}</p>
                    )}
                  </div>
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 