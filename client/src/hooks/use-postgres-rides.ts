import { useState, useEffect } from 'react';
import { Ride } from '@shared/schema';
import { fetchMyRides, fetchRideById, updateRide, deleteRide } from '../lib/postgres-api';

export function usePostgresRides() {
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMyRides = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const rides = await fetchMyRides();
      setMyRides(rides);
    } catch (err) {
      console.error('Error loading my rides:', err);
      setError('Failed to load your rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const editRide = async (id: number, rideData: Partial<Ride>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedRide = await updateRide(id, rideData);
      
      if (updatedRide) {
        // Update the ride in the local state
        setMyRides(prevRides => 
          prevRides.map(ride => 
            ride.id === id ? { ...ride, ...updatedRide } : ride
          )
        );
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating ride:', err);
      setError('Failed to update ride. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeRide = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await deleteRide(id);
      
      if (success) {
        // Remove the ride from the local state
        setMyRides(prevRides => prevRides.filter(ride => ride.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting ride:', err);
      setError('Failed to delete ride. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRides();
  }, []);

  return {
    myRides,
    loading,
    error,
    loadMyRides,
    editRide,
    removeRide
  };
}