import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  landmark: string;
  isDefault: boolean;
  contactNumber?: string;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  place_name: string;
}

export function useLocation() {
  const queryClient = useQueryClient();

  // Get saved locations
  const { data: savedLocations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get('/users/addresses/');
      return response.data.map((location: any) => ({
        id: location.id,
        name: location.name,
        latitude: location.location.latitude,
        longitude: location.location.longitude,
        landmark: location.landmark || '',
        isDefault: location.is_default,
        contactNumber: location.contact_number
      }));
    },
    enabled: !!localStorage.getItem('access_token'),
    retry: false,
    onError: (error: any) => {
      if (error.response?.status === 401) {
        // User not authenticated, this is expected
        console.log('User not authenticated, skipping location fetch');
      } else {
        console.error('Error fetching locations:', error);
      }
    }
  });

  // Save location
  const saveLocation = useMutation({
    mutationFn: async (location: Omit<Location, 'id'>) => {
      const response = await api.post('/users/addresses/', {
        name: location.name,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        landmark: location.landmark,
        contact_number: location.contactNumber,
        is_default: location.isDefault
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location saved successfully!');
    },
    onError: (error: any) => {
      console.error('Error saving location:', error);
      toast.error(error.response?.data?.error || 'Failed to save location');
    }
  });

  // Update location
  const updateLocation = useMutation({
    mutationFn: async ({ id, ...location }: Location) => {
      const response = await api.put(`/users/addresses/${id}/`, {
        name: location.name,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        landmark: location.landmark,
        contact_number: location.contactNumber,
        is_default: location.isDefault
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating location:', error);
      toast.error(error.response?.data?.error || 'Failed to update location');
    }
  });

  // Delete location
  const deleteLocation = useMutation({
    mutationFn: async (locationId: string) => {
      await api.delete(`/users/addresses/${locationId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting location:', error);
      toast.error(error.response?.data?.error || 'Failed to delete location');
    }
  });

  // Geocode address
  const geocodeAddress = useMutation({
    mutationFn: async (address: string): Promise<GeocodeResult> => {
      const response = await api.post('/users/geocode/', { address });
      return response.data;
    },
    onError: (error: any) => {
      console.error('Error geocoding address:', error);
      toast.error(error.response?.data?.error || 'Failed to geocode address');
    }
  });

  // Get current location
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  return {
    savedLocations,
    locationsLoading,
    saveLocation,
    updateLocation,
    deleteLocation,
    geocodeAddress,
    getCurrentLocation
  };
} 