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

  const loadMyRides = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const rides = await apiRequest<Ride[]>(`/api/user-rides?driverId=${userId}`);
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
      const updatedRide = await apiRequest<Ride>(`/api/rides/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rideData),
      });
      
      setMyRides(prev => 
        prev.map(ride => ride.id === id ? updatedRide : ride)
      );
      
      return updatedRide;
    } catch (err: any) {
      console.error('Error updating ride:', err);
      setError(err.message || 'Failed to update ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeRide = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiRequest<void>(`/api/rides/${id}`, {
        method: 'DELETE',
      });
      
      setMyRides(prev => prev.filter(ride => ride.id !== id));
      return true;
    } catch (err: any) {
      console.error('Error removing ride:', err);
      setError(err.message || 'Failed to remove ride');
      throw err;
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
    updateRide,
    removeRide
  };
}