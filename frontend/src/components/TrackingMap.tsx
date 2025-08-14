import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Location {
  lat: number;
  lon: number;
}

interface TrackingMapProps {
  orderId: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  currentLocation?: Location;
  bearing?: number;
  speed?: number;
  eta?: number;
  distance?: number;
  isTracking: boolean;
  className?: string;
}

const TrackingMap: React.FC<TrackingMapProps> = ({
  orderId,
  pickupLocation,
  deliveryLocation,
  currentLocation,
  bearing = 0,
  speed = 0,
  eta,
  distance,
  isTracking,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [pickupLocation.lon, pickupLocation.lat],
      zoom: 12,
      attributionControl: false
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [pickupLocation.lat, pickupLocation.lon]);

  // Add markers and route when map loads
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Add pickup marker
    new mapboxgl.Marker({ color: '#10B981' })
      .setLngLat([pickupLocation.lon, pickupLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<div class="p-2"><strong>Pickup Location</strong></div>'))
      .addTo(map.current);

    // Add delivery marker
    new mapboxgl.Marker({ color: '#EF4444' })
      .setLngLat([deliveryLocation.lon, deliveryLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<div class="p-2"><strong>Delivery Location</strong></div>'))
      .addTo(map.current);

    // Fit map to show both locations
    const bounds = new mapboxgl.LngLatBounds()
      .extend([pickupLocation.lon, pickupLocation.lat])
      .extend([deliveryLocation.lon, deliveryLocation.lat]);
    
    map.current.fitBounds(bounds, { padding: 50 });

  }, [mapLoaded, pickupLocation, deliveryLocation]);

  // Update current location marker
  useEffect(() => {
    if (!mapLoaded || !map.current || !currentLocation) return;

    // Remove existing current location marker
    const existingMarker = document.querySelector('.current-location-marker');
    if (existingMarker) {
      existingMarker.remove();
    }

    // Add new current location marker with bearing
    const el = document.createElement('div');
    el.className = 'current-location-marker';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = '#3B82F6';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    el.style.transform = `rotate(${bearing}deg)`;

    new mapboxgl.Marker(el)
      .setLngLat([currentLocation.lon, currentLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div class="p-2">
          <strong>Current Location</strong><br/>
          Speed: ${speed.toFixed(1)} km/h<br/>
          Bearing: ${bearing.toFixed(0)}°
        </div>
      `))
      .addTo(map.current);

  }, [mapLoaded, currentLocation, bearing, speed]);

  // Calculate and display route
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const calculateRoute = async () => {
      try {
        const start = `${pickupLocation.lon},${pickupLocation.lat}`;
        const end = `${deliveryLocation.lon},${deliveryLocation.lat}`;
        
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          // Remove existing route
          if (map.current?.getSource('route')) {
            map.current.removeLayer('route');
            map.current.removeSource('route');
          }

          // Add new route
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: data.routes[0].geometry
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    calculateRoute();
  }, [mapLoaded, pickupLocation, deliveryLocation]);

  // Auto-center map on current location when tracking
  useEffect(() => {
    if (!mapLoaded || !map.current || !isTracking || !currentLocation) return;

    map.current.flyTo({
      center: [currentLocation.lon, currentLocation.lat],
      zoom: 15,
      duration: 2000
    });
  }, [mapLoaded, isTracking, currentLocation]);

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-96 rounded-lg shadow-lg"
      />
      
      {/* ETA and Status Overlay */}
      {isTracking && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-[200px]">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Order #{orderId.slice(-8)}
          </div>
          
          {eta && (
            <div className="mb-2">
              <div className="text-xs text-gray-500">Estimated Arrival</div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(eta)} min
              </div>
            </div>
          )}
          
          {distance && (
            <div className="mb-2">
              <div className="text-xs text-gray-500">Distance Remaining</div>
              <div className="text-sm font-medium text-gray-700">
                {distance.toFixed(1)} km
              </div>
            </div>
          )}
          
          {speed > 0 && (
            <div>
              <div className="text-xs text-gray-500">Current Speed</div>
              <div className="text-sm font-medium text-gray-700">
                {speed.toFixed(1)} km/h
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Connection Status */}
      <div className="absolute top-4 left-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isTracking 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isTracking ? 'Live Tracking' : 'Static View'}
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">Pickup</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600">Delivery</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-600">Driver</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingMap;
