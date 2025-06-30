import { useState } from 'react';
import { Ride } from '@shared/schema';
import sarahChenPhoto from '@assets/sahara_1750977162888.png';
import alexJohnsonPhoto from '@assets/alex_1750977185241.png';
import marcusJohnsonPhoto from '@assets/marcus_1750976723565.png';
import emilyRodriguezPhoto from '@assets/emily_1750977859226.png';
import vanessaRamirezPhoto from '@assets/vanesa_1750978625848.png';

import { auth } from '@/lib/firebase';

// Helper function to make API requests with Firebase auth
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  let headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Get Firebase auth token
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers = {
        ...headers,
        'Authorization': `Bearer ${token}`
      };
    }
  } catch (authError) {
    console.error('Error getting auth token:', authError);
    throw new Error('Authentication failed. Please try signing in again.');
  }

  const response = await fetch(url, {
    ...options,
    headers,
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
            createdAt: new Date(),
            driverId: "mock_driver_1",
            origin: { city: "Gainesville", area: "University of Florida" },
            destination: { city: "Orlando", area: "UCF Student Union" },
            departureTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            arrivalTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
            seatsTotal: 4,
            seatsLeft: 2,
            price: "25",
            genderPreference: "any",
            carMake: "Honda",
            carModel: "Civic",
            carYear: 2020,
            notes: "Comfortable ride to Orlando! Clean car with AC.",
            rideType: "driver",
            baggageCheckIn: 1,
            baggagePersonal: 2,
            isCompleted: false,
            driver: {
              name: "Sarah Chen",
              email: "sarah.chen@ufl.edu",
              photoUrl: sarahChenPhoto,
              phone: "(352) 555-0101",
              instagram: "",
              snapchat: "",
              rating: 4.8,
              totalRides: 15
            },
            verificationCode: null,
            verificationCodeCreatedAt: null,
            isStarted: false,
            startVerificationCode: null,
            startCodeCreatedAt: null,
            carColor: "Blue",
            cancellationReason: null
          },
          {
            id: 1002,
            createdAt: new Date(),
            driverId: "mock_driver_2",
            origin: { city: "Gainesville", area: "University of Florida" },
            destination: { city: "Miami", area: "The Underline" },
            departureTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            arrivalTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            seatsTotal: 3,
            seatsLeft: 1,
            price: "45",
            genderPreference: "male_only",
            carMake: "Toyota",
            carModel: "Camry",
            carYear: 2019,
            notes: "Direct route to Miami. Good music and conversation!",
            rideType: "driver",
            baggageCheckIn: 2,
            baggagePersonal: 3,
            isCompleted: false,
            driver: {
              name: "Marcus Johnson",
              email: "marcus.johnson@ufl.edu",
              photoUrl: marcusJohnsonPhoto,
              phone: "(352) 555-0102",
              instagram: "",
              snapchat: "",
              rating: 4.9,
              totalRides: 23
            },
            verificationCode: null,
            verificationCodeCreatedAt: null,
            isStarted: false,
            startVerificationCode: null,
            startCodeCreatedAt: null,
            carColor: "Silver",
            cancellationReason: null
          },
          {
            id: 1003,
            createdAt: new Date(),
            driverId: "mock_driver_3",
            origin: { city: "Gainesville", area: "University of Florida" },
            destination: { city: "Tampa", area: "USF Library" },
            departureTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            arrivalTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
            seatsTotal: 4,
            seatsLeft: 3,
            price: "35",
            genderPreference: "female_only",
            carMake: "Mazda",
            carModel: "CX-5",
            carYear: 2021,
            notes: "Safe ride for female students. Non-smoking vehicle.",
            rideType: "driver",
            baggageCheckIn: 0,
            baggagePersonal: 4,
            isCompleted: false,
            driver: {
              name: "Emily Rodriguez",
              email: "emily.rodriguez@ufl.edu",
              photoUrl: emilyRodriguezPhoto,
              phone: "(352) 555-0103",
              instagram: "",
              snapchat: "",
              rating: 4.7,
              totalRides: 18
            },
            verificationCode: null,
            verificationCodeCreatedAt: null,
            isStarted: false,
            startVerificationCode: null,
            startCodeCreatedAt: null,
            carColor: "Red",
            cancellationReason: null
          },
          {
            id: 1004,
            createdAt: new Date(),
            driverId: "mock_driver_4",
            origin: { city: "Gainesville", area: "University of Florida" },
            destination: { city: "Jacksonville", area: "St. Johns Town Center" },
            departureTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
            arrivalTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000),
            seatsTotal: 4,
            seatsLeft: 2,
            price: "30",
            genderPreference: "any",
            carMake: "Ford",
            carModel: "Focus",
            carYear: 2018,
            notes: "Quick trip to Jacksonville for the weekend.",
            rideType: "driver",
            baggageCheckIn: 1,
            baggagePersonal: 2,
            isCompleted: false,
            driver: {
              name: "Alex Johnson",
              email: "alex.johnson@ufl.edu",
              photoUrl: alexJohnsonPhoto,
              phone: "(352) 555-0104",
              instagram: "",
              snapchat: "",
              rating: 4.6,
              totalRides: 12
            },
            verificationCode: null,
            verificationCodeCreatedAt: null,
            isStarted: false,
            startVerificationCode: null,
            startCodeCreatedAt: null,
            carColor: "Black",
            cancellationReason: null
          },
          {
            id: 1005,
            createdAt: new Date(),
            driverId: "mock_driver_5",
            origin: { city: "Gainesville", area: "University of Florida" },
            destination: { city: "Fort Lauderdale", area: "Holiday Park" },
            departureTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            arrivalTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000),
            seatsTotal: 3,
            seatsLeft: 1,
            price: "50",
            genderPreference: "any",
            carMake: "Nissan",
            carModel: "Altima",
            carYear: 2022,
            notes: "Heading to Fort Lauderdale for spring break. Reliable driver!",
            rideType: "driver",
            baggageCheckIn: 2,
            baggagePersonal: 3,
            isCompleted: false,
            driver: {
              name: "Vanessa Ramirez",
              email: "vanessa.ramirez@ufl.edu",
              photoUrl: vanessaRamirezPhoto,
              phone: "(352) 555-0105",
              instagram: "",
              snapchat: "",
              rating: 4.9,
              totalRides: 27
            },
            verificationCode: null,
            verificationCodeCreatedAt: null,
            isStarted: false,
            startVerificationCode: null,
            startCodeCreatedAt: null,
            carColor: "White",
            cancellationReason: null
          }
        ];
        
        console.log('No real rides found, displaying mock rides for demonstration');
        setRides(mockRides as any);
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