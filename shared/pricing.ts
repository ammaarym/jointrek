// Distance map from Gainesville to other Florida cities (in miles)
export const CITY_DISTANCES: { [key: string]: number } = {
  "Miami": 335,
  "Orlando": 115,
  "Tampa": 125,
  "Jacksonville": 72,
  "Tallahassee": 150,
  "Fort Lauderdale": 320,
  "St. Petersburg": 135,
  "Pensacola": 350,
  "West Palm Beach": 280,
  "Boca Raton": 300,
  "Sarasota": 145,
  "Clearwater": 135,
  "Daytona Beach": 90,
  "Fort Myers": 200,
  "Naples": 230,
  "Key West": 450,
  "Ocala": 35,
  "Lakeland": 105
};

// Interface for ride pricing calculation
export interface RidePricingOptions {
  origin: string;
  destination: string;
  passengers?: number;
  gasPrice?: number;
  vehicleEfficiency?: number; // miles per gallon
}

// Calculate suggested ride price based on distance, gas costs, and other factors
export function calculateRidePrice(options: RidePricingOptions): number {
  const { origin, destination, passengers = 1, gasPrice = 3.50, vehicleEfficiency = 25 } = options;
  
  // Get distance between cities
  const distance = CITY_DISTANCES[destination] || 0;
  
  if (distance === 0) {
    return 0; // Unknown route
  }
  
  // Calculate gas cost (round trip for driver)
  const roundTripDistance = distance * 2;
  const gasCost = (roundTripDistance / vehicleEfficiency) * gasPrice;
  
  // Add markup for driver profit and wear/tear (50% markup)
  const markup = 1.5;
  const totalCost = gasCost * markup;
  
  // Divide by number of passengers to get per-passenger cost
  const pricePerPassenger = totalCost / passengers;
  
  // Round to nearest dollar and ensure minimum of $5
  return Math.max(5, Math.round(pricePerPassenger));
}

// Get distance between two cities
export function getDistanceBetweenCities(origin: string, destination: string): number {
  return CITY_DISTANCES[destination] || 0;
}

// Get all available destinations from Gainesville
export function getAvailableDestinations(): string[] {
  return Object.keys(CITY_DISTANCES);
}