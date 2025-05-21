import { useState, useEffect } from 'react';
import { fetchRides } from '../lib/postgres-api';
import { Ride } from '@shared/schema';

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRides = async (origin?: string, destination?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedRides = await fetchRides(origin || '', destination);
      setRides(fetchedRides);
    } catch (err) {
      console.error('Error loading rides:', err);
      setError('Failed to load rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
  }, []);

  return {
    rides,
    loading,
    error,
    loadRides
  };
}