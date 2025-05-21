import { useState, useEffect } from 'react';
import { Ride } from '@shared/schema';
import { 
  fetchRides, 
  createRide, 
  updateRide, 
  deleteRide, 
  fetchMyRides 
} from '../lib/postgres-api';

/**
 * Custom hook for managing rides with PostgreSQL API
 */
export function usePostgresRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Loads rides based on origin and destination filters
   */
  const loadRides = async (origin: string, destination?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedRides = await fetchRides(origin, destination);
      setRides(fetchedRides);
    } catch (err) {
      console.error('Error loading rides:', err);
      setError('Failed to load rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loads rides posted by the current user
   */
  const loadMyRides = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedRides = await fetchMyRides();
      setMyRides(fetchedRides);
    } catch (err) {
      console.error('Error loading user rides:', err);
      setError('Failed to load your rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Posts a new ride
   */
  const postRide = async (rideData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const newRide = await createRide(rideData);
      
      if (newRide) {
        setRides(prevRides => [...prevRides, newRide]);
        return newRide;
      }
      
      throw new Error('Failed to create ride');
    } catch (err) {
      console.error('Error posting ride:', err);
      setError('Failed to post ride. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Updates an existing ride
   */
  const editRide = async (id: number, rideData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedRide = await updateRide(id, rideData);
      
      if (updatedRide) {
        // Update the ride in both rides arrays
        setRides(prevRides => 
          prevRides.map(ride => 
            ride.id === id ? updatedRide : ride
          )
        );
        
        setMyRides(prevRides => 
          prevRides.map(ride => 
            ride.id === id ? updatedRide : ride
          )
        );
        
        return updatedRide;
      }
      
      throw new Error('Failed to update ride');
    } catch (err) {
      console.error('Error updating ride:', err);
      setError('Failed to update ride. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Removes a ride
   */
  const removeRide = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await deleteRide(id);
      
      if (success) {
        // Remove the ride from both rides arrays
        setRides(prevRides => 
          prevRides.filter(ride => ride.id !== id)
        );
        
        setMyRides(prevRides => 
          prevRides.filter(ride => ride.id !== id)
        );
        
        return true;
      }
      
      throw new Error('Failed to delete ride');
    } catch (err) {
      console.error('Error deleting ride:', err);
      setError('Failed to delete ride. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    rides,
    myRides,
    loading,
    error,
    loadRides,
    loadMyRides,
    postRide,
    editRide,
    removeRide
  };
}