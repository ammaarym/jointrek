import { Ride } from "@shared/schema";

const API_URL = "/api";

/**
 * Fetches all rides from the server
 * @param origin The origin city to filter rides by
 * @param destination Optional destination city to filter rides by
 * @returns A promise that resolves to an array of rides
 */
export async function fetchRides(origin: string, destination?: string): Promise<Ride[]> {
  try {
    // Build the query parameters
    const params = new URLSearchParams();
    
    if (origin) {
      params.append('origin', origin);
    }
    
    if (destination) {
      params.append('destination', destination);
    }
    
    // Make the API request
    const response = await fetch(`${API_URL}/rides?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch rides: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response as JSON
    const rides = await response.json();
    return rides;
  } catch (error) {
    console.error("Error fetching rides:", error);
    return [];
  }
}

/**
 * Creates a new ride
 * @param rideData The ride data to create
 * @returns A promise that resolves to the created ride
 */
export async function createRide(rideData: any): Promise<Ride | null> {
  try {
    const response = await fetch(`${API_URL}/rides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rideData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create ride: ${response.status} ${response.statusText}`);
    }
    
    const ride = await response.json();
    return ride;
  } catch (error) {
    console.error("Error creating ride:", error);
    return null;
  }
}

/**
 * Fetches the current user's rides (rides they've posted as a driver)
 * @returns A promise that resolves to an array of rides
 */
export async function fetchMyRides(): Promise<Ride[]> {
  try {
    const response = await fetch(`${API_URL}/users/me/rides`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user rides: ${response.status} ${response.statusText}`);
    }
    
    const rides = await response.json();
    return rides;
  } catch (error) {
    console.error("Error fetching user rides:", error);
    return [];
  }
}