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
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        rideData: rideData,
        rideId: id
      });
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

  const loadAllRides = async (forceReload = true, origin = 'Gainesville', destination?: string) => {
    // Always reload to ensure fresh data
    console.log('Loading all rides from:', origin, 'to:', destination || 'any destination');
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({ origin });
      if (destination && destination !== 'any') {
        params.append('destination', destination);
      }
      
      const response = await fetch(`/api/rides?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch all rides: ${response.status}`);
      }
      
      const allRides = await response.json();
      console.log('Loaded all rides:', allRides);
      
      // If no real rides found, add mock data for demonstration
      if (allRides.length === 0) {
        const mockRides = [
          {
            id: 1001,
            driverName: "Sarah Chen",
            driverFirebaseUid: "mock_driver_1",
            driverPhotoUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b1c0?w=100&h=100&fit=crop&crop=face",
            driverPhone: "(352) 555-0101",
            driverEmail: "sarah.chen@ufl.edu",
            origin: "Gainesville",
            destination: "Orlando",
            departureTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
            arrivalTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
            seatsTotal: 4,
            seatsLeft: 2,
            price: 25,
            genderPreference: "Any",
            carMake: "Honda",
            carModel: "Civic",
            carYear: 2020,
            carColor: "Blue",
            notes: "Comfortable ride to Orlando! Clean car with AC.",
            createdAt: new Date().toISOString(),
            rideType: "driver",
            baggageCapacity: 2,
            averageRating: 4.8,
            totalRides: 15
          },
          {
            id: 1002,
            driverName: "Marcus Johnson",
            driverFirebaseUid: "mock_driver_2",
            driverPhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
            driverPhone: "(352) 555-0102",
            driverEmail: "marcus.johnson@ufl.edu",
            origin: "Gainesville",
            destination: "Miami",
            departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            arrivalTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
            seatsTotal: 3,
            seatsLeft: 1,
            price: 45,
            genderPreference: "Any",
            carMake: "Toyota",
            carModel: "Camry",
            carYear: 2019,
            carColor: "Silver",
            notes: "Direct route to Miami. Good music and conversation!",
            createdAt: new Date().toISOString(),
            rideType: "driver",
            baggageCapacity: 3,
            averageRating: 4.9,
            totalRides: 23
          },
          {
            id: 1003,
            driverName: "Emily Rodriguez",
            driverFirebaseUid: "mock_driver_3",
            driverPhotoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
            driverPhone: "(352) 555-0103",
            driverEmail: "emily.rodriguez@ufl.edu",
            origin: "Gainesville",
            destination: "Tampa",
            departureTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
            arrivalTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000).toISOString(), // +2.5 hours
            seatsTotal: 4,
            seatsLeft: 3,
            price: 35,
            genderPreference: "Female Only",
            carMake: "Mazda",
            carModel: "CX-5",
            carYear: 2021,
            carColor: "Red",
            notes: "Safe ride for female students. Non-smoking vehicle.",
            createdAt: new Date().toISOString(),
            rideType: "driver",
            baggageCapacity: 4,
            averageRating: 4.7,
            totalRides: 18
          },
          {
            id: 1004,
            driverName: "Alex Thompson",
            driverFirebaseUid: "mock_driver_4",
            driverPhotoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
            driverPhone: "(352) 555-0104",
            driverEmail: "alex.thompson@ufl.edu",
            origin: "Gainesville",
            destination: "Jacksonville",
            departureTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
            arrivalTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000).toISOString(), // +1.5 hours
            seatsTotal: 4,
            seatsLeft: 2,
            price: 30,
            genderPreference: "Male Only",
            carMake: "Ford",
            carModel: "Focus",
            carYear: 2018,
            carColor: "Black",
            notes: "Quick trip to Jacksonville for the weekend.",
            createdAt: new Date().toISOString(),
            rideType: "driver",
            baggageCapacity: 2,
            averageRating: 4.6,
            totalRides: 12
          },
          {
            id: 1005,
            driverName: "Jessica Park",
            driverFirebaseUid: "mock_driver_5",
            driverPhotoUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face",
            driverPhone: "(352) 555-0105",
            driverEmail: "jessica.park@ufl.edu",
            origin: "Gainesville",
            destination: "Fort Lauderdale",
            departureTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            arrivalTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000).toISOString(), // +4.5 hours
            seatsTotal: 3,
            seatsLeft: 1,
            price: 50,
            genderPreference: "Any",
            carMake: "Nissan",
            carModel: "Altima",
            carYear: 2022,
            carColor: "White",
            notes: "Heading to Fort Lauderdale for spring break. Reliable driver!",
            createdAt: new Date().toISOString(),
            rideType: "driver",
            baggageCapacity: 3,
            averageRating: 4.9,
            totalRides: 27
          }
        ];
        
        console.log('No real rides found, displaying mock rides for demonstration');
        setRides(mockRides);
      } else {
        setRides(allRides);
      }
    } catch (err: any) {
      console.error('Error loading all rides:', err);
      setError(err.message || 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  return {
    myRides,
    rides,
    loading,
    error,
    createRide,
    loadMyRides,
    loadAllRides,
    updateRide,
    removeRide
  };
}