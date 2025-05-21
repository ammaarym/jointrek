// PostgreSQL API client for the GatorLift application

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
 * Fetches a specific ride by ID
 * @param id The ID of the ride to fetch
 * @returns A promise that resolves to the ride or null if not found
 */
export async function fetchRideById(id: number): Promise<Ride | null> {
  try {
    const response = await fetch(`${API_URL}/rides/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch ride: ${response.status} ${response.statusText}`);
    }
    
    const ride = await response.json();
    return ride;
  } catch (error) {
    console.error("Error fetching ride:", error);
    return null;
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
      const errorData = await response.json();
      throw new Error(`Failed to create ride: ${errorData.error || response.statusText}`);
    }
    
    const ride = await response.json();
    return ride;
  } catch (error) {
    console.error("Error creating ride:", error);
    return null;
  }
}

/**
 * Updates an existing ride
 * @param id The ID of the ride to update
 * @param rideData The ride data to update
 * @returns A promise that resolves to the updated ride
 */
export async function updateRide(id: number, rideData: any): Promise<Ride | null> {
  try {
    const response = await fetch(`${API_URL}/rides/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rideData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update ride: ${response.status} ${response.statusText}`);
    }
    
    const ride = await response.json();
    return ride;
  } catch (error) {
    console.error("Error updating ride:", error);
    return null;
  }
}

/**
 * Deletes a ride
 * @param id The ID of the ride to delete
 * @returns A promise that resolves to true if successful
 */
export async function deleteRide(id: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/rides/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete ride: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting ride:", error);
    return false;
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