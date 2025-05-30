import { useState } from 'react';
import { Ride } from '@shared/schema';

// Helper function to make API requests
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to fetch data');
  }

  return response.json();
}

export function usePostgresRides() {
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRide = async (rideData: Partial<Ride>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newRide = await apiRequest<Ride>('/api/rides', {
        method: 'POST',
        body: JSON.stringify(rideData),
      });
      
      return newRide;
    } catch (err: any) {
      console.error('Error creating ride:', err);
      setError(err.message || 'Failed to create ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Define a memoized version of loadMyRides that won't cause repeated calls
  const loadMyRides = async (userId: string, forceReload = false) => {
    // If we already have rides and are not in an error state, don't reload unless forced
    if (myRides.length > 0 && !error && !forceReload) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use a simple GET request with proper headers
      const response = await fetch('/api/user-rides', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user rides: ${response.status}`);
      }
      
      const rides = await response.json();
      console.log('Loaded my rides:', rides);
      setMyRides(rides);
    } catch (err: any) {
      console.error('Error loading my rides:', err);
      setError(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const updateRide = async (id: number, rideData: Partial<Ride>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current user from Firebase Auth
      const auth = await import('firebase/auth').then(m => m.getAuth());
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/rides/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUser.uid,
          'X-User-Email': currentUser.email || '',
          'X-User-Name': currentUser.displayName || ''
        },
        body: JSON.stringify(rideData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update ride: ${response.status} ${response.statusText}`);
      }
      
      const updatedRide = await response.json();
      
      setMyRides(prev => 
        prev.map(ride => ride.id === id ? updatedRide : ride)
      );
      
      // Also update the main rides list if it's been loaded
      setRides((prev: Ride[]) => 
        prev.map((ride: Ride) => ride.id === id ? updatedRide : ride)
      );
      
      return true;
    } catch (err: any) {
      console.error('Error updating ride:', err);
      setError(err.message || 'Failed to update ride');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeRide = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current user from Firebase Auth
      const auth = await import('firebase/auth').then(m => m.getAuth());
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/rides/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUser.uid,
          'X-User-Email': currentUser.email || '',
          'X-User-Name': currentUser.displayName || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete ride: ${response.status} ${response.statusText}`);
      }
      
      setMyRides(prev => prev.filter(ride => ride.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error removing ride:', err);
      setError(err.message || 'Failed to remove ride');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    myRides,
    loading,
    error,
    createRide,
    loadMyRides,
    updateRide: updateRide as any,
    removeRide
  };
}